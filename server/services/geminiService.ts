import { GoogleGenAI } from '@google/genai';
import { ENV } from '../config/env';

const apiKey = ENV.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

export interface VoiceRegistrationExtracted {
  name: string;
  primarySkill: string;
  secondarySkills: string[];
  experienceYears: number;
  location: string;
  confidence: number;
  transcript: string;
  phone?: string;
  dailyWageExpected?: number;
}

const CANONICAL_TRADE_SKILLS = [
  'Electrician',
  'Plumber',
  'Mason',
  'Painter',
  'Carpenter',
  'Welder',
  'Driver',
  'Domestic Help',
  'AC Technician',
  'Tile & Marble Setter',
  'Gardener',
  'Appliance Repair'
] as const;

const DIGIT_WORD_MAP: Record<string, string> = {
  zero: '0', oh: '0', nought: '0',
  one: '1', two: '2', three: '3', four: '4', five: '5',
  six: '6', seven: '7', eight: '8', nine: '9',
  'शून्य': '0', 'सिफर': '0',
  'एक': '1', 'दो': '2', 'दोन': '2', 'तीन': '3', 'चार': '4',
  'पाँच': '5', 'पांच': '5', 'पाच': '5',
  'छह': '6', 'छः': '6', 'सहा': '6',
  'सात': '7', 'आठ': '8', 'नौ': '9', 'नऊ': '9'
};

const NAME_TRAILING_STOP = /^(है|आहे|हूँ|हूं|बोल|कर|से|था|आहेत|here|is|am|and|from|i|मैं|मी|an|a|the)$/i;

function indianMobileDigits(raw: string): string | undefined {
  let digits = (raw || '').replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length === 11) digits = digits.slice(1);
  if (/^[6-9]\d{9}$/.test(digits)) return digits;
  return undefined;
}

export function canonicalizeIndianPhone(raw: string | undefined | null): string | undefined {
  if (raw == null) return undefined;
  const digits = indianMobileDigits(String(raw));
  return digits ? `+91${digits}` : undefined;
}

function looksLikeIndianMobileNumber(value: number | string): boolean {
  const digits = String(value).replace(/\D/g, '');
  return indianMobileDigits(digits) !== undefined && digits.replace(/^91/, '').length >= 10;
}

function extractSpokenDigitRuns(text: string): string[] {
  const tokens = (text || '').split(/[\s,،،/\\.|।]+/).filter(Boolean);
  const runs: string[] = [];
  let current = '';

  for (const token of tokens) {
    const lower = token.toLowerCase();
    if (/^\d$/.test(token)) {
      current += token;
      continue;
    }
    if (DIGIT_WORD_MAP[lower] != null) {
      current += DIGIT_WORD_MAP[lower];
      continue;
    }
    if (DIGIT_WORD_MAP[token] != null) {
      current += DIGIT_WORD_MAP[token];
      continue;
    }
    if (current) {
      runs.push(current);
      current = '';
    }
  }
  if (current) runs.push(current);
  return runs;
}

function extractPhoneFromText(text: string): string | undefined {
  if (!text) return undefined;

  const compact = text.replace(/[\s-]/g, '');
  const grouped = text.match(/(?:\+?91[\s-]*)?[6-9](?:[\s-]?\d){9}/g) || [];
  for (const candidate of grouped) {
    const canonical = canonicalizeIndianPhone(candidate);
    if (canonical) return canonical;
  }

  const packed = compact.match(/(?:\+?91)?[6-9]\d{9}/g) || [];
  for (const candidate of packed) {
    const canonical = canonicalizeIndianPhone(candidate);
    if (canonical) return canonical;
  }

  for (const run of extractSpokenDigitRuns(text)) {
    const canonical = canonicalizeIndianPhone(run);
    if (canonical) return canonical;
  }

  return undefined;
}

