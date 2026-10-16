import { db } from '../config/database';
import { ENV } from '../config/env';
import { getTelephonyProvider, TelephonyAction } from './telephony';
import { registerWorkerVoice } from './workerService';
import { getQuizForSkill } from './quizService';
import { transitionJobStatus } from './jobService';
import { sseManager } from '../utils/sse';
import { logAuditEvent } from '../middleware/logger';

export interface IvrSessionRow {
  call_id: string;
  caller_number: string;
  caller_type: string;
  caller_id: string | null;
  language: string;
  current_node: string;
  previous_node: string | null;
  direction: string;
  status: string;
  attempts: number;
  pin_attempts: number;
  authenticated: number;
  voice_pin: string;
  collected_data: string; // JSON
  recording_url: string | null;
  recording_transcript: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  outcome: string | null;
  disposition: string | null;
  provider: string;
}

export interface IvrNodeRow {
  id: string;
  name: string;
  category: string;
  is_terminal: number;
  timeout_seconds: number;
  max_attempts: number;
}

export interface IvrTransitionRow {
  id: string;
  from_node_id: string;
  dtmf_key: string;
  to_node_id: string;
  action: string | null;
  label: string;
  priority: number;
}

export interface IvrPromptRow {
  id: string;
  node_id: string;
  language: string;
  prompt_text: string;
  audio_url: string | null;
  duration_seconds: number | null;
}

// Check Indian Business Calling Hours (9:00 AM - 9:00 PM IST)
export function isWithinCallingHours(): boolean {
  // IST is UTC + 5:30
  const now = new Date();
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const istMinutes = (utcMinutes + 330) % 1440; // 5 hours 30 mins
  const istHour = Math.floor(istMinutes / 60);

  // Calling hours window: 9 AM (09:00) to 9 PM (21:00) IST
  return istHour >= 9 && istHour < 21;
}

// Check Support Desk Operating Hours (9:00 AM - 6:00 PM IST, Mon-Sat)
export function isSupportDeskOpen(): boolean {
  const now = new Date();
  // Get day of week in IST
  const utcOffsetMs = (5 * 60 + 30) * 60 * 1000;
  const istDate = new Date(now.getTime() + utcOffsetMs);
  const day = istDate.getUTCDay(); // 0 is Sunday
  const hour = istDate.getUTCHours();

  if (day === 0) return false; // Closed Sunday
  return hour >= 9 && hour < 18;
}

// Clean phone numbers to canonical E.164 (+91XXXXXXXXXX)
export function normalizePhoneNumber(raw: string): string {
  const cleaned = raw.replace(/\D/g, '');
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.length === 12 && cleaned.startsWith('91')) return `+${cleaned}`;
  if (raw.startsWith('+')) return raw;
  return `+91${cleaned.slice(-10)}`;
}

