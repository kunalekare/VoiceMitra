import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Server-side Gemini initialization with telemetry header
const geminiApiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (geminiApiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiApiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// 1. Voice Registration: Speech-to-Text & Entity Extraction
app.post('/api/gemini/voice-registration', async (req: Request, res: Response) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', textInput, languageCode = 'hi' } = req.body;

    // If Gemini API is configured
    if (ai) {
      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

      if (audioBase64) {
        // Strip data:audio/xxx;base64, prefix if present
        const cleanBase64 = audioBase64.includes('base64,')
          ? audioBase64.split('base64,')[1]
          : audioBase64;
        parts.push({
          inlineData: {
            mimeType,
            data: cleanBase64
          }
        });
      }

      const promptText = `
You are the voice registration engine for SkillBridge, India's voice-first hiring platform for informal workers.
${textInput ? `The user spoke or provided this transcription/text: "${textInput}".` : 'Listen to this audio recorded by an Indian informal worker (speaking in Hindi, Marathi, Tamil, Telugu, English, or another Indian language).'}

Your task:
1. Transcribe the audio accurately into text in the original spoken Indian language (or Romanized script).
2. Extract the structured profile entities:
   - name: The worker's full name (if mentioned, otherwise infer or provide an Indian name like "Rajesh Kumar")
   - primarySkill: The primary trade (must map to one of: Electrician, Plumber, Mason, Painter, Carpenter, Welder, Driver, Domestic Help, AC Technician, Tile & Marble Setter, Gardener, Appliance Repair)
   - secondarySkills: Array of any other skills mentioned
   - experienceYears: Integer years of experience (default 5 if not specified)
   - location: City or district in India (e.g. Nagpur, Pune, Mumbai, Delhi, Bengaluru, Hyderabad, Chennai)
   - confidence: Number between 0.70 and 0.99

Return only valid JSON matching this schema:
{
  "name": "string",
  "primarySkill": "string",
  "secondarySkills": ["string"],
  "experienceYears": number,
  "location": "string",
  "confidence": number,
  "transcript": "string"
}
`;

      parts.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2
        }
      });

      const responseText = response.text || '';
      try {
        const parsed = JSON.parse(responseText);
        return res.json(parsed);
      } catch (e) {
        console.warn('Could not parse Gemini JSON response, extracting fallback:', e);
      }
    }

    // Heuristic Fallback when GEMINI_API_KEY is unset or for simulated testing
    const fallbackSample = textInput || 'नमस्ते मेरा नाम सुरेश कुमार है, मैं नागपुर से हूँ और 8 साल से इलेक्ट्रीशियन का काम कर रहा हूँ।';
    const isElectrician = /बिजली|electric|तार|वायरिंग|fuse/i.test(fallbackSample);
    const isPlumber = /नल|plumb|पानी|पाइप|tank/i.test(fallbackSample);
    const isCarpenter = /बढ़ई|सुतार|लकड़ी|carpenter|wood/i.test(fallbackSample);
    const isPainter = /पेंट|रंग|paint|putty/i.test(fallbackSample);

    const primarySkill = isElectrician
      ? 'Electrician'
      : isPlumber
      ? 'Plumber'
      : isCarpenter
      ? 'Carpenter'
      : isPainter
      ? 'Painter'
      : 'Electrician';

    return res.json({
      name: 'सुरेश कुमार (Suresh Kumar)',
      primarySkill,
      secondarySkills: ['Appliance Repair', 'Inverter Setup'],
      experienceYears: 8,
      location: 'Nagpur',
      confidence: 0.94,
      transcript: fallbackSample
    });
  } catch (error: unknown) {
    console.error('Error in voice registration endpoint:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Voice transcription failed',
      fallback: {
        name: 'कारीगर (Craftsman)',
        primarySkill: 'Electrician',
        secondarySkills: [],
        experienceYears: 5,
        location: 'Nagpur',
        confidence: 0.8,
        transcript: 'Speech captured'
      }
    });
  }
});