function extractDailyWageFromText(text: string): number | undefined {
  if (!text) return undefined;

  const patterns = [
    /(?:₹|rs\.?|inr|rupees?|रुपये|रुपए|रु\.?)\s*(\d{2,5})/i,
    /(\d{2,5})\s*(?:₹|rs\.?|inr|rupees?|रुपये|रुपए|रु\.?|\/\s*day|per\s*day|a\s*day|रोज|प्रति\s*दिन)/i,
    /(?:daily\s*wage|expected\s*wage|expected\s*salary|wage|wages|salary|rate|मजदूरी|वेतन|दिहाड़ी|दिहाडी|रेट|उम्मीद)\s*(?:is|of|of\s*rs\.?|:)?\s*(?:₹|rs\.?)?\s*(\d{2,5})/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;
    const amount = Number.parseInt(match[1], 10);
    if (!Number.isFinite(amount) || amount < 0 || amount > 100000) continue;
    if (looksLikeIndianMobileNumber(amount)) continue;
    return amount;
  }

  return undefined;
}

function cleanNameCandidate(raw: string): string {
  const words = (raw || '').split(/\s+/).filter(Boolean);
  const kept: string[] = [];
  for (const word of words) {
    if (NAME_TRAILING_STOP.test(word)) break;
    if (/^(electrician|plumber|carpenter|painter|mason|welder|driver|from|in)$/i.test(word)) break;
    kept.push(word.replace(/[.,;:]+$/g, ''));
    if (kept.length >= 4) break;
  }
  return kept.join(' ').trim();
}

function constrainNameToTranscript(name: string, transcript: string): string {
  const trimmed = (name || '').trim();
  if (!trimmed) return '';
  const spoken = (transcript || '').trim();
  if (!spoken) return trimmed;

  if (spoken.toLowerCase().includes(trimmed.toLowerCase())) return trimmed;

  const nameIsLatin = /[A-Za-z]/.test(trimmed);
  const transcriptIsLatin = /[A-Za-z]/.test(spoken);
  if (nameIsLatin !== transcriptIsLatin) return trimmed;

  const kept = trimmed.split(/\s+/).filter((token) => spoken.toLowerCase().includes(token.toLowerCase()));
  return kept.join(' ').trim();
}

export function sanitizeWageValue(
  raw: unknown,
  phone?: string
): number | undefined {
  if (raw == null || raw === '') return undefined;
  const numeric = typeof raw === 'number' ? raw : Number(String(raw).replace(/[^\d.-]/g, ''));
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 100000) return undefined;
  if (looksLikeIndianMobileNumber(numeric)) return undefined;
  if (phone) {
    const phoneDigits = phone.replace(/\D/g, '');
    const wageDigits = String(Math.trunc(numeric));
    if (phoneDigits.endsWith(wageDigits) && wageDigits.length >= 8) return undefined;
  }
  return numeric;
}

// Multilingual Indian Trade & Entity Knowledge Base
const INDIAN_CITIES_MAP: Record<string, string> = {
  'नागपुर': 'Nagpur', 'पुणे': 'Pune', 'मुंबई': 'Mumbai', 'दिल्ली': 'Delhi',
  'नोएडा': 'Noida', 'गुरुग्राम': 'Gurugram', 'बेंगलुरु': 'Bengaluru', 'बैंगलोर': 'Bengaluru',
  'हैदराबाद': 'Hyderabad', 'चेन्नई': 'Chennai', 'कोलकाता': 'Kolkata', 'अहमदाबाद': 'Ahmedabad',
  'जयपुर': 'Jaipur', 'सूरत': 'Surat', 'लखनऊ': 'Lucknow', 'कानपुर': 'Kanpur',
  'इंदौर': 'Indore', 'भोपाल': 'Bhopal', 'पटना': 'Patna', 'नाशिक': 'Nashik',
  'ठाणे': 'Thane', 'औरंगाबाद': 'Aurangabad', 'वडोदरा': 'Vadodara', 'कोयंबटूर': 'Coimbatore',
  'चंडीगढ़': 'Chandigarh', 'लुधियाना': 'Ludhiana', 'वाराणसी': 'Varanasi', 'आगरा': 'Agra'
};