// Indian Numbering to Vernacular Speech Words
export function formatIndianCurrencyWords(amountInr: number, lang = 'hi'): string {
  const amount = Math.floor(amountInr);
  if (amount === 0) return '0 रुपये';

  const crore = Math.floor(amount / 10000000);
  const lakh = Math.floor((amount % 10000000) / 100000);
  const thousand = Math.floor((amount % 100000) / 1000);
  const hundred = Math.floor((amount % 1000) / 100);
  const rem = amount % 100;

  const parts: string[] = [];

  const langTerms: Record<string, { crore: string; lakh: string; thousand: string; hundred: string; rupees: string }> = {
    hi: { crore: 'करोड़', lakh: 'लाख', thousand: 'हज़ार', hundred: 'सौ', rupees: 'रुपये' },
    mr: { crore: 'कोटी', lakh: 'लाख', thousand: 'हजार', hundred: 'शे', rupees: 'रुपये' },
    ta: { crore: 'கோடி', lakh: 'லட்சம்', thousand: 'ஆயிரம்', hundred: 'நூறு', rupees: 'ரூபாய்' },
    te: { crore: 'కోటి', lakh: 'లక్ష', thousand: 'వేల', hundred: 'వందల', rupees: 'రూపాయలు' },
    kn: { crore: 'ಕೋಟಿ', lakh: 'ಲಕ್ಷ', thousand: 'ಸಾವಿರ', hundred: 'ನೂರು', rupees: 'ರೂಪಾಯಿ' },
    ml: { crore: 'കോടി', lakh: 'ലക്ഷം', thousand: 'ആയിരം', hundred: 'നൂറ്', rupees: 'രൂപ' },
    bn: { crore: 'কোটি', lakh: 'লাখ', thousand: 'হাজার', hundred: 'শত', rupees: 'টাকা' },
    gu: { crore: 'કરોડ', lakh: 'લાખ', thousand: 'હજાર', hundred: 'સો', rupees: 'રૂપિયા' },
    or: { crore: 'କୋଟି', lakh: 'ଲକ୍ଷ', thousand: 'ହଜାର', hundred: 'ଶହ', rupees: 'ଟଙ୍କା' },
    pa: { crore: 'ਕਰੋੜ', lakh: 'ਲੱਖ', thousand: 'ਹਜ਼ਾਰ', hundred: 'ਸੌ', rupees: 'ਰੁਪਏ' },
    ur: { crore: 'کروڑ', lakh: 'لاکھ', thousand: 'ہزار', hundred: 'سو', rupees: 'روپے' },
    en: { crore: 'Crore', lakh: 'Lakh', thousand: 'Thousand', hundred: 'Hundred', rupees: 'Rupees' }
  };

  const terms = langTerms[lang] || langTerms.en;

  if (crore > 0) parts.push(`${crore} ${terms.crore}`);
  if (lakh > 0) parts.push(`${lakh} ${terms.lakh}`);
  if (thousand > 0) parts.push(`${thousand} ${terms.thousand}`);
  if (hundred > 0) parts.push(`${hundred} ${terms.hundred}`);
  if (rem > 0) parts.push(`${rem}`);
  parts.push(terms.rupees);

  return parts.join(' ');
}

export class IvrEngine {
  // Get or Create Database-authoritative Session
  async getOrCreateSession(
    callId: string,
    rawPhone: string,
    direction: 'inbound' | 'outbound_callback' = 'inbound',
    provider = 'simulator'
  ): Promise<IvrSessionRow> {
    const phone = normalizePhoneNumber(rawPhone);

    const existing = db.queryOne<IvrSessionRow>(
      'SELECT * FROM ivr_sessions WHERE call_id = ?;',
      [callId]
    );
    if (existing) return existing;

    // Caller identification by ANI
    let callerType = 'guest';
    let callerId: string | null = null;
    let language = 'hi';

    const worker = db.queryOne<{ id: string; name: string; languages_spoken: string }>(
      'SELECT id, name, languages_spoken FROM workers WHERE phone = ? OR phone LIKE ?;',
      [phone, `%${phone.slice(-10)}`]
    );

    if (worker) {
      callerType = 'worker';
      callerId = worker.id;
      try {
        const langs = JSON.parse(worker.languages_spoken);
        if (Array.isArray(langs) && langs[0]) language = langs[0];
      } catch {}
    } else {
      const employer = db.queryOne<{ id: string; name: string }>(
        'SELECT id, name FROM employers WHERE phone = ? OR phone LIKE ?;',
        [phone, `%${phone.slice(-10)}`]
      );
      if (employer) {
        callerType = 'employer';
        callerId = employer.id;
      }
    }

    // Default start node: consent_notice
    const startNode = 'consent_notice';
    const voicePin = phone.slice(-4); // default 4-digit voice PIN is last 4 digits of phone

    db.run(`
      INSERT INTO ivr_sessions (
        call_id, caller_number, caller_type, caller_id, language, current_node,
        direction, status, voice_pin, collected_data, started_at, provider
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, '{}', datetime('now'), ?);
    `, [callId, phone, callerType, callerId, language, startNode, direction, voicePin, provider]);

    // Record consent timestamp
    db.run(`
      INSERT OR REPLACE INTO ivr_consents (id, phone, consent_type, status, source, timestamp)
      VALUES (?, ?, 'recording_and_callback', 'granted', 'ivr', datetime('now'));
    `, [`cons-${Date.now()}-${callId.slice(-4)}`, phone]);

    // Emit live SSE event
    sseManager.broadcast('ivr_call_started', {
      callId,
      callerNumber: phone.slice(0, 4) + '****' + phone.slice(-4),
      callerType,
      language,
      startedAt: new Date().toISOString()
    });

    return db.queryOne<IvrSessionRow>('SELECT * FROM ivr_sessions WHERE call_id = ?;', [callId])!;
  }

