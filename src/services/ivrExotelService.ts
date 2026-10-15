/**
 * IVR Telephony Gateway Service (Exotel / Twilio / Knowlarity)
 * 
 * Provides automated phone call tree with interactive voice prompts and DTMF tone capture.
 * Designed for feature phone users and workers who cannot read or write.
 * 
 * In production:
 * // swap with real API:
 * // const exotel = await fetch(`https://api.exotel.com/v1/Accounts/${SID}/Calls/connect`, {
 * //   method: 'POST',
 * //   body: new URLSearchParams({ From: workerPhone, To: '08047190000', Url: 'https://skillbridge.in/ivr/app' })
 * // });
 */

export interface IvrNode {
  id: string;
  spokenPromptHindi: string;
  spokenPromptEnglish: string;
  dtmfOptions: Record<string, { label: string; nextNodeId: string; action?: string }>;
}

export const IVR_NODES: Record<string, IvrNode> = {
  welcome: {
    id: 'welcome',
    spokenPromptHindi: 'नमस्ते! स्किलब्रिज में आपका स्वागत है। हिंदी के लिए एक दबाएं। मराठी साठी दोन दाबा। For English, press three.',
    spokenPromptEnglish: 'Welcome to SkillBridge IVR voice assistant. Press 1 for Hindi, 2 for Marathi, 3 for English.',
    dtmfOptions: {
      '1': { label: 'हिंदी (Hindi)', nextNodeId: 'main_menu_hi' },
      '2': { label: 'मराठी (Marathi)', nextNodeId: 'main_menu_mr' },
      '3': { label: 'English', nextNodeId: 'main_menu_en' }
    }
  },
  main_menu_hi: {
    id: 'main_menu_hi',
    spokenPromptHindi: 'नया काम पाने या रजिस्ट्रेशन के लिए एक दबाएं। अपने काम की परीक्षा (स्किल टेस्ट) देने के लिए दो दबाएं। अपनी कमाई जानने के लिए तीन दबाएं।',
    spokenPromptEnglish: 'Press 1 to register or find new work. Press 2 to take the skill verification quiz. Press 3 to check earnings.',
    dtmfOptions: {
      '1': { label: 'नया रजिस्ट्रेशन (Register)', nextNodeId: 'voice_record_prompt', action: 'START_VOICE_REG' },
      '2': { label: 'स्किल टेस्ट (Quiz)', nextNodeId: 'quiz_q1', action: 'START_SKILL_QUIZ' },
      '3': { label: 'कमाई बैलेंस (Earnings)', nextNodeId: 'earnings_info' }
    }
  },
  voice_record_prompt: {
    id: 'voice_record_prompt',
    spokenPromptHindi: 'बीप की आवाज़ के बाद, अपना नाम, हुनर, अनुभव और शहर बोलें। समाप्त करने के लिए हैश (#) दबाएं।',
    spokenPromptEnglish: 'After the beep, speak your name, trade, experience, and city. Press hash (#) when done.',
    dtmfOptions: {
      '#': { label: 'समाप्त करें (#)', nextNodeId: 'record_confirm', action: 'SAVE_VOICE' }
    }
  },
  record_confirm: {
    id: 'record_confirm',
    spokenPromptHindi: 'आपकी आवाज़ दर्ज कर ली गई है। आपका प्रोफाइल तैयार हो चुका है। स्किलब्रिज वेरिफाइड बैज के लिए १ दबाएं।',
    spokenPromptEnglish: 'Your voice profile is saved. Press 1 to start skill verification quiz.',
    dtmfOptions: {
      '1': { label: 'स्किल टेस्ट शुरू करें', nextNodeId: 'quiz_q1', action: 'START_SKILL_QUIZ' }
    }
  },
  quiz_q1: {
    id: 'quiz_q1',
    spokenPromptHindi: 'पहला सवाल: बिजली वायरिंग में अर्थिंग (Earthing) तार किस रंग का होता है? हरे रंग के लिए १ दबाएं, लाल के लिए २ दबाएं, काले के लिए ३ दबाएं।',
    spokenPromptEnglish: 'Question 1: In standard home electrical wiring, what color is the grounding wire? Press 1 for Green, 2 for Red, 3 for Black.',
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
    dtmfOptions: {
      '1': { label: 'मेन एमसीबी बंद करें (Correct)', nextNodeId: 'quiz_complete', action: 'SCORE_CORRECT' },
      '2': { label: 'पानी डालें (Wrong)', nextNodeId: 'quiz_complete' }
    }
  },
  quiz_complete: {
    id: 'quiz_complete',
    spokenPromptHindi: 'बधाई हो! आपने परीक्षा सफलतापूर्वक पास कर ली है। आपके प्रोफाइल में "वेरिफाइड इलेक्ट्रीशियन" बैज जोड़ दिया गया है। धन्यवाद!',
    spokenPromptEnglish: 'Congratulations! You passed the IVR skill quiz. Verified badge awarded.',
    dtmfOptions: {
      '0': { label: 'मुख्य मेन्यू (Main Menu)', nextNodeId: 'main_menu_hi' }
    }
  },
  earnings_info: {
    id: 'earnings_info',
    spokenPromptHindi: 'आपके खाते में कुल कमाई ₹४,८०० है और वर्तमान में कोई भुगतान बाकी नहीं है। मुख्य मेन्यू के लिए ० दबाएं।',
    spokenPromptEnglish: 'Your total earnings are 4,800 rupees. Press 0 for main menu.',
    dtmfOptions: {
      '0': { label: 'मुख्य मेन्यू', nextNodeId: 'main_menu_hi' }
    }
  }
};