const SECONDARY_SKILLS_BY_TRADE: Record<string, string[]> = {
  Electrician: ['House Wiring', 'Inverter Fitting', 'MCB Installation', 'Appliance Testing'],
  Plumber: ['Pipe Fitting', 'Tap & Mixer Repair', 'Bathroom Sanitary', 'Overhead Tank Connection'],
  Carpenter: ['Modular Furniture', 'Door & Window Fitting', 'Plywood Work', 'Lock Installation'],
  Painter: ['Wall Putty', 'Texture Paint', 'Waterproofing', 'Primer & Emulsion'],
  Mason: ['Brickwork', 'Plastering', 'Concrete Slab', 'Foundations'],
  Welder: ['MIG Welding', 'Iron Grill Fabrication', 'Gate Making', 'Structural Steel'],
  Driver: ['Commercial Vehicle', 'City Navigation', 'Highway Driving', 'Vehicle Maintenance'],
  'Domestic Help': ['Home Cooking', 'Deep Cleaning', 'Elderly Care', 'Kitchen Management'],
  'AC Technician': ['Split AC Installation', 'Gas Refill (R32/R410)', 'Compressor Diagnostics', 'Filter Service'],
  'Tile & Marble Setter': ['Floor Tiling', 'Marble Cutting & Polishing', 'Granite Countertops', 'Grouting'],
  Gardener: ['Lawn Maintenance', 'Pruning & Trimming', 'Organic Fertilization', 'Drip Irrigation'],
  'Appliance Repair': ['Washing Machine', 'Microwave Oven', 'Refrigerator Repair', 'Geyser Installation']
};

const NUMBER_WORDS_MAP: Record<string, number> = {
  'एक': 1, 'दोन': 2, 'दो': 2, 'तीन': 3, 'चार': 4, 'पाँच': 5, 'पांच': 5,
  'सहा': 6, 'छह': 6, 'सात': 7, 'आठ': 8, 'नऊ': 9, 'नौ': 9, 'दहा': 10, 'दस': 10,
  'अकरा': 11, 'ग्यारह': 11, 'बारा': 12, 'बारह': 12, 'पंधरा': 15, 'पंद्रह': 15, 'वीस': 20, 'बीस': 20,
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7,
  'eight': 8, 'nine': 9, 'ten': 10, 'eleven': 11, 'twelve': 12, 'fifteen': 15, 'twenty': 20
};