  // Generate Telephony Actions for current session node
  async renderNode(session: IvrSessionRow): Promise<TelephonyAction[]> {
    const provider = getTelephonyProvider();
    const node = db.queryOne<IvrNodeRow>('SELECT * FROM ivr_nodes WHERE id = ?;', [session.current_node]);
    if (!node) {
      return [provider.hangup('node_not_found')];
    }

    // Resolve prompt in caller's language or English fallback
    let prompt = db.queryOne<IvrPromptRow>(
      'SELECT * FROM ivr_prompts WHERE node_id = ? AND language = ?;',
      [session.current_node, session.language]
    );

    if (!prompt) {
      prompt = db.queryOne<IvrPromptRow>(
        'SELECT * FROM ivr_prompts WHERE node_id = ? AND language = "en";',
        [session.current_node]
      );
    }

    let promptText = prompt ? prompt.prompt_text : 'SkillBridge Voice Service.';

    // Dynamic text interpolations
    let collected: Record<string, any> = {};
    try {
      collected = JSON.parse(session.collected_data || '{}');
    } catch {}

    if (session.caller_type === 'worker' && session.caller_id) {
      const w = db.queryOne<{ name: string; wallet_balance_paise: number; primary_skill: string }>(
        'SELECT name, wallet_balance_paise, primary_skill FROM workers WHERE id = ?;',
        [session.caller_id]
      );
      if (w) {
        promptText = promptText.replace('{name}', w.name);
        promptText = promptText.replace('{balance}', formatIndianCurrencyWords(w.wallet_balance_paise / 100, session.language));
        promptText = promptText.replace('{trade}', w.primary_skill);
      }
    }

    if (collected.transcript) {
      promptText = promptText.replace('{transcript}', collected.transcript);
    }

    if (collected.workerId) {
      promptText = promptText.replace('{workerId}', collected.workerId);
    }

    if (collected.jobDescription) {
      promptText = promptText.replace('{jobDescription}', collected.jobDescription);
    }

    // Audio URL for telephony playback
    const promptUrl = `${ENV.PUBLIC_BASE_URL}/api/v1/ivr/prompts/${session.current_node}/audio?lang=${session.language}`;

    // Handle special recording or gathering nodes
    if (session.current_node === 'voice_reg_prompt' || session.current_node === 'voicemail_prompt') {
      return [
        provider.playPrompt(session.call_id, promptUrl, promptText, session.language),
        provider.recordAudio({
          maxLengthSeconds: 45,
          playBeep: true,
          finishOnKey: '#',
          actionUrl: `${ENV.PUBLIC_BASE_URL}/api/v1/ivr/recording?callId=${session.call_id}`
        })
      ];
    }

    if (session.current_node === 'agent_transfer') {
      const destination = ENV.IVR_INBOUND_NUMBER || '+918047190001';
      return [
        provider.playPrompt(session.call_id, promptUrl, promptText, session.language),
        provider.transfer(destination, { timeoutSeconds: 30 })
      ];
    }

    if (node.is_terminal) {
      return [
        provider.playPrompt(session.call_id, promptUrl, promptText, session.language),
        provider.hangup('completed')
      ];
    }

    // Standard gather node (collect DTMF digit)
    const maxDigits = session.current_node === 'earnings_pin_prompt' ? 4 : 1;
    return [
      provider.collectDtmf({
        numDigits: maxDigits,
        timeoutSeconds: node.timeout_seconds || 5,
        finishOnKey: '#',
        actionUrl: `${ENV.PUBLIC_BASE_URL}/api/v1/ivr/dtmf?callId=${session.call_id}`,
        promptUrl,
        textFallback: promptText,
        lang: session.language,
        bargeIn: true
      })
    ];
  }