// 2. AI Voice Job Matching Endpoint
app.post('/api/gemini/voice-job-match', async (req: Request, res: Response) => {
  try {
    const { audioBase64, textInput } = req.body;

    if (ai) {
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
${textInput ? `Employer transcription/text: "${textInput}".` : 'Listen to this audio.'}

Extract:
- skillRequired: The primary trade needed (Electrician, Plumber, Mason, Painter, Carpenter, Welder, Driver, Domestic Help, AC Technician, Tile & Marble Setter)
- urgency: "immediate" | "within_3_days" | "flexible"
- durationDays: estimated number of days (default 3)
- dailyBudget: budget per day in INR (default 850)
- description: concise 1-sentence summary of the job
- explanationSnippet: why this job matches recommended candidates

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
        model: 'gemini-3.8-flash',
        contents: { parts },
        config: { responseMimeType: 'application/json' }
      });

      if (response.text) {
        return res.json(JSON.parse(response.text));
      }
    }

    // Default mock response
    return res.json({
      skillRequired: 'Electrician',
      urgency: 'immediate',
      durationDays: 3,
      dailyBudget: 900,
      description: 'Require master electrician for complete 3-phase wiring and circuit breaker installation.',
      explanationSnippet: 'Matched candidates with verified ITI certificate and top reputation within 15 km.'
    });
  } catch (err: unknown) {
    console.error('Error in voice-job-match:', err);
    return res.status(500).json({ error: 'Failed to process AI job match' });
  }
});

// 3. Worker LLM Summary Endpoint
app.post('/api/gemini/worker-summary', async (req: Request, res: Response) => {
  try {
    const { name, skill, experienceYears, totalJobs, rating, badges, city } = req.body;

    if (ai) {
      const prompt = `
Generate a warm, professional, respectful 2-sentence summary in English and Hindi for this Indian worker profile on SkillBridge:
Worker Name: ${name}
Skill: ${skill}
Experience: ${experienceYears} years
Total Jobs Completed: ${totalJobs}
Reputation Rating: ${rating}/5.0
Badges: ${Array.isArray(badges) ? badges.join(', ') : badges}
City: ${city}

Highlight their reliability, trade craftsmanship, and verified status. Return JSON:
{
  "summaryEnglish": "string",
  "summaryHindi": "string"
}
`;
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      if (response.text) {
        return res.json(JSON.parse(response.text));
      }
    }

    return res.json({
      summaryEnglish: `${name} is an experienced ${skill} in ${city} with ${experienceYears} years of craftsmanship and ${totalJobs}+ verified projects. Rated ${rating}★ with verified credentials.`,
      summaryHindi: `${name} ${city} के एक अनुभवी ${skill} हैं, जिन्हें ${experienceYears} वर्षों का तजुर्बा और ${totalJobs}+ सफल कामों का अनुभव है।`
    });
  } catch (err) {
    return res.json({
      summaryEnglish: 'Trusted professional with proven track record on SkillBridge.',
      summaryHindi: 'स्किलब्रिज पर सत्यापित और विश्वसनीय कारीगर।'
    });
  }
});