export function extractWorkerProfileFromText(
  rawText: string,
  preferredLang = 'hi'
): VoiceRegistrationExtracted {
  const text = (rawText || '').trim();

  // 1. Extract Name — only tokens actually present in speech; never invent a surname
  let detectedName = '';
  const namePatterns = [
    /(?:मेरा नाम|माझं नाव|माझे नाव|என் பெயர்|నా పేరు|আমার নাম|ਮੇਰਾ ਨਾਮ|نام|my name is|i am|this is|myself)\s+([^\s,।\n]+(?:\s+[^\s,।\n]+){0,3})/i,
    /(?:मैं|मी)\s+([^\s,।\n]+(?:\s+[^\s,।\n]+){0,3})\s+(?:बोल रहा|बोल रही|हूँ|हूं|आहे|here)/i,
    /(?:call me|नाम है)\s+([^\s,।\n]+(?:\s+[^\s,।\n]+){0,3})/i
  ];

  for (const pat of namePatterns) {
    const match = text.match(pat);
    if (match && match[1]) {
      detectedName = cleanNameCandidate(match[1]);
      if (detectedName) break;
    }
  }

  if (!detectedName) {
    // If text starts with 2 capitalized or Devanagari words before a comma
    const leadingWordsMatch = text.match(/^([A-Z\u0900-\u097F][^\s,।]+(?:\s+[A-Z\u0900-\u097F][^\s,।]+){0,2})\s*[,।]/);
    if (leadingWordsMatch && leadingWordsMatch[1]) {
      detectedName = cleanNameCandidate(leadingWordsMatch[1]);
    }
  }

  // 2. Extract Skill / Trade
  let primarySkill = 'Electrician';
  const skillRules: Array<{ skill: string; regex: RegExp }> = [
    { skill: 'Plumber', regex: /प्लंबर|प्लम्बर|नल|plumb|पानी|पाइप|pipe|leak|tap|सैनिटरी|टैंक|drain|वाटर|लीकेज/i },
    { skill: 'Carpenter', regex: /बढ़ई|सुतार|सुतारकाम|लकड़ी|carpenter|wood|furniture|प्लाई|plywood|दरवाजा|table/i },
    { skill: 'Painter', regex: /पेंटर|रंगकाम|पेंट|रंग|paint|putty|पुट्टी|varnish|wall|कलर/i },
    { skill: 'Mason', regex: /राजमिस्त्री|मेसन|गवंडी|mason|सीमेंट|ईंट|brick|plaster|प्लास्टर|गाड़ा|चिनाई/i },
    { skill: 'Welder', regex: /वेल्डर|weld|लोहा|iron|grill|गेट|शटर|फैब्रिकेशन/i },
    { skill: 'Driver', regex: /ड्राइवर|गाड़ी|कार|driver|cab|auto|taxi|four wheeler|चालक/i },
    { skill: 'AC Technician', regex: /एसी|ac\b|air condition|fridge|refrigerator|कूलर|chiller|hvac/i },
    { skill: 'Domestic Help', regex: /घरेलू|कामवाली|बाई|maid|clean|झाड़ू|पोछा|cook|खाना|बर्तन|house help/i },
    { skill: 'Tile & Marble Setter', regex: /टाइल|tile|marble|मार्बल|पत्थर|flooring|ग्रेनाइट|granite/i },
    { skill: 'Gardener', regex: /माली|gardener|बागवानी|पौधे|lawn|grass/i },
    { skill: 'Appliance Repair', regex: /अपार्टमेंट|उपकरण|mixer|वाशिंग मशीन|washing machine|microwave|गीजर|geyser|repair/i },
    { skill: 'Electrician', regex: /बिजली|इलेक्ट्रीशियन|इलेक्ट्रिशियन|वायरिंग|वायरमैन|electric|वायर|wire|fuse|switchboard|lighting|inverter|mcb/i }
  ];

  for (const rule of skillRules) {
    if (rule.regex.test(text)) {
      primarySkill = rule.skill;
      break;
    }
  }

  // 3. Extract Experience Years
  let experienceYears = 5;
  const expMatch = text.match(/(\d{1,2})\s*(?:साल|वर्ष|वर्षांचा|सालों|years?|yrs?|yr)/i);
  if (expMatch && expMatch[1]) {
    experienceYears = Math.min(40, Math.max(1, parseInt(expMatch[1], 10)));
  } else {
    // Word numbers check
    for (const [w, n] of Object.entries(NUMBER_WORDS_MAP)) {
      const wRegex = new RegExp(`\\b${w}\\s*(?:साल|वर्ष|वर्षांचा|सालों|years?|yrs?)\\b`, 'i');
      if (wRegex.test(text)) {
        experienceYears = n;
        break;
      }
    }
  }

  // 4. Extract Location
  let location = 'Nagpur';
  for (const [hiName, enName] of Object.entries(INDIAN_CITIES_MAP)) {
    if (new RegExp(hiName, 'i').test(text)) {
      location = enName;
      break;
    }
  }
  if (location === 'Nagpur') {
    const cityList = [
      'Nagpur', 'Mumbai', 'Pune', 'Nashik', 'Thane', 'Aurangabad', 'Delhi', 'New Delhi',
      'Noida', 'Gurugram', 'Bengaluru', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata',
      'Ahmedabad', 'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Indore', 'Bhopal', 'Patna'
    ];
    for (const c of cityList) {
      if (new RegExp(`\\b${c}\\b`, 'i').test(text)) {
        location = c === 'Bangalore' ? 'Bengaluru' : c === 'New Delhi' ? 'Delhi' : c;
        break;
      }
    }
  }

  const secondarySkills = SECONDARY_SKILLS_BY_TRADE[primarySkill] || ['Maintenance', 'Field Repair'];
  const confidence = detectedName && primarySkill && expMatch ? 0.96 : 0.88;
  const phone = extractPhoneFromText(text);
  const dailyWageExpected = extractDailyWageFromText(text);

  const extracted: VoiceRegistrationExtracted = {
    name: detectedName,
    primarySkill,
    secondarySkills,
    experienceYears,
    location,
    confidence,
    transcript: text
  };

  if (phone) extracted.phone = phone;
  if (dailyWageExpected !== undefined) extracted.dailyWageExpected = dailyWageExpected;

  return extracted;
}