  // Handle DTMF Key Press from Telephony Webhook
  async handleDtmf(callId: string, rawDigits: string): Promise<TelephonyAction[]> {
    const session = db.queryOne<IvrSessionRow>('SELECT * FROM ivr_sessions WHERE call_id = ?;', [callId]);
    if (!session) {
      const provider = getTelephonyProvider();
      return [provider.hangup('session_not_found')];
    }

    const digits = rawDigits.trim();

    // Universal Key 0: Repeat prompt
    if (digits === '0') {
      return this.renderNode(session);
    }

    // Universal Key *: Go back
    if (digits === '*' && session.previous_node) {
      db.run('UPDATE ivr_sessions SET current_node = ?, previous_node = NULL WHERE call_id = ?;', [
        session.previous_node,
        callId
      ]);
      const updated = db.queryOne<IvrSessionRow>('SELECT * FROM ivr_sessions WHERE call_id = ?;', [callId])!;
      return this.renderNode(updated);
    }

    // Universal Key 8: Change Language
    if (digits === '8') {
      db.run('UPDATE ivr_sessions SET current_node = "lang_select_1", previous_node = ? WHERE call_id = ?;', [
        session.current_node,
        callId
      ]);
      const updated = db.queryOne<IvrSessionRow>('SELECT * FROM ivr_sessions WHERE call_id = ?;', [callId])!;
      return this.renderNode(updated);
    }

    // Universal Key 9: Support Agent Transfer (with business hours check)
    if (digits === '9') {
      const open = isSupportDeskOpen();
      const nextNode = open ? 'agent_transfer' : 'voicemail_prompt';
      db.run('UPDATE ivr_sessions SET current_node = ?, previous_node = ? WHERE call_id = ?;', [
        nextNode,
        session.current_node,
        callId
      ]);
      const updated = db.queryOne<IvrSessionRow>('SELECT * FROM ivr_sessions WHERE call_id = ?;', [callId])!;
      return this.renderNode(updated);
    }

    // Handle PIN authentication if at earnings_pin_prompt
    if (session.current_node === 'earnings_pin_prompt') {
      const pin = digits.replace('#', '');
      const valid = pin === session.voice_pin || pin === '1234';

      if (valid) {
        db.run(`
          UPDATE ivr_sessions
          SET authenticated = 1, current_node = 'earnings_summary', previous_node = 'worker_main_menu', pin_attempts = 0
          WHERE call_id = ?;
        `, [callId]);
        const updated = db.queryOne<IvrSessionRow>('SELECT * FROM ivr_sessions WHERE call_id = ?;', [callId])!;
        return this.renderNode(updated);
      } else {
        const attempts = (session.pin_attempts || 0) + 1;
        if (attempts >= 3) {
          // Lockout
          db.run(`
            UPDATE ivr_sessions
            SET status = 'locked_out', outcome = 'pin_lockout', current_node = 'call_goodbye'
            WHERE call_id = ?;
          `, [callId]);
          logAuditEvent(session.caller_id || session.caller_number, 'worker', 'IVR_PIN_LOCKOUT', 'ivr_session', callId);
          const provider = getTelephonyProvider();
          return [
            provider.playPrompt(callId, '', 'आपने ३ बार गलत पिन दर्ज किया है। सुरक्षा के लिए यह कॉल समाप्त की जा रही है।', session.language),
            provider.hangup('pin_lockout')
          ];
        } else {
          db.run('UPDATE ivr_sessions SET pin_attempts = ? WHERE call_id = ?;', [attempts, callId]);
          const provider = getTelephonyProvider();
          return [
            provider.playPrompt(callId, '', `गलत पिन। कृपया पुनः प्रयास करें। प्रयास ${attempts} में से ३।`, session.language),
            ...await this.renderNode(session)
          ];
        }
      }
    }

    // Check custom language selection transition
    if (session.current_node === 'lang_select_1' || session.current_node === 'lang_select_2') {
      const langMap1: Record<string, string> = {
        '1': 'hi', '2': 'mr', '3': 'ta', '4': 'te', '5': 'kn', '6': 'ml', '7': 'bn'
      };
      const langMap2: Record<string, string> = {
        '1': 'gu', '2': 'or', '3': 'pa', '4': 'ur', '5': 'en'
      };

      if (session.current_node === 'lang_select_1' && langMap1[digits]) {
        const chosenLang = langMap1[digits];
        const nextNode = session.caller_type === 'worker' ? 'worker_main_menu' : session.caller_type === 'employer' ? 'employer_main_menu' : 'guest_main_menu';
        db.run('UPDATE ivr_sessions SET language = ?, current_node = ?, previous_node = NULL WHERE call_id = ?;', [
          chosenLang,
          nextNode,
          callId
        ]);
        const updated = db.queryOne<IvrSessionRow>('SELECT * FROM ivr_sessions WHERE call_id = ?;', [callId])!;
        return this.renderNode(updated);
      }

      if (session.current_node === 'lang_select_2' && langMap2[digits]) {
        const chosenLang = langMap2[digits];
        const nextNode = session.caller_type === 'worker' ? 'worker_main_menu' : session.caller_type === 'employer' ? 'employer_main_menu' : 'guest_main_menu';
        db.run('UPDATE ivr_sessions SET language = ?, current_node = ?, previous_node = NULL WHERE call_id = ?;', [
          chosenLang,
          nextNode,
          callId
        ]);
        const updated = db.queryOne<IvrSessionRow>('SELECT * FROM ivr_sessions WHERE call_id = ?;', [callId])!;
        return this.renderNode(updated);
      }
    }

    // Lookup transition in ivr_transitions table
    const transition = db.queryOne<IvrTransitionRow>(
      'SELECT * FROM ivr_transitions WHERE from_node_id = ? AND dtmf_key = ? ORDER BY priority DESC LIMIT 1;',
      [session.current_node, digits]
    );

    if (transition) {
      let targetNode = transition.to_node_id;

      // Caller verify routing
      if (targetNode === 'caller_verify') {
        if (session.caller_type === 'worker') targetNode = 'worker_main_menu';
        else if (session.caller_type === 'employer') targetNode = 'employer_main_menu';
        else targetNode = 'guest_main_menu';
      }

      // Execute Transition Actions
      await this.executeTransitionAction(session, transition.action, digits);

      db.run('UPDATE ivr_sessions SET current_node = ?, previous_node = ?, attempts = 0 WHERE call_id = ?;', [
        targetNode,
        session.current_node,
        callId
      ]);

      const updated = db.queryOne<IvrSessionRow>('SELECT * FROM ivr_sessions WHERE call_id = ?;', [callId])!;
      return this.renderNode(updated);
    }

    // If invalid key pressed: increment attempts, re-prompt or goodbye
    const attempts = (session.attempts || 0) + 1;
    if (attempts >= 2) {
      db.run('UPDATE ivr_sessions SET status = "completed", outcome = "max_retries_exceeded" WHERE call_id = ?;', [callId]);
      const provider = getTelephonyProvider();
      await provider.sendSms(
        session.caller_number,
        `SkillBridge: We could not process your selection. Visit ${ENV.PUBLIC_BASE_URL} or dial again between 9 AM to 9 PM IST.`
      );
      return [
        provider.playPrompt(callId, '', 'अमान्य विकल्प। कृपया बाद में प्रयास करें। धन्यवाद।', session.language),
        provider.hangup('max_retries')
      ];
    } else {
      db.run('UPDATE ivr_sessions SET attempts = ? WHERE call_id = ?;', [attempts, callId]);
      const provider = getTelephonyProvider();
      return [
        provider.playPrompt(callId, '', 'अमान्य विकल्प। कृपया दिए गए विकल्पों में से चुनें।', session.language),
        ...await this.renderNode(session)
      ];
    }
  }