// 4. Generate Trade Skill Quiz (for IVR or in-app verification)
app.post('/api/gemini/skill-quiz', async (req: Request, res: Response) => {
  try {
    const { skillName = 'Electrician' } = req.body;

    if (ai) {
      const prompt = `
Generate 5 practical, trade-specific multiple-choice questions for verifying an Indian informal worker (${skillName}) on SkillBridge.
Focus on safety, real-world tools, standards (like Indian Electricity Rules or plumbing codes), and fault troubleshooting.

Return pure JSON:
{
  "skill": "${skillName}",
  "questions": [
    {
      "id": 1,
      "question": "Question in English",
      "questionHindi": "सवाल हिंदी में",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "optionsHindi": ["विकल्प अ", "विकल्प ब", "विकल्प स", "विकल्प द"],
      "correctIndex": 0,
      "explanation": "Why this is correct"
    }
  ]
}
`;
      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: { responseMimeType: 'application/json' }
      });

      if (response.text) {
        return res.json(JSON.parse(response.text));
      }
    }

    // Default static quiz for instant verification
    return res.json({
      skill: skillName,
      questions: [
        {
          id: 1,
          question: 'In domestic AC electrical wiring in India, what color is typically used for the earthing/ground wire?',
          questionHindi: 'भारतीय घरेलू वायरिंग में अर्थिंग (ग्राउंड) तार का मानक रंग क्या होता है?',
          options: ['Green or Green-Yellow', 'Red', 'Black', 'Blue'],
          optionsHindi: ['हरा या हरा-पीला', 'लाल', 'काला', 'नीला'],
          correctIndex: 0,
          explanation: 'As per IS 732 Indian Standards, green/yellow is reserved for protective earthing.'
        },
        {
          id: 2,
          question: 'What is the standard rating of an MCB used for lighting circuits versus power plugs?',
          questionHindi: 'लाइटिंग सर्किट और पावर सॉकेट के लिए मानक MCB रेटिंग क्या होती है?',
          options: ['6A for lights, 16A/20A for power', '32A for lights, 6A for power', '63A for both', '2A for lights'],
          optionsHindi: ['लाइट के लिए 6A, पावर के लिए 16A/20A', 'लाइट के लिए 32A, पावर के लिए 6A', 'दोनों के लिए 63A', 'लाइट के लिए 2A'],
          correctIndex: 0,
          explanation: 'Standard domestic lighting uses 6A MCB (B-curve) while heavy loads (AC, Geyser) use 16A or 20A.'
        },
        {
          id: 3,
          question: 'Which instrument is used to check voltage presence safely before touching bare wires?',
          questionHindi: 'नंगे तारों को छूने से पहले वोल्टेज जांचने के लिए किस उपकरण का उपयोग किया जाता है?',
          options: ['Neon Phase Tester / Multimeter', 'Pliers', 'Screw Driver', 'Hammer'],
          optionsHindi: ['नियॉन फेज टेस्टर / मल्टीमीटर', 'प्लास', 'साधारण पेचकस', 'हथौड़ी'],
          correctIndex: 0,
          explanation: 'A calibrated neon phase tester or digital multimeter ensures the line is dead.'
        },
        {
          id: 4,
          question: 'Why must you never replace a blown fuse with a thick copper wire?',
          questionHindi: 'उड़े हुए फ्यूज की जगह मोटा तांबे का तार क्यों नहीं लगाना चाहिए?',
          options: ['It causes fire hazard and will not trip during short circuit', 'It lowers voltage', 'It looks untidy', 'It wastes current'],
          optionsHindi: ['इससे आग लग सकती है और शॉर्ट सर्किट पर ट्रिप नहीं होगा', 'यह वोल्टेज घटाता है', 'यह दिखने में खराब लगता है', 'यह करंट बर्बाद करता है'],
          correctIndex: 0,
          explanation: 'A thick wire raises the melting point dangerously high, causing electrical fires.'
        },
        {
          id: 5,
          question: 'What does RCCB/ELCB protect human life from?',
          questionHindi: 'RCCB / ELCB मानव जीवन को किस खतरे से बचाता है?',
          options: ['Earth leakage and lethal electric shock', 'Voltage spikes only', 'Thunderstorms only', 'Battery charging'],
          optionsHindi: ['अर्थ लीकेज और जानलेवा करंट के झटके से', 'केवल वोल्टेज स्पाइक से', 'केवल आकाशीय बिजली से', 'बैटरी चार्जिंग से'],
          correctIndex: 0,
          explanation: 'A 30mA RCCB trips within 40 milliseconds if leakage current passes through a person.'
        }
      ]
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate quiz' });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SkillBridge server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
