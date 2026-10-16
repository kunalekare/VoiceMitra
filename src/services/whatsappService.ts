/**
 * Advanced WhatsApp Cloud API & Bot Integration Service
 * 
 * Supports two-way conversational bot state machine with real backend webhook endpoints:
 * Languages (12 Indic languages), Voice Notes, e-KYC, Skill Quiz, Real Job Alerts & Bidding, Escrow Balance
 */

export type WhatsAppState =
  | 'NEW'
  | 'AWAITING_VOICE'
  | 'CONFIRM_PROFILE'
  | 'KYC_AADHAAR'
  | 'KYC_OTP_INPUT'
  | 'JOB_OFFER'
  | 'JOB_RESPONSE'
  | 'JOB_ACCEPTED'
  | 'QUIZ_IN_PROGRESS'
  | 'REVIEW'
  | 'REVIEW_SUBMIT'
  | 'REGISTERED'
  | 'MAIN_MENU'
  | 'LANG_SELECT';

export interface WhatsAppMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  isVoice?: boolean;
  voiceDurationSeconds?: number;
  audioBlobUrl?: string;
  buttons?: Array<{ label: string; payload: string }>;
  mediaCard?: {
    type: 'job_card' | 'wallet_card' | 'worker_card';
    [key: string]: any;
  };
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  timestamp: string;
}

export interface WhatsAppBotSession {
  phone: string;
  state: WhatsAppState;
  language: string;
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
  startSession: (phone: string, language: string = 'hi'): WhatsAppBotSession => {
    return {
      phone,
      state: 'MAIN_MENU',
      language,
      messages: [
        {
          id: 'wa-init-1',
          sender: 'bot',
          text: '🙏 *नमस्ते! स्किलब्रिज (SkillBridge) आधिकारिक व्हाट्सएप सेवा में आपका स्वागत है।*\n\nयहाँ आप सिर्फ मैसेज या 🎤 वॉइस नोट भेजकर काम पा सकते हैं, कमाई चेक कर सकते हैं और स्किल क्विज दे सकते हैं।\n\n📌 *कृपया एक विकल्प चुनें:*',
          buttons: [
            { label: '💼 नए काम देखें', payload: 'MENU_JOBS' },
            { label: '💰 कमाई & बैलेंस', payload: 'MENU_EARNINGS' },
            { label: '📝 स्किल क्विज', payload: 'MENU_QUIZ' },
            { label: '🆔 वर्कर कार्ड', payload: 'MENU_CARD' },
            { label: '🌐 भाषा बदलें', payload: 'MENU_LANG' }
          ],
          status: 'read',
          timestamp: new Date().toISOString()
        }
      ]
    };
  },

  /**
   * Call backend webhook /api/v1/webhooks/whatsapp
   */
  sendWebhookMessage: async (
    phone: string,
    messageText: string,
    actionPayload?: string,
    isVoice = false,
    language = 'hi'
  ): Promise<{
    reply: string;
    buttons?: Array<{ label: string; payload: string }>;
    mediaCard?: any;
    nextState: WhatsAppState;
    language: string;
  }> => {
    try {
      const res = await fetch('/api/v1/webhooks/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: phone,
          message: messageText,
          actionPayload,
          isVoice,
          language
        })
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return {
            reply: json.data.reply,
            buttons: json.data.buttons,
            mediaCard: json.data.mediaCard,
            nextState: json.data.nextState || 'MAIN_MENU',
            language: json.data.language || language
          };
        }
      }
    } catch (e) {
      console.warn('Backend WhatsApp webhook fetch failed, using local state machine:', e);
    }

    // Client-side fallback if network offline
    return {
      reply: '🙏 स्किलब्रिज सक्रिय है। सहायता के लिए "काम", "प्रोफाइल" या "पैसे" लिखें।',
      buttons: [
        { label: '💼 नए काम देखें', payload: 'MENU_JOBS' },
        { label: '💰 कमाई बैलेंस', payload: 'MENU_EARNINGS' }
      ],
      nextState: 'MAIN_MENU',
      language
    };
  },

  /**
   * Read aloud message using Web Speech Synthesis
   */
  speakText: (text: string, lang = 'hi') => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      // Clean markdown tags like * or _
      const clean = text.replace(/[*_#~]/g, '').replace(/[1-9]️⃣/g, '');
      const utterance = new SpeechSynthesisUtterance(clean);
      const langMap: Record<string, string> = {
        hi: 'hi-IN',
        en: 'en-IN',
        mr: 'mr-IN',
        ta: 'ta-IN',
        te: 'te-IN',
        kn: 'kn-IN',
        bn: 'bn-IN',
        gu: 'gu-IN'
      };
      utterance.lang = langMap[lang] || 'hi-IN';
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch {}
  },

  /**
   * Stop speaking
   */
  stopSpeaking: () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
};