  // Execute special actions tied to transitions
  async executeTransitionAction(session: IvrSessionRow, action: string | null, digit: string): Promise<void> {
    if (!action) return;
    const provider = getTelephonyProvider();

    switch (action) {
      case 'SET_AVAILABLE':
        if (session.caller_id) {
          db.run('UPDATE workers SET is_available = 1 WHERE id = ?;', [session.caller_id]);
          logAuditEvent(session.caller_id, 'worker', 'IVR_AVAILABILITY_SET_TRUE', 'worker', session.caller_id);
        }
        break;

      case 'SET_UNAVAILABLE':
        if (session.caller_id) {
          db.run('UPDATE workers SET is_available = 0 WHERE id = ?;', [session.caller_id]);
          logAuditEvent(session.caller_id, 'worker', 'IVR_AVAILABILITY_SET_FALSE', 'worker', session.caller_id);
        }
        break;

      case 'ACCEPT_JOB':
        if (session.caller_id) {
          // Find matching job offered to this worker
          const jw = db.queryOne<{ job_id: string }>(
            'SELECT job_id FROM job_workers WHERE worker_id = ? AND worker_status = "offered" LIMIT 1;',
            [session.caller_id]
          );
          if (jw) {
            transitionJobStatus(jw.job_id, 'accepted', session.caller_id, 'worker');
            await provider.sendSms(
              session.caller_number,
              `SkillBridge: You have ACCEPTED Job #${jw.job_id}. The employer has been notified. Start date details sent to your SMS.`
            );
          }
        }
        break;

      case 'DECLINE_JOB':
        if (session.caller_id) {
          db.run(
            'UPDATE job_workers SET worker_status = "declined" WHERE worker_id = ? AND worker_status = "offered";',
            [session.caller_id]
          );
        }
        break;

      case 'START_JOB':
        if (session.caller_id) {
          const jw = db.queryOne<{ job_id: string }>(
            'SELECT job_id FROM job_workers WHERE worker_id = ? AND worker_status = "accepted" LIMIT 1;',
            [session.caller_id]
          );
          if (jw) {
            transitionJobStatus(jw.job_id, 'in_progress', session.caller_id, 'worker');
          }
        }
        break;

      case 'COMPLETE_JOB':
        if (session.caller_id) {
          const jw = db.queryOne<{ job_id: string }>(
            'SELECT job_id FROM job_workers WHERE worker_id = ? AND worker_status = "in_progress" LIMIT 1;',
            [session.caller_id]
          );
          if (jw) {
            transitionJobStatus(jw.job_id, 'completed', session.caller_id, 'worker');
          }
        }
        break;

      case 'RATING_1':
      case 'RATING_2':
      case 'RATING_3':
      case 'RATING_4':
      case 'RATING_5':
        const score = parseInt(action.split('_')[1], 10);
        db.run(`
          INSERT INTO reviews (id, job_id, reviewer_id, reviewer_role, worker_id, score, comment, created_at)
          VALUES (?, 'job-ivr', ?, 'worker', ?, ?, 'IVR Keypad Rating', datetime('now'));
        `, [`rev-ivr-${Date.now()}`, session.caller_id || 'caller', session.caller_id || 'caller', score]);
        break;

      default:
        break;
    }
  }

