/**
 * IVR Telephony Gateway Service (Production-grade Exotel / Twilio / Simulator client)
 * 
 * Provides automated phone call tree with interactive voice prompts and DTMF tone capture.
 * Designed for feature phone users, keypad phones, and workers who cannot read or write.
 * 
 * Connected to /api/v1/ivr backend webhook endpoints.
 */

export interface IvrNode {
  id: string;
  spokenPromptHindi: string;
  spokenPromptEnglish: string;
  spokenPromptMarathi?: string;
  spokenPromptTamil?: string;
  spokenPromptTelugu?: string;
  dtmfOptions: Record<string, { label: string; nextNodeId: string; action?: string }>;
}

export interface IvrActionResponse {
  status: string;
  provider: string;
  actions: Array<{
    type: string;
    promptUrl?: string;
    text?: string;
    lang?: string;
    maxDigits?: number;
    timeoutSeconds?: number;
    maxLengthSeconds?: number;
    playBeep?: boolean;
    finishOnKey?: string;
    actionUrl?: string;
    dialNumber?: string;
    reason?: string;
  }>;
}

function decodeXml(text: string): string {
  return text
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"');
}

export function parseTwiml(twiml: string): IvrActionResponse['actions'] {
  const actions: IvrActionResponse['actions'] = [];

  // Match Gather
  const gatherMatch = twiml.match(/<Gather([^>]*)>([\s\S]*?)<\/Gather>/i);
  if (gatherMatch) {
    const attrs = gatherMatch[1];
    const inner = gatherMatch[2];
    const maxDigits = attrs.match(/numDigits="(\d+)"/i)?.[1];
    const timeout = attrs.match(/timeout="(\d+)"/i)?.[1];
    const finishOnKey = attrs.match(/finishOnKey="([^"]+)"/i)?.[1];
    const actionUrl = attrs.match(/action="([^"]+)"/i)?.[1];

    let promptUrl: string | undefined;
    let text: string | undefined;
    let lang: string | undefined;

    const playMatch = inner.match(/<Play>([\s\S]*?)<\/Play>/i);
    if (playMatch) promptUrl = playMatch[1].trim();

    const sayMatch = inner.match(/<Say(?:[^>]*language="([^"]+)")?[^>]*>([\s\S]*?)<\/Say>/i);
    if (sayMatch) {
      lang = sayMatch[1] ? sayMatch[1].split('-')[0] : 'hi';
      text = decodeXml(sayMatch[2].trim());
    }

    actions.push({
      type: 'gather',
      maxDigits: maxDigits ? parseInt(maxDigits, 10) : 1,
      timeoutSeconds: timeout ? parseInt(timeout, 10) : 5,
      finishOnKey: finishOnKey || '#',
      actionUrl,
      promptUrl,
      text,
      lang: lang || 'hi'
    });
  }

  // Match standalone Say outside Gather
  if (!gatherMatch) {
    const standaloneSayRegex = /<Say(?:[^>]*language="([^"]+)")?[^>]*>([\s\S]*?)<\/Say>/gi;
    let sayM;
    while ((sayM = standaloneSayRegex.exec(twiml)) !== null) {
      const lang = sayM[1] ? sayM[1].split('-')[0] : 'hi';
      const text = decodeXml(sayM[2].trim());
      actions.push({
        type: 'play',
        text,
        lang
      });
    }

    // Match standalone Play outside Gather
    const playRegex = /<Play>([\s\S]*?)<\/Play>/gi;
    let playM;
    while ((playM = playRegex.exec(twiml)) !== null) {
      actions.push({
        type: 'play',
        promptUrl: playM[1].trim()
      });
    }
  }

  // Match Record
  const recordMatch = twiml.match(/<Record([^>]*)\/?>/i);
  if (recordMatch) {
    const attrs = recordMatch[1];
    const actionUrl = attrs.match(/action="([^"]+)"/i)?.[1];
    const maxLength = attrs.match(/maxLength="(\d+)"/i)?.[1];
    const timeout = attrs.match(/timeout="(\d+)"/i)?.[1];
    const finishOnKey = attrs.match(/finishOnKey="([^"]+)"/i)?.[1];
    actions.push({
      type: 'record',
      actionUrl,
      maxLengthSeconds: maxLength ? parseInt(maxLength, 10) : 45,
      timeoutSeconds: timeout ? parseInt(timeout, 10) : 5,
      finishOnKey: finishOnKey || '#'
    });
  }

  // Match Dial
  const dialMatch = twiml.match(/<Dial([^>]*)>([\s\S]*?)<\/Dial>/i);
  if (dialMatch) {
    const dialNumber = dialMatch[2].trim();
    actions.push({
      type: 'dial',
      dialNumber
    });
  }

  // Match Hangup
  if (/<Hangup\s*\/?>/i.test(twiml)) {
    actions.push({
      type: 'hangup',
      reason: 'completed'
    });
  }

  return actions;
}