export function normalizeVoiceRegistrationResult(
  parsed: unknown,
  transcript: string,
  languageCode = 'hi'
): VoiceRegistrationExtracted {
  const parsedObj = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  const parsedTranscript = typeof parsedObj.transcript === 'string' ? parsedObj.transcript : '';
  const spoken = (transcript || parsedTranscript || '').trim();
  const nlu = extractWorkerProfileFromText(spoken, languageCode);

  const geminiName = typeof parsedObj.name === 'string' ? parsedObj.name.trim() : '';
  const name = nlu.name || constrainNameToTranscript(geminiName, spoken);

  const geminiSkill = typeof parsedObj.primarySkill === 'string' ? parsedObj.primarySkill.trim() : '';
  const primarySkill = (CANONICAL_TRADE_SKILLS as readonly string[]).includes(geminiSkill)
    ? geminiSkill
    : nlu.primarySkill;

  let experienceYears = nlu.experienceYears;
  if (parsedObj.experienceYears != null && parsedObj.experienceYears !== '') {
    const parsedExp = Number(parsedObj.experienceYears);
    if (Number.isFinite(parsedExp)) {
      experienceYears = Math.min(40, Math.max(0, parsedExp));
    }
  }

  const geminiLocation = typeof parsedObj.location === 'string' ? parsedObj.location.trim() : '';
  const location = geminiLocation || nlu.location;

  const nluPhone = nlu.phone;
  const phone = nluPhone;

  const nluWage = nlu.dailyWageExpected;
  const dailyWageExpected = nluWage;

  const secondarySkills = Array.isArray(parsedObj.secondarySkills)
    ? parsedObj.secondarySkills.filter((item): item is string => typeof item === 'string')
    : [];

  const parsedConfidence = Number(parsedObj.confidence);

  const result: VoiceRegistrationExtracted = {
    name,
    primarySkill,
    secondarySkills: secondarySkills.length > 0 ? secondarySkills : nlu.secondarySkills,
    experienceYears,
    location,
    confidence: Number.isFinite(parsedConfidence) ? parsedConfidence : nlu.confidence,
    transcript: spoken || nlu.transcript
  };

  if (phone) result.phone = phone;
  if (dailyWageExpected !== undefined) result.dailyWageExpected = dailyWageExpected;

  return result;
}