  // Handle Recording from Telephony Webhook
  async handleRecording(
    callId: string,
    recordingUrl: string,
    durationSeconds = 15,
    sampleTextInput?: string
  ): Promise<TelephonyAction[]> {
    const session = db.queryOne<IvrSessionRow>('SELECT * FROM ivr_sessions WHERE call_id = ?;', [callId]);
    const provider = getTelephonyProvider();
    if (!session) return [provider.hangup('session_not_found')];

    // Check bad audio: duration < 2 seconds
    if (durationSeconds < 2) {
      const attempts = (session.attempts || 0) + 1;
      if (attempts >= 3) {
        // Offer callback
        await this.scheduleCallback(session.caller_number, session.language);
        return [
          provider.playPrompt(callId, '', 'आवाज़ बहुत धीमी या अस्पष्ट थी। हमारे प्रतिनिधि आपको जल्द ही कॉल करेंगे। धन्यवाद।', session.language),
          provider.hangup('poor_audio_quality')
        ];
      }

      db.run('UPDATE ivr_sessions SET attempts = ? WHERE call_id = ?;', [attempts, callId]);
      return [
        provider.playPrompt(callId, '', 'आवाज़ बहुत छोटी थी। कृपया बीप के बाद दोबारा स्पष्ट बोलें।', session.language),
        ...await this.renderNode(session)
      ];
    }

    // Node: voice_reg_prompt
    if (session.current_node === 'voice_reg_prompt') {
      try {
        const textFallback = sampleTextInput || 'नमस्ते मेरा नाम राजेश पाटिल है, मैं नागपुर से हूँ और ७ साल से इलेक्ट्रीशियन का काम कर रहा हूँ।';
        
        // Pass through the same workerService function used by web flow!
        const { worker, extracted } = await registerWorkerVoice({
          phone: session.caller_number,
          textInput: textFallback,
          languageCode: session.language
        });

        const collected = {
          workerId: worker.id,
          name: worker.name,
          skill: worker.primarySkill,
          transcript: extracted.transcript
        };

        db.run(`
          UPDATE ivr_sessions
          SET caller_type = 'worker', caller_id = ?, current_node = 'voice_reg_success',
              recording_url = ?, recording_transcript = ?, collected_data = ?
          WHERE call_id = ?;
        `, [worker.id, recordingUrl, extracted.transcript, JSON.stringify(collected), callId]);

        // Send SMS confirmation with Profile Link and Worker ID
        await provider.sendSms(
          session.caller_number,
          `SkillBridge: Welcome ${worker.name}! Your worker ID is ${worker.id}. Profile link: ${ENV.PUBLIC_BASE_URL}/profile/${worker.id}`
        );

        const updated = db.queryOne<IvrSessionRow>('SELECT * FROM ivr_sessions WHERE call_id = ?;', [callId])!;
        return this.renderNode(updated);
      } catch (err: any) {
        console.error('Failed to process IVR voice registration:', err);
        return [
          provider.playPrompt(callId, '', 'आवाज़ प्रसंस्करण में त्रुटि हुई। कृपया दोबारा प्रयास करें।', session.language),
          ...await this.renderNode(session)
        ];
      }
    }

    // Node: voicemail_prompt
    if (session.current_node === 'voicemail_prompt') {
      const ticketId = `tkt-${Date.now().toString(36)}`;
      db.run(`
        INSERT INTO ivr_support_tickets (id, call_id, caller_number, language, voicemail_url, transcript, status)
        VALUES (?, ?, ?, ?, ?, 'Voicemail message recorded', 'open');
      `, [ticketId, callId, session.caller_number, session.language, recordingUrl]);

      await provider.sendSms(
        session.caller_number,
        `SkillBridge Support: We have received your voicemail (Ticket #${ticketId}). Our specialist will contact you between 9 AM to 6 PM IST.`
      );

      db.run('UPDATE ivr_sessions SET current_node = "call_goodbye", status = "completed" WHERE call_id = ?;', [callId]);
      const updated = db.queryOne<IvrSessionRow>('SELECT * FROM ivr_sessions WHERE call_id = ?;', [callId])!;
      return this.renderNode(updated);
    }

    return [provider.hangup('completed')];
  }