export async function parseTelephonyResponse(res: Response): Promise<IvrActionResponse> {
  const rawText = await res.text();
  const trimmed = rawText.trim();

  // If response is TwiML XML (e.g. <?xml ... or <Response>...)
  if (trimmed.startsWith('<') || res.headers.get('content-type')?.includes('xml')) {
    const actions = parseTwiml(trimmed);
    return {
      status: 'ok',
      provider: 'twilio',
      actions
    };
  }

  try {
    const data = JSON.parse(trimmed);

    // If Exotel flow format: { flow: [...] }
    if (data.flow && Array.isArray(data.flow)) {
      const actions = data.flow.map((f: any) => {
        if (f.action === 'gather') {
          return {
            type: 'gather',
            maxDigits: f.max_digits,
            timeoutSeconds: f.timeout,
            finishOnKey: f.finish_key,
            text: typeof f.prompt === 'string' && !f.prompt.startsWith('http') ? f.prompt : undefined,
            promptUrl: typeof f.prompt === 'string' && f.prompt.startsWith('http') ? f.prompt : undefined,
            actionUrl: f.url
          };
        }
        if (f.action === 'play') {
          return {
            type: 'play',
            promptUrl: f.url,
            text: f.text
          };
        }
        if (f.action === 'record') {
          return {
            type: 'record',
            maxLengthSeconds: f.max_length,
            finishOnKey: f.finish_key,
            actionUrl: f.url
          };
        }
        if (f.action === 'transfer') {
          return {
            type: 'dial',
            dialNumber: f.number
          };
        }
        return {
          type: 'hangup',
          reason: f.reason || 'completed'
        };
      });

      return {
        status: 'ok',
        provider: 'exotel',
        actions
      };
    }

    if (data.actions && Array.isArray(data.actions)) {
      return data as IvrActionResponse;
    }

    return {
      status: data.status || 'ok',
      provider: data.provider || 'simulator',
      actions: data.actions || []
    };
  } catch {
    return {
      status: 'ok',
      provider: 'unknown',
      actions: [{ type: 'play', text: trimmed, lang: 'hi' }]
    };
  }
}