export async function processVoiceRegistration(
  audioBase64?: string,
  mimeType = 'audio/webm',
  textInput?: string,
  languageCode = 'hi'
): Promise<VoiceRegistrationExtracted> {
  const cleanInputText = (textInput || '').trim();

  // 1. Try Gemini Cloud API with retry if key exists (skip during vitest)
  if (ai && !process.env.VITEST) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

        if (audioBase64) {
          const cleanBase64 = audioBase64.includes('base64,')
            ? audioBase64.split('base64,')[1]
            : audioBase64;
          parts.push({
            inlineData: {
              mimeType: mimeType || 'audio/webm',
              data: cleanBase64
            }
          });
        }

        const prompt = `
You are the voice registration engine for SkillBridge, India's voice-first hiring platform for informal workers.
${cleanInputText ? `Worker speech transcription / text: "${cleanInputText}". Spoken language: ${languageCode}.` : `Listen to this audio recorded by an Indian informal worker (speaking in ${languageCode} or Hindi/Marathi/Tamil/Telugu/English).`}

Extract only facts that are clearly present in the speech. Never invent, guess, or complete missing values.
1. name: The worker's name exactly as spoken. Include a surname only if the worker said it. If the name is absent, use "".
2. primarySkill: One of [Electrician, Plumber, Mason, Painter, Carpenter, Welder, Driver, Domestic Help, AC Technician, Tile & Marble Setter, Gardener, Appliance Repair]
3. secondarySkills: string[] of 3-4 realistic related trade sub-skills
4. experienceYears: number (extracted years of experience)
5. location: City or district in India (e.g., Nagpur, Pune, Mumbai, Delhi, Bengaluru, Hyderabad, Chennai)
6. phone: Indian mobile number digits exactly as spoken (including digit-by-digit speech). Use "" if not stated. Never generate a number.
7. dailyWageExpected: expected daily wage in INR as a number if stated. Use null if not stated. Never copy a phone number into this field.
8. confidence: number between 0.80 and 0.99
9. transcript: accurate transcript of what the worker said in their original language

Return pure JSON:
{
  "name": "string",
  "primarySkill": "string",
  "secondarySkills": ["string"],
  "experienceYears": number,
  "location": "string",
  "phone": "string",
  "dailyWageExpected": number_or_null,
  "confidence": number,
  "transcript": "string"
}
`;
        parts.push({ text: prompt });

        const response = await ai.models.generateContent({
          model: ENV.GEMINI_MODEL,
          contents: { parts },
          config: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        });

        if (response.text) {
          let parsed: unknown;
          try {
            parsed = JSON.parse(response.text);
          } catch {
            parsed = null;
          }
          if (parsed && typeof parsed === 'object') {
            const transcript = cleanInputText || (typeof (parsed as { transcript?: unknown }).transcript === 'string'
              ? (parsed as { transcript: string }).transcript
              : '');
            return normalizeVoiceRegistrationResult(parsed, transcript, languageCode);
          }
        }
      } catch (err: any) {
        if (attempt === 0 && (err?.message?.includes('503') || err?.status === 503)) {
          // Wait 800ms before quick retry
          await new Promise((r) => setTimeout(r, 800));
          continue;
        }
        console.warn('Gemini voice processing fallback to high-fidelity NLU extractor:', err?.message || err);
        break;
      }
    }
  }

  // 2. Intelligent Multilingual Indian NLU Fallback — parse only actual speech, never a fabricated sample
  return extractWorkerProfileFromText(cleanInputText, languageCode);
}

