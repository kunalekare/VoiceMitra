import { Router, Request, Response } from 'express';
import { sendSuccess } from '../utils/response';
import { db } from '../config/database';
import { logAuditEvent } from '../middleware/logger';

export const webhookRouter = Router();

// WhatsApp Bot Simulator Inbound Webhook
webhookRouter.post('/whatsapp', (req: Request, res: Response) => {
  const { from, message, state = 'NEW', audioBase64 } = req.body;
  const phone = from || '+919876543210';

  let nextState = state;
  let botResponse = '';
  let options: string[] = [];

  const text = (message || '').toLowerCase();

  switch (state) {
    case 'NEW':
      nextState = 'AWAITING_VOICE';
      botResponse = 'नमस्ते! स्किलब्रिज (SkillBridge) में आपका स्वागत है। अपना नाम, काम (जैसे इलेक्ट्रीशियन, प्लंबर) और अनुभव बोलकर बताएं या वॉयस नोट भेजें।';
      options = ['🎤 वॉयस नोट रिकॉर्ड करें', '⚡ मैं इलेक्ट्रीशियन हूँ', '🔧 मैं प्लंबर हूँ'];
      break;

    case 'AWAITING_VOICE':
      nextState = 'CONFIRM_PROFILE';
      botResponse = 'धन्यवाद! हमने आपकी जानकारी दर्ज की:\n• नाम: राजेश कुमार\n• काम: इलेक्ट्रीशियन (वायरिंग & इनवर्टर)\n• अनुभव: 5 वर्ष\n• जिला: नागपुर\n\nक्या यह जानकारी सही है?';
      options = ['✅ हाँ, बिल्कुल सही है', '✏️ बदलाव करें'];
      break;

    case 'CONFIRM_PROFILE':
      if (text.includes('हाँ') || text.includes('सही') || text.includes('yes')) {
        nextState = 'KYC_AADHAAR';
        botResponse = 'प्रोफ़ाइल तैयार है! अपने खाते पर "वेरिफाइड कारीगर" बैज पाने के लिए अपना 12 अंकों का आधार नंबर दर्ज करें (डेटा सुरक्षित है)।';
        options = ['1234-5678-9012 दर्ज करें', 'बाद में करें'];
      } else {
        nextState = 'AWAITING_VOICE';
        botResponse = 'कृपया अपना सही काम और जिला दोबारा लिखकर या बोलकर बताएं।';
      }
      break;

    case 'KYC_AADHAAR':
      nextState = 'REGISTERED';
      botResponse = 'बधाई हो! आपका आधार सफलतापूर्वक सत्यापित हो गया है (XXXX-XXXX-9012)। अब आपके पास नए जॉब के अलर्ट सीधे व्हाट्सएप पर आएंगे!';
      options = ['💼 नई नौकरियां देखें', '💰 मेरा वॉलेट चेक करें'];
      break;

    default:
      botResponse = 'स्किलब्रिज सहायता केंद्र: यदि आप काम ढूंढ रहे हैं तो 1 दबाएं, ग्राहक सहायता के लिए 2 दबाएं।';
      options = ['1. नया काम', '2. सहायता'];
  }

  logAuditEvent(phone, 'worker', 'WHATSAPP_WEBHOOK_MESSAGE', 'webhook', phone, undefined, {
    state,
    nextState,
    inputSnippet: message
  });

  return sendSuccess(req, res, {
    from: phone,
    reply: botResponse,
    nextState,
    quickReplies: options
  });
});

// IVR Telephony DTMF Inbound Webhook (Exotel / Twilio style)
webhookRouter.post('/ivr', (req: Request, res: Response) => {
  const { callSid, digits, step = 'WELCOME', phone = '+919876543210' } = req.body;

  let nextStep = step;
  let spokenPrompt = '';
  let acceptedDigits = '';

  switch (step) {
    case 'WELCOME':
      nextStep = 'LANGUAGE_SELECT';
      spokenPrompt = 'Welcome to SkillBridge VoiceLine. हिंदी के लिए 1 दबाएं. For English press 2. मराठी साठी 3 दाबा.';
      acceptedDigits = '1,2,3';
      break;

    case 'LANGUAGE_SELECT':
      nextStep = 'TRADE_SELECT';
      spokenPrompt = 'कारीगर पंजीकरण के लिए: इलेक्ट्रीशियन हेतु 1 दबाएं, प्लंबर हेतु 2 दबाएं, बढ़ई हेतु 3 दबाएं, अन्य कार्य हेतु 4 दबाएं.';
      acceptedDigits = '1,2,3,4';
      break;

    case 'TRADE_SELECT':
      nextStep = 'EXPERIENCE_INPUT';
      spokenPrompt = 'कृपया अपना अनुभव वर्षों में दर्ज करें और हैश की दबाएं. उदाहरण के लिए 5 साल के लिए 5# दबाएं.';
      acceptedDigits = '0-9#';
      break;

    case 'EXPERIENCE_INPUT':
      nextStep = 'CONFIRMATION';
      spokenPrompt = 'धन्यवाद! आपकी आवाज़ और कार्य विवरण स्किलब्रिज नेटवर्क पर दर्ज कर लिया गया है. नए काम के लिए आपको कॉल आएगी.';
      acceptedDigits = '1';
      break;

    default:
      spokenPrompt = 'स्किलब्रिज पर संपर्क करने के लिए धन्यवाद. नमस्कार!';
      nextStep = 'HANGUP';
  }

  logAuditEvent(phone, 'worker', 'IVR_DTMF_EVENT', 'ivr', callSid || 'call-01', undefined, {
    step,
    nextStep,
    digits
  });

  return sendSuccess(req, res, {
    callSid: callSid || `call-${Date.now()}`,
    spokenPrompt,
    nextStep,
    acceptedDigits
  });
});