// Client for the unified backend IVR Webhook API
export const ivrApiClient = {
  /**
   * Start inbound call session on backend
   */
  startCall: async (callerNumber: string, callId?: string): Promise<IvrActionResponse> => {
    const id = callId || `call_sim_${Date.now()}`;
    const res = await fetch('/api/v1/ivr/incoming', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/xml, */*',
        'x-telephony-provider': 'simulator',
        'x-telephony-signature': 'sim_sig_verified'
      },
      body: JSON.stringify({
        CallSid: id,
        From: callerNumber,
        direction: 'inbound',
        provider: 'simulator'
      })
    });
    if (!res.ok) {
      throw new Error(`Failed to start call: ${res.statusText}`);
    }
    return parseTelephonyResponse(res);
  },

  /**
   * Send DTMF keypress to backend
   */
  sendDtmf: async (callId: string, digit: string): Promise<IvrActionResponse> => {
    const res = await fetch(`/api/v1/ivr/dtmf?callId=${encodeURIComponent(callId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/xml, */*',
        'x-telephony-provider': 'simulator',
        'x-telephony-signature': 'sim_sig_verified'
      },
      body: JSON.stringify({
        CallSid: callId,
        Digits: digit,
        provider: 'simulator'
      })
    });
    if (!res.ok) {
      throw new Error(`Failed to send DTMF: ${res.statusText}`);
    }
    return parseTelephonyResponse(res);
  },

  /**
   * Send voice recording to backend
   */
  sendRecording: async (
    callId: string,
    recordingUrl: string,
    durationSeconds = 15,
    sampleTranscript?: string
  ): Promise<IvrActionResponse> => {
    const res = await fetch(`/api/v1/ivr/recording?callId=${encodeURIComponent(callId)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/xml, */*',
        'x-telephony-provider': 'simulator',
        'x-telephony-signature': 'sim_sig_verified'
      },
      body: JSON.stringify({
        CallSid: callId,
        RecordingUrl: recordingUrl,
        durationSeconds,
        transcript: sampleTranscript,
        provider: 'simulator'
      })
    });
    if (!res.ok) {
      throw new Error(`Failed to send recording: ${res.statusText}`);
    }
    return parseTelephonyResponse(res);
  },

  /**
   * End call on backend
   */
  endCall: async (callId: string, durationSeconds: number, disposition = 'completed'): Promise<void> => {
    await fetch('/api/v1/ivr/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-telephony-provider': 'simulator',
        'x-telephony-signature': 'sim_sig_verified'
      },
      body: JSON.stringify({
        CallSid: callId,
        CallDuration: durationSeconds,
        CallStatus: disposition,
        provider: 'simulator'
      })
    }).catch(() => {});
  },

  /**
   * Trigger Missed Call webhook (for 30s free callback flow)
   */
  triggerMissedCall: async (callerNumber: string): Promise<{ success: boolean; message: string; callbackId?: string }> => {
    const res = await fetch('/api/v1/ivr/missed-call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, */*'
      },
      body: JSON.stringify({
        From: callerNumber
      })
    });
    if (!res.ok) {
      throw new Error(`Failed to trigger missed call: ${res.statusText}`);
    }
    try {
      return await res.json();
    } catch {
      return { success: true, message: 'Missed call registered' };
    }
  }
};

// Fixed and complete IVR Node dictionary for offline / client fallback
export const IVR_NODES: Record<string, IvrNode> = {
  welcome: {
    id: 'welcome',
    spokenPromptHindi: 'नमस्ते! स्किलब्रिज में आपका स्वागत है। हिंदी के लिए १ दबाएं। मराठी साठी २ दाबा। For English press ३.',
    spokenPromptEnglish: 'Welcome to SkillBridge IVR voice assistant. Press 1 for Hindi, 2 for Marathi, 3 for English.',
    spokenPromptMarathi: 'नमस्कार! स्किलब्रिज व्हॉईस असिस्टंटमध्ये आपले स्वागत आहे. मराठीसाठी २ दाबा.',
    dtmfOptions: {
      '1': { label: 'हिंदी (Hindi)', nextNodeId: 'main_menu_hi' },
      '2': { label: 'मराठी (Marathi)', nextNodeId: 'main_menu_mr' },
      '3': { label: 'English', nextNodeId: 'main_menu_en' }
    }
  },
  main_menu_hi: {
    id: 'main_menu_hi',
    spokenPromptHindi: 'नया काम पाने या रजिस्ट्रेशन के लिए १ दबाएं। अपने काम की परीक्षा (स्किल टेस्ट) देने के लिए २ दबाएं। अपनी कमाई जानने के लिए ३ दबाएं।',
    spokenPromptEnglish: 'Press 1 to register or find new work. Press 2 to take the skill verification quiz. Press 3 to check earnings.',
    dtmfOptions: {
      '1': { label: 'नया रजिस्ट्रेशन (Register)', nextNodeId: 'voice_record_prompt', action: 'START_VOICE_REG' },
      '2': { label: 'स्किल टेस्ट (Quiz)', nextNodeId: 'quiz_q1', action: 'START_SKILL_QUIZ' },
      '3': { label: 'कमाई बैलेंस (Earnings)', nextNodeId: 'earnings_info' },
      '0': { label: 'दोहराएं (Repeat)', nextNodeId: 'main_menu_hi' }
    }
  },
  main_menu_mr: {
    id: 'main_menu_mr',
    spokenPromptHindi: 'मराठी मुख्य मेन्यू',
    spokenPromptEnglish: 'Marathi Main Menu. Press 1 for registration, 2 for skill quiz, 3 for earnings.',
    spokenPromptMarathi: 'नवीन कामासाठी किंवा नोंदणीसाठी १ दाबा. कौशल्य परीक्षेसाठी २ दाबा. मिळकत आणि खात्यातील रक्कम तपासण्यासाठी ३ दाबा.',
    dtmfOptions: {
      '1': { label: 'नवीन नोंदणी (Register)', nextNodeId: 'voice_record_prompt', action: 'START_VOICE_REG' },
      '2': { label: 'कौशल्य चाचणी (Quiz)', nextNodeId: 'quiz_q1', action: 'START_SKILL_QUIZ' },
      '3': { label: 'मिळकत व शिल्लक (Earnings)', nextNodeId: 'earnings_info' },
      '0': { label: 'पुन्हा ऐका (Repeat)', nextNodeId: 'main_menu_mr' }
    }
  },
  main_menu_en: {
    id: 'main_menu_en',
    spokenPromptHindi: 'इंग्लिश मुख्य मेन्यू',
    spokenPromptEnglish: 'SkillBridge Main Menu. Press 1 to register or find work. Press 2 for skill quiz. Press 3 to check your earnings and balance.',
    dtmfOptions: {
      '1': { label: 'Register as Worker', nextNodeId: 'voice_record_prompt', action: 'START_VOICE_REG' },
      '2': { label: 'Skill Certification Quiz', nextNodeId: 'quiz_q1', action: 'START_SKILL_QUIZ' },
      '3': { label: 'Earnings & Balance', nextNodeId: 'earnings_info' },
      '0': { label: 'Repeat Menu', nextNodeId: 'main_menu_en' }
    }
  },
  voice_record_prompt: {
    id: 'voice_record_prompt',
    spokenPromptHindi: 'बीप की आवाज़ के बाद, अपना नाम, हुनर, अनुभव और शहर बोलें। समाप्त करने के लिए हैश (#) दबाएं।',
    spokenPromptEnglish: 'After the beep, speak your name, trade, experience, and city. Press hash (#) when done.',
    spokenPromptMarathi: 'बीपनंतर आपले नाव, काम, अनुभव आणि शहर सांगा. संपल्यावर हॅश (#) दाबा.',
    dtmfOptions: {
      '#': { label: 'समाप्त करें (#)', nextNodeId: 'record_confirm', action: 'SAVE_VOICE' }
    }
  },
  record_confirm: {
    id: 'record_confirm',
    spokenPromptHindi: 'आपकी आवाज़ दर्ज कर ली गई है। आपका प्रोफाइल तैयार हो चुका है। स्किलब्रिज वेरिफाइड बैज के लिए १ दबाएं।',
    spokenPromptEnglish: 'Your voice profile is saved. Press 1 to start skill verification quiz.',
    spokenPromptMarathi: 'आपला व्हॉईस प्रोफाइल तयार झाला आहे. कौशल्य चाचणी सुरू करण्यासाठी १ दाबा.',
    dtmfOptions: {
      '1': { label: 'स्किल टेस्ट शुरू करें', nextNodeId: 'quiz_q1', action: 'START_SKILL_QUIZ' },
      '0': { label: 'मुख्य मेन्यू', nextNodeId: 'main_menu_hi' }
    }
  },
  quiz_q1: {
    id: 'quiz_q1',
    spokenPromptHindi: 'पहला सवाल: बिजली वायरिंग में अर्थिंग तार किस रंग का होता है? हरे रंग के लिए १ दबाएं, लाल के लिए २ दबाएं, काले के लिए ३ दबाएं।',
    spokenPromptEnglish: 'Question 1: In standard home electrical wiring, what color is the grounding wire? Press 1 for Green, 2 for Red, 3 for Black.',
    spokenPromptMarathi: 'पहिला प्रश्न: अर्थिंग वायर कोणत्या रंगाची असते? हिरव्यासाठी १, लालसाठी २, काळ्यासाठी ३ दाबा.',
    dtmfOptions: {
      '1': { label: 'हरा (Green - Correct)', nextNodeId: 'quiz_q2', action: 'SCORE_CORRECT' },
      '2': { label: 'लाल (Red)', nextNodeId: 'quiz_q2' },
      '3': { label: 'काला (Black)', nextNodeId: 'quiz_q2' }
    }
  },
  quiz_q2: {
    id: 'quiz_q2',
    spokenPromptHindi: 'दूसरा सवाल: अगर शॉर्ट सर्किट हो जाए, तो सबसे पहले क्या करना चाहिए? मेन एमसीबी स्विच बंद करने के लिए १ दबाएं, पानी डालने के लिए २ दबाएं।',
    spokenPromptEnglish: 'Question 2: What should you do first in a short circuit? Press 1 to turn off Main MCB, press 2 to pour water.',
    spokenPromptMarathi: 'दुसरा प्रश्न: शॉर्ट सर्किट झाल्यावर काय करावे? मेन एमसीबी बंद करण्यासाठी १ दाबा.',
    dtmfOptions: {
      '1': { label: 'मेन एमसीबी बंद करें (Correct)', nextNodeId: 'quiz_complete', action: 'SCORE_CORRECT' },
      '2': { label: 'पानी डालें (Wrong)', nextNodeId: 'quiz_complete' }
    }
  },
  quiz_complete: {
    id: 'quiz_complete',
    spokenPromptHindi: 'बधाई हो! आपने परीक्षा सफलतापूर्वक पास कर ली है। आपके प्रोफाइल में वेरिफाइड बैज जोड़ दिया गया है। मुख्य मेन्यू के लिए ० दबाएं।',
    spokenPromptEnglish: 'Congratulations! You passed the IVR skill quiz. Verified badge awarded. Press 0 for main menu.',
    spokenPromptMarathi: 'अभिनंदन! आपण कौशल्य परीक्षा उत्तीर्ण केली आहे. मुख्य मेन्यूसाठी ० दाबा.',
    dtmfOptions: {
      '0': { label: 'मुख्य मेन्यू (Main Menu)', nextNodeId: 'main_menu_hi' }
    }
  },
  earnings_info: {
    id: 'earnings_info',
    spokenPromptHindi: 'आपके खाते में कुल कमाई ₹४,८०० है और वर्तमान में कोई भुगतान बाकी नहीं है। मुख्य मेन्यू के लिए ० दबाएं।',
    spokenPromptEnglish: 'Your total earnings are 4,800 rupees. Press 0 for main menu.',
    spokenPromptMarathi: 'आपल्या खात्यातील एकूण कमाई ४,८०० रुपये आहे. मुख्य मेन्यूसाठी ० दाबा.',
    dtmfOptions: {
      '0': { label: 'मुख्य मेन्यू', nextNodeId: 'main_menu_hi' }
    }
  }
};
