/**
 * WhatsApp Cloud API / Gupshup / Infobip Integration Service
 * 
 * Supports two-way conversational bot state machine for low-literacy trade workers:
 * NEW -> AWAITING_VOICE -> CONFIRM_PROFILE -> KYC_AADHAAR -> JOB_RESPONSE -> REVIEW -> REGISTERED
 * 
 * In production:
 * // swap with real API:
 * // const res = await fetch(`https://graph.facebook.com/v19.0/${process.env.WA_PHONE_NUMBER_ID}/messages`, {
 * //   method: 'POST',
 * //   headers: { 'Authorization': `Bearer ${process.env.WA_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
 * //   body: JSON.stringify({ messaging_product: 'whatsapp', to: workerPhone, type: 'text', text: { body } })
 * // });
 */

export type WhatsAppState =
  | 'NEW'
  | 'AWAITING_VOICE'
  | 'CONFIRM_PROFILE'
  | 'KYC_AADHAAR'
  | 'JOB_RESPONSE'
  | 'REVIEW'
  | 'REGISTERED';

export interface WhatsAppMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  isVoice?: boolean;
  voiceDurationSeconds?: number;
  buttons?: Array<{ label: string; payload: string }>;
  timestamp: string;
}

export interface WhatsAppBotSession {
  phone: string;
  state: WhatsAppState;
  extractedProfile?: {
    name?: string;
    skill?: string;
    experienceYears?: number;
    location?: string;
  };
  messages: WhatsAppMessage[];
}