export async function processVoiceJobMatch(
  audioBase64?: string,
  textInput?: string
): Promise<{
  skillRequired: string;
  urgency: string;
  durationDays: number;
  dailyBudget: number;
  description: string;
  explanationSnippet: string;
}> {
  if (ai && !process.env.VITEST) {
    try {
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
      if (audioBase64) {
        const cleanBase64 = audioBase64.includes('base64,')
          ? audioBase64.split('base64,')[1]
          : audioBase64;
        parts.push({
          inlineData: {
            mimeType: 'audio/webm',
            data: cleanBase64
          }
        });
      }

      const prompt = `
An employer in India recorded this voice requirement for hiring informal workers.
${textInput ? `Employer input: "${textInput}".` : 'Listen to this audio.'}

Extract:
- skillRequired: Primary trade needed (Electrician, Plumber, Mason, Painter, Carpenter, Welder, Driver, Domestic Help, AC Technician, Tile & Marble Setter)
- urgency: "immediate" | "within_3_days" | "flexible"
- durationDays: number (default 3)
- dailyBudget: number in INR (default 850)
- description: concise summary of the job
- explanationSnippet: why this job matches candidates

Return pure JSON:
{
  "skillRequired": "string",
  "urgency": "string",
  "durationDays": number,
  "dailyBudget": number,
  "description": "string",
  "explanationSnippet": "string"
}
`;
      parts.push({ text: prompt });

      const response = await ai.models.generateContent({
        model: ENV.GEMINI_MODEL,
        contents: { parts },
        config: { responseMimeType: 'application/json' }
      });

      if (response.text) {
        return JSON.parse(response.text);
      }
    } catch (err) {
      console.warn('Gemini voice job match failed, fallback to heuristic:', err);
    }
  }

  // Dynamic Fallback Parser
  const text = (textInput || '').trim();
  let skillRequired = 'Electrician';
  if (/plumb|नल|पाइप|पाइपलाइन|प्लंबर/i.test(text)) skillRequired = 'Plumber';
  else if (/carpenter|लकड़ी|सुतार|फर्नीचर/i.test(text)) skillRequired = 'Carpenter';
  else if (/paint|पेंट|रंग/i.test(text)) skillRequired = 'Painter';
  else if (/mason|मेसन|राजमिस्त्री|ईंट/i.test(text)) skillRequired = 'Mason';
  else if (/weld|वेल्डर|लोहा/i.test(text)) skillRequired = 'Welder';
  else if (/driver|ड्राइवर|गाड़ी/i.test(text)) skillRequired = 'Driver';
  else if (/maid|cook|सफाई|खाना|घरेलू/i.test(text)) skillRequired = 'Domestic Help';
  else if (/ac|कूलर|fridge/i.test(text)) skillRequired = 'AC Technician';

  let dailyBudget = 850;
  const budgetMatch = text.match(/(?:₹|rs\.?|रुपये|budget|rate)\s*(\d{3,4})|(\d{3,4})\s*(?:₹|rs\.?|रुपये|\/day|per day)/i);
  if (budgetMatch) {
    dailyBudget = parseInt(budgetMatch[1] || budgetMatch[2], 10);
  }

  let durationDays = 3;
  const durMatch = text.match(/(\d{1,2})\s*(?:days?|दिन|दिवस)/i);
  if (durMatch) {
    durationDays = parseInt(durMatch[1], 10);
  }

  const urgency = /urgent|immediately|कल|आज|urgent|emergency|now|तुरंत/i.test(text)
    ? 'immediate'
    : 'within_3_days';

  return {
    skillRequired,
    urgency,
    durationDays,
    dailyBudget,
    description: text || `Requirement for skilled ${skillRequired} for ${durationDays} days at ₹${dailyBudget}/day.`,
    explanationSnippet: `Matched top-rated candidates with verified badges for ${skillRequired} within active radius.`
  };
}

export async function generateWorkerSummary(workerData: {
  name: string;
  skill: string;
  experienceYears: number;
  totalJobs: number;
  rating: number;
  badges: string[];
  city: string;
}): Promise<{ summaryEnglish: string; summaryHindi: string }> {
  if (ai && !process.env.VITEST) {
    try {
      const prompt = `
Generate a respectful, professional 2-sentence summary in English and Hindi for this Indian worker on SkillBridge:
Worker Name: ${workerData.name}
Skill: ${workerData.skill}
Experience: ${workerData.experienceYears} years
Total Jobs Completed: ${workerData.totalJobs}
Rating: ${workerData.rating}/5.0
Badges: ${workerData.badges.join(', ')}
City: ${workerData.city}

Return pure JSON:
{
  "summaryEnglish": "string",
  "summaryHindi": "string"
}
`;
      const response = await ai.models.generateContent({
        model: ENV.GEMINI_MODEL,
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      if (response.text) {
        return JSON.parse(response.text);
      }
    } catch {}
  }

  return {
    summaryEnglish: `${workerData.name} is a highly rated ${workerData.skill} in ${workerData.city} with ${workerData.experienceYears} years of craftsmanship and ${workerData.totalJobs}+ verified jobs. Rated ${workerData.rating}★ with verified credentials.`,
    summaryHindi: `${workerData.name} ${workerData.city} के एक अनुभवी ${workerData.skill} हैं, जिन्हें ${workerData.experienceYears} वर्षों का तजुर्बा और ${workerData.totalJobs}+ सफल कामों का अनुभव है।`
  };
}