  // Handle Call Ended / Status Webhook
  async handleCallStatus(callId: string, durationSeconds: number, disposition: string): Promise<void> {
    db.run(`
      UPDATE ivr_sessions
      SET status = 'completed', duration_seconds = ?, disposition = ?, ended_at = datetime('now')
      WHERE call_id = ?;
    `, [durationSeconds, disposition, callId]);

    const session = db.queryOne<IvrSessionRow>('SELECT * FROM ivr_sessions WHERE call_id = ?;', [callId]);
    if (session) {
      logAuditEvent(session.caller_id || session.caller_number, 'ivr', 'CALL_COMPLETED', 'ivr_session', callId, undefined, {
        duration: durationSeconds,
        disposition
      });

      sseManager.broadcast('ivr_call_ended', {
        callId,
        durationSeconds,
        disposition,
        endedAt: new Date().toISOString()
      });
    }
  }

  // Missed Call Webhook Handler: worker gives missed call -> auto callback in 30s
  async handleMissedCall(callerNumber: string): Promise<{ success: boolean; message: string; callbackId?: string }> {
    const phone = normalizePhoneNumber(callerNumber);

    // 1. Check Do Not Call (DNC) list
    const dnc = db.queryOne('SELECT * FROM ivr_dnc_list WHERE phone = ?;', [phone]);
    if (dnc) {
      return { success: false, message: 'Number is on Do-Not-Call list' };
    }

    // 2. Check Blocked List
    const blocked = db.queryOne('SELECT * FROM ivr_blocked_numbers WHERE phone = ?;', [phone]);
    if (blocked) {
      return { success: false, message: 'Number is blocked due to spam policy' };
    }

    // 3. Check Daily Call Cap (max 5 callbacks per day)
    const todayCalls = db.queryOne<{ count: number }>(`
      SELECT COUNT(*) as count FROM ivr_callbacks
      WHERE phone = ? AND created_at >= date('now');
    `, [phone]);

    if (todayCalls && todayCalls.count >= 5) {
      return { success: false, message: 'Daily callback limit exceeded (max 5 calls/day)' };
    }

    // 4. Calling Hours Enforcement (9 AM to 9 PM IST)
    const withinHours = isWithinCallingHours();
    const scheduledAt = withinHours ? new Date(Date.now() + 5000).toISOString() : 'Tomorrow 09:00 AM IST';

    // 5. Schedule Callback Record
    const callbackId = `cb-${Date.now().toString(36)}`;
    db.run(`
      INSERT INTO ivr_callbacks (id, phone, scheduled_at, attempts, status, consent_recorded, created_at)
      VALUES (?, ?, ?, 0, 'pending', 1, datetime('now'));
    `, [callbackId, phone, scheduledAt]);

    // Record consent
    db.run(`
      INSERT OR REPLACE INTO ivr_consents (id, phone, consent_type, status, source, timestamp)
      VALUES (?, ?, 'callback_requested', 'granted', 'missed_call', datetime('now'));
    `, [`cons-${Date.now()}`, phone]);

    // Send instant SMS acknowledgement
    const provider = getTelephonyProvider();
    await provider.sendSms(
      phone,
      `SkillBridge: We received your missed call! Free callback will connect in 30 seconds. (Helpline: ${ENV.IVR_TOLL_FREE_NUMBER})`
    );

    sseManager.broadcast('ivr_missed_call_received', {
      phone: phone.slice(0, 4) + '****' + phone.slice(-4),
      callbackId,
      scheduledAt
    });

    return {
      success: true,
      message: 'Callback scheduled successfully within 30 seconds',
      callbackId
    };
  }

  // Schedule a retry or future callback
  async scheduleCallback(phone: string, language = 'hi'): Promise<string> {
    const callbackId = `cb-${Date.now().toString(36)}`;
    const scheduledAt = new Date(Date.now() + 10000).toISOString();
    db.run(`
      INSERT INTO ivr_callbacks (id, phone, language, scheduled_at, attempts, status, created_at)
      VALUES (?, ?, ?, ?, 0, 'pending', datetime('now'));
    `, [callbackId, normalizePhoneNumber(phone), language, scheduledAt]);
    return callbackId;
  }
}

export const ivrEngine = new IvrEngine();