export const whatsappService = {
  /**
   * Initializes a WhatsApp chat session for the given phone number
   */
  startSession: (phone: string): WhatsAppBotSession => {
    return {
      phone,
      state: 'AWAITING_VOICE',
      messages: [
        {
          id: 'wa-1',
          sender: 'bot',
          text: '🙏 नमस्ते! स्किलब्रिज (SkillBridge) में आपका स्वागत है।\n\nयहाँ आप सिर्फ बोलकर अपना प्रोफाइल बना सकते हैं और सीधे काम पा सकते हैं।\n\nकृपया 🎤 वॉइस नोट भेजकर बताएं:\n१) आपका नाम\n२) आपका काम (जैसे: इलेक्ट्रीशियन, प्लंबर, कारपेंटर)\n३) कितने साल का अनुभव है\n४) आपका शहर/ज़िला',
          buttons: [
            { label: '🎤 रिकॉर्ड वॉइस नोट', payload: 'RECORD_VOICE' },
            { label: 'English में बदलें', payload: 'LANG_EN' }
          ],
          timestamp: new Date().toISOString()
        }
      ]
    };
  },

  /**
   * Process incoming user message and step through the state machine
   */
  processMessage: (
    session: WhatsAppBotSession,
    userText: string,
    isVoiceNote: boolean = false
  ): { nextState: WhatsAppState; botReply: WhatsAppMessage } => {
    const timestamp = new Date().toISOString();
    let replyText = '';
    let buttons: Array<{ label: string; payload: string }> | undefined;
    let nextState = session.state;

    switch (session.state) {
      case 'NEW':
      case 'AWAITING_VOICE':
        if (isVoiceNote || userText.toLowerCase().includes('voice') || userText.length > 5) {
          session.extractedProfile = {
            name: 'राजेश कुमार',
            skill: 'इलेक्ट्रीशियन (Electrician)',
            experienceYears: 8,
            location: 'नागपुर (Nagpur)'
          };
          nextState = 'CONFIRM_PROFILE';
          replyText = `✅ आपकी आवाज़ सुन ली गई है! AI द्वारा यह प्रोफाइल तैयार की गई:\n\n👤 नाम: राजेश कुमार\n⚡ काम: इलेक्ट्रीशियन (Electrician)\n⏱️ अनुभव: 8 वर्ष\n📍 शहर: नागपुर\n\nक्या यह जानकारी सही है?`;
          buttons = [
            { label: '✅ हाँ, सही है', payload: 'CONFIRM_YES' },
            { label: '✏️ बदलाव करें', payload: 'EDIT_PROFILE' }
          ];
        } else {
          replyText = 'कृपया अपना वॉइस नोट भेजें या अपना नाम और काम लिखकर बताएं।';
          buttons = [{ label: '🎤 वॉइस नोट भेजें', payload: 'RECORD_VOICE' }];
        }
        break;

      case 'CONFIRM_PROFILE':
        if (userText === 'CONFIRM_YES' || userText.includes('हाँ') || userText.includes('yes') || userText.includes('सही')) {
          nextState = 'KYC_AADHAAR';
          replyText = `🎉 बहुत बढ़िया! आपका प्रोफाइल सुरक्षित हो गया है।\n\nसरकारी 'वेरिफाइड कारीगर' (Verified Pro) बैज पाने के लिए अपना १२ अंकों का आधार नंबर दर्ज करें। (OTP आएगा, नंबर सुरक्षित रहेगा)`;
          buttons = [
            { label: '🔒 आधार OTP से सत्यापित करें', payload: 'AADHAAR_MOCK' },
            { label: 'बाद में करेंगे', payload: 'SKIP_KYC' }
          ];
        } else {
          replyText = 'कृपया सही नाम और काम बताएं।';
        }
        break;

      case 'KYC_AADHAAR':
        nextState = 'JOB_RESPONSE';
        replyText = `⭐ बधाई हो! आपका आधार e-KYC सफलतापूर्वक सत्यापित हो गया है। आपको 'Verified Pro' बैज मिल गया है!\n\n🔔 आपके इलाके में एक नया काम मिला है:\n\n🏢 धरमपेठ नागपुर में ३ दिन का घर वायरिंग काम\n💰 मजदूरी: ₹850 प्रति दिन\n📅 शुरू: कल सुबह ९:०० बजे\n\nक्या आप यह काम स्वीकार करना चाहते हैं?`;
        buttons = [
          { label: '✅ हाँ, काम स्वीकार करें', payload: 'ACCEPT_JOB_OFFER' },
          { label: '❌ मना करें', payload: 'DECLINE_JOB_OFFER' }
        ];
        break;

      case 'JOB_RESPONSE':
        if (userText === 'ACCEPT_JOB_OFFER' || userText.includes('स्वीकार') || userText.includes('accept')) {
          nextState = 'REVIEW';
          replyText = `🤝 काम बुक हो गया है! ठेकेदार का फोन नंबर: +91 98221 00001 (सुनील शर्मा)।\n\nकाम खत्म होने पर अपनी १५ सेकंड की वॉइस रेटिंग ज़रूर भेजें ताकि आपका स्टार स्कोर बढ़े।`;
          buttons = [{ label: '⭐ काम पूरा हुआ (रिव्यू दें)', payload: 'TRIGGER_REVIEW' }];
        } else {
          nextState = 'REGISTERED';
          replyText = 'कोई बात नहीं, हम आपको जल्द ही अगला काम भेजेंगे।';
        }
        break;

      case 'REVIEW':
        nextState = 'REGISTERED';
        replyText = `🌟 धन्यवाद! आपका ५-स्टार रिव्यू और आवाज़ दर्ज कर ली गई है। आपका स्किलब्रिज स्कोर अब 4.9 हो गया है। नया काम आने पर हम आपको तुरंत WhatsApp करेंगे।`;
        buttons = [{ label: '📋 मेरा प्रोफाइल देखें', payload: 'VIEW_PROFILE' }];
        break;

      case 'REGISTERED':
      default:
        replyText = '🙏 स्किलब्रिज सक्रिय है। सहायता के लिए "काम", "प्रोफाइल" या "पैसे" लिखें।';
        buttons = [
          { label: '⚡ नए काम देखें', payload: 'CHECK_JOBS' },
          { label: '💰 कमाई बैलेंस', payload: 'CHECK_EARNINGS' }
        ];
        break;
    }

    const botReply: WhatsAppMessage = {
      id: `wa-bot-${Date.now()}`,
      sender: 'bot',
      text: replyText,
      buttons,
      timestamp
    };

    return { nextState, botReply };
  }
};
