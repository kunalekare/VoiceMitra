export interface SeedIvrNode {
  id: string;
  name: string;
  category: 'onboarding' | 'worker' | 'employer' | 'quiz' | 'payment' | 'support' | 'general';
  isTerminal?: boolean;
  timeoutSeconds?: number;
  maxAttempts?: number;
}

export interface SeedIvrTransition {
  fromNodeId: string;
  dtmfKey: string;
  toNodeId: string;
  action?: string;
  label: string;
  priority?: number;
}

export interface SeedIvrPrompt {
  nodeId: string;
  language: string;
  promptText: string;
}

export const SEED_IVR_NODES: SeedIvrNode[] = [
  { id: 'consent_notice', name: 'Recording Consent & Greeting', category: 'general', timeoutSeconds: 3 },
  { id: 'lang_select_1', name: 'Language Selection Page 1', category: 'onboarding', timeoutSeconds: 5 },
  { id: 'lang_select_2', name: 'Language Selection Page 2', category: 'onboarding', timeoutSeconds: 5 },
  { id: 'guest_main_menu', name: 'Guest Main Menu', category: 'general', timeoutSeconds: 6 },
  { id: 'worker_main_menu', name: 'Worker Main Menu', category: 'worker', timeoutSeconds: 6 },
  { id: 'employer_main_menu', name: 'Employer Main Menu', category: 'employer', timeoutSeconds: 6 },
  { id: 'voice_reg_prompt', name: 'Voice Profile Recording', category: 'onboarding', timeoutSeconds: 45 },
  { id: 'voice_reg_confirm', name: 'Voice Profile Confirmation', category: 'onboarding', timeoutSeconds: 5 },
  { id: 'voice_reg_success', name: 'Registration Success', category: 'onboarding', timeoutSeconds: 5 },
  { id: 'quiz_intro', name: 'Skill Quiz Introduction', category: 'quiz', timeoutSeconds: 4 },
  { id: 'quiz_question', name: 'Skill Quiz Question', category: 'quiz', timeoutSeconds: 8 },
  { id: 'quiz_complete', name: 'Skill Quiz Complete', category: 'quiz', timeoutSeconds: 5 },
  { id: 'earnings_pin_prompt', name: 'Earnings PIN Verification', category: 'payment', timeoutSeconds: 10 },
  { id: 'earnings_summary', name: 'Earnings & Balance Summary', category: 'payment', timeoutSeconds: 6 },
  { id: 'earnings_payout_history', name: 'Recent Payout History', category: 'payment', timeoutSeconds: 5 },
  { id: 'availability_menu', name: 'Worker Availability Toggle', category: 'worker', timeoutSeconds: 5 },
  { id: 'job_alerts_menu', name: 'Job Offer Alerts & Acceptance', category: 'worker', timeoutSeconds: 7 },
  { id: 'job_status_menu', name: 'Job Status Progress Update', category: 'worker', timeoutSeconds: 5 },
  { id: 'voice_review_prompt', name: 'Voice Review & Rating', category: 'worker', timeoutSeconds: 30 },
  { id: 'employer_active_jobs', name: 'Employer Active Jobs', category: 'employer', timeoutSeconds: 6 },
  { id: 'agent_transfer', name: 'Agent Support Transfer', category: 'support', isTerminal: true },
  { id: 'voicemail_prompt', name: 'After Hours Voicemail', category: 'support', timeoutSeconds: 40 },
  { id: 'call_goodbye', name: 'Polite Call Goodbye', category: 'general', isTerminal: true }
];

export const SEED_IVR_TRANSITIONS: SeedIvrTransition[] = [
  // Consent auto-transitions or any key to language menu
  { fromNodeId: 'consent_notice', dtmfKey: '#', toNodeId: 'lang_select_1', label: 'Skip Notice' },
  { fromNodeId: 'consent_notice', dtmfKey: '0', toNodeId: 'lang_select_1', label: 'Proceed' },

  // Language Page 1
  { fromNodeId: 'lang_select_1', dtmfKey: '1', toNodeId: 'caller_verify', action: 'SET_LANG_HI', label: 'Hindi' },
  { fromNodeId: 'lang_select_1', dtmfKey: '2', toNodeId: 'caller_verify', action: 'SET_LANG_MR', label: 'Marathi' },
  { fromNodeId: 'lang_select_1', dtmfKey: '3', toNodeId: 'caller_verify', action: 'SET_LANG_TA', label: 'Tamil' },
  { fromNodeId: 'lang_select_1', dtmfKey: '4', toNodeId: 'caller_verify', action: 'SET_LANG_TE', label: 'Telugu' },
  { fromNodeId: 'lang_select_1', dtmfKey: '5', toNodeId: 'caller_verify', action: 'SET_LANG_KN', label: 'Kannada' },
  { fromNodeId: 'lang_select_1', dtmfKey: '6', toNodeId: 'caller_verify', action: 'SET_LANG_ML', label: 'Malayalam' },
  { fromNodeId: 'lang_select_1', dtmfKey: '7', toNodeId: 'caller_verify', action: 'SET_LANG_BN', label: 'Bengali' },
  { fromNodeId: 'lang_select_1', dtmfKey: '8', toNodeId: 'lang_select_2', label: 'More Languages' },

  // Language Page 2
  { fromNodeId: 'lang_select_2', dtmfKey: '1', toNodeId: 'caller_verify', action: 'SET_LANG_GU', label: 'Gujarati' },
  { fromNodeId: 'lang_select_2', dtmfKey: '2', toNodeId: 'caller_verify', action: 'SET_LANG_OR', label: 'Odia' },
  { fromNodeId: 'lang_select_2', dtmfKey: '3', toNodeId: 'caller_verify', action: 'SET_LANG_PA', label: 'Punjabi' },
  { fromNodeId: 'lang_select_2', dtmfKey: '4', toNodeId: 'caller_verify', action: 'SET_LANG_UR', label: 'Urdu' },
  { fromNodeId: 'lang_select_2', dtmfKey: '5', toNodeId: 'caller_verify', action: 'SET_LANG_EN', label: 'English' },
  { fromNodeId: 'lang_select_2', dtmfKey: '*', toNodeId: 'lang_select_1', label: 'Back' },

  // Guest Main Menu
  { fromNodeId: 'guest_main_menu', dtmfKey: '1', toNodeId: 'voice_reg_prompt', label: 'Register as Worker' },
  { fromNodeId: 'guest_main_menu', dtmfKey: '2', toNodeId: 'employer_active_jobs', label: 'Employer Helpline' },
  { fromNodeId: 'guest_main_menu', dtmfKey: '8', toNodeId: 'lang_select_1', label: 'Change Language' },
  { fromNodeId: 'guest_main_menu', dtmfKey: '9', toNodeId: 'agent_transfer', label: 'Support Agent' },
  { fromNodeId: 'guest_main_menu', dtmfKey: '0', toNodeId: 'guest_main_menu', label: 'Repeat Menu' },

  // Worker Main Menu
  { fromNodeId: 'worker_main_menu', dtmfKey: '1', toNodeId: 'job_alerts_menu', label: 'Job Alerts' },
  { fromNodeId: 'worker_main_menu', dtmfKey: '2', toNodeId: 'quiz_intro', label: 'Skill Quiz' },
  { fromNodeId: 'worker_main_menu', dtmfKey: '3', toNodeId: 'earnings_pin_prompt', label: 'Earnings & Wallet' },
  { fromNodeId: 'worker_main_menu', dtmfKey: '4', toNodeId: 'availability_menu', label: 'Change Availability' },
  { fromNodeId: 'worker_main_menu', dtmfKey: '5', toNodeId: 'job_status_menu', label: 'Job Status Updates' },
  { fromNodeId: 'worker_main_menu', dtmfKey: '8', toNodeId: 'lang_select_1', label: 'Change Language' },
  { fromNodeId: 'worker_main_menu', dtmfKey: '9', toNodeId: 'agent_transfer', label: 'Support Agent' },
  { fromNodeId: 'worker_main_menu', dtmfKey: '0', toNodeId: 'worker_main_menu', label: 'Repeat Menu' },
  { fromNodeId: 'worker_main_menu', dtmfKey: '*', toNodeId: 'call_goodbye', label: 'Exit Call' },

  // Employer Main Menu
  { fromNodeId: 'employer_main_menu', dtmfKey: '1', toNodeId: 'employer_active_jobs', label: 'Active Postings' },
  { fromNodeId: 'employer_main_menu', dtmfKey: '8', toNodeId: 'lang_select_1', label: 'Change Language' },
  { fromNodeId: 'employer_main_menu', dtmfKey: '9', toNodeId: 'agent_transfer', label: 'Support Agent' },
  { fromNodeId: 'employer_main_menu', dtmfKey: '0', toNodeId: 'employer_main_menu', label: 'Repeat Menu' },
  { fromNodeId: 'employer_main_menu', dtmfKey: '*', toNodeId: 'call_goodbye', label: 'Exit Call' },

  // Guest Main Menu exit
  { fromNodeId: 'guest_main_menu', dtmfKey: '*', toNodeId: 'call_goodbye', label: 'Exit Call' },

  // Voice Registration Flow
  { fromNodeId: 'voice_reg_prompt', dtmfKey: '#', toNodeId: 'voice_reg_confirm', label: 'Finish Recording' },
  { fromNodeId: 'voice_reg_confirm', dtmfKey: '1', toNodeId: 'voice_reg_success', action: 'CONFIRM_REG', label: 'Confirm' },
  { fromNodeId: 'voice_reg_confirm', dtmfKey: '2', toNodeId: 'voice_reg_prompt', label: 'Record Again' },
  { fromNodeId: 'voice_reg_success', dtmfKey: '1', toNodeId: 'quiz_intro', label: 'Start Quiz' },
  { fromNodeId: 'voice_reg_success', dtmfKey: '0', toNodeId: 'worker_main_menu', label: 'Main Menu' },

  // Quiz Flow
  { fromNodeId: 'quiz_intro', dtmfKey: '1', toNodeId: 'quiz_question', label: 'Start Question 1' },
  { fromNodeId: 'quiz_intro', dtmfKey: '#', toNodeId: 'quiz_question', label: 'Start Question 1' },
  { fromNodeId: 'quiz_question', dtmfKey: '1', toNodeId: 'quiz_complete', label: 'Option 1' },
  { fromNodeId: 'quiz_question', dtmfKey: '2', toNodeId: 'quiz_complete', label: 'Option 2' },
  { fromNodeId: 'quiz_question', dtmfKey: '3', toNodeId: 'quiz_complete', label: 'Option 3' },
  { fromNodeId: 'quiz_question', dtmfKey: '4', toNodeId: 'quiz_complete', label: 'Option 4' },
  { fromNodeId: 'quiz_complete', dtmfKey: '0', toNodeId: 'worker_main_menu', label: 'Main Menu' },
  { fromNodeId: 'quiz_complete', dtmfKey: '*', toNodeId: 'worker_main_menu', label: 'Main Menu' },

  // Earnings Flow
  { fromNodeId: 'earnings_pin_prompt', dtmfKey: '#', toNodeId: 'earnings_summary', label: 'Submit PIN' },
  { fromNodeId: 'earnings_pin_prompt', dtmfKey: '*', toNodeId: 'worker_main_menu', label: 'Back' },
  { fromNodeId: 'earnings_summary', dtmfKey: '1', toNodeId: 'earnings_payout_history', label: 'Recent Transactions' },
  { fromNodeId: 'earnings_summary', dtmfKey: '0', toNodeId: 'worker_main_menu', label: 'Main Menu' },
  { fromNodeId: 'earnings_summary', dtmfKey: '*', toNodeId: 'worker_main_menu', label: 'Back' },
  { fromNodeId: 'earnings_payout_history', dtmfKey: '0', toNodeId: 'worker_main_menu', label: 'Main Menu' },
  { fromNodeId: 'earnings_payout_history', dtmfKey: '*', toNodeId: 'earnings_summary', label: 'Back' },

  // Support Agent Transfer
  { fromNodeId: 'agent_transfer', dtmfKey: '*', toNodeId: 'voicemail_prompt', label: 'Leave Voicemail' },
  { fromNodeId: 'agent_transfer', dtmfKey: '#', toNodeId: 'call_goodbye', label: 'End Call' },

  // Availability Flow
  { fromNodeId: 'availability_menu', dtmfKey: '1', toNodeId: 'worker_main_menu', action: 'SET_AVAILABLE', label: 'Set Available' },
  { fromNodeId: 'availability_menu', dtmfKey: '2', toNodeId: 'worker_main_menu', action: 'SET_UNAVAILABLE', label: 'Set Unavailable' },
  { fromNodeId: 'availability_menu', dtmfKey: '0', toNodeId: 'worker_main_menu', label: 'Main Menu' },
  { fromNodeId: 'availability_menu', dtmfKey: '*', toNodeId: 'worker_main_menu', label: 'Back' },

  // Job Alerts Flow
  { fromNodeId: 'job_alerts_menu', dtmfKey: '1', toNodeId: 'worker_main_menu', action: 'ACCEPT_JOB', label: 'Accept Job' },
  { fromNodeId: 'job_alerts_menu', dtmfKey: '2', toNodeId: 'worker_main_menu', action: 'DECLINE_JOB', label: 'Decline Job' },
  { fromNodeId: 'job_alerts_menu', dtmfKey: '0', toNodeId: 'worker_main_menu', label: 'Main Menu' },
  { fromNodeId: 'job_alerts_menu', dtmfKey: '*', toNodeId: 'worker_main_menu', label: 'Back' },

  // Job Status Progress Update
  { fromNodeId: 'job_status_menu', dtmfKey: '1', toNodeId: 'worker_main_menu', action: 'START_JOB', label: 'Job Started' },
  { fromNodeId: 'job_status_menu', dtmfKey: '2', toNodeId: 'voice_review_prompt', action: 'COMPLETE_JOB', label: 'Job Completed' },
  { fromNodeId: 'job_status_menu', dtmfKey: '0', toNodeId: 'worker_main_menu', label: 'Main Menu' },

  // Voice Review Flow
  { fromNodeId: 'voice_review_prompt', dtmfKey: '1', toNodeId: 'call_goodbye', action: 'RATING_1', label: '1 Star' },
  { fromNodeId: 'voice_review_prompt', dtmfKey: '2', toNodeId: 'call_goodbye', action: 'RATING_2', label: '2 Stars' },
  { fromNodeId: 'voice_review_prompt', dtmfKey: '3', toNodeId: 'call_goodbye', action: 'RATING_3', label: '3 Stars' },
  { fromNodeId: 'voice_review_prompt', dtmfKey: '4', toNodeId: 'call_goodbye', action: 'RATING_4', label: '4 Stars' },
  { fromNodeId: 'voice_review_prompt', dtmfKey: '5', toNodeId: 'call_goodbye', action: 'RATING_5', label: '5 Stars' },
  { fromNodeId: 'voice_review_prompt', dtmfKey: '#', toNodeId: 'call_goodbye', label: 'Finish Review' },

  // Employer active jobs
  { fromNodeId: 'employer_active_jobs', dtmfKey: '0', toNodeId: 'employer_main_menu', label: 'Main Menu' },
  { fromNodeId: 'employer_active_jobs', dtmfKey: '*', toNodeId: 'employer_main_menu', label: 'Back' },

  // Voicemail
  { fromNodeId: 'voicemail_prompt', dtmfKey: '#', toNodeId: 'call_goodbye', label: 'Finish Voicemail' }
];

// Helper to generate seed prompts for all 12 languages with culturally natural spoken phrasing
export const SEED_IVR_PROMPTS: SeedIvrPrompt[] = [
  // 1. Consent Notice (Universal at call start)
  {
    nodeId: 'consent_notice',
    language: 'hi',
    promptText: 'नमस्ते! स्किलब्रिज हेल्पलाइन में आपका स्वागत है। गुणवत्ता और सुरक्षा के लिए यह कॉल रिकॉर्ड की जा सकती है।'
  },
  {
    nodeId: 'consent_notice',
    language: 'mr',
    promptText: 'नमस्कार! स्किलब्रिज हेल्पलाइनवर आपले स्वागत आहे. गुणवत्ता आणि सुरक्षेसाठी हा कॉल रेकॉर्ड केला जाऊ शकतो.'
  },
  {
    nodeId: 'consent_notice',
    language: 'ta',
    promptText: 'வணக்கம்! ஸ்கில்பிரிட்ஜ் உதவி எண்ணிற்கு நல்வரவு. பாதுகாப்பு காரணங்களுக்காக இந்த அழைப்பு பதிவு செய்யப்படலாம்.'
  },
  {
    nodeId: 'consent_notice',
    language: 'te',
    promptText: 'నమస్కారం! స్కిల్‌బ్రిడ్జ్ హెల్ప్‌లైన్‌కు స్వాగతం. నాణ్యత మరియు భద్రత కోసం ఈ కాల్ రికార్డ్ చేయబడవచ్చు.'
  },
  {
    nodeId: 'consent_notice',
    language: 'kn',
    promptText: 'ನಮಸ್ಕಾರ! ಸ್ಕಿಲ್‌ಬ್ರಿಡ್ಜ್ ಸಹಾಯವಾಣಿಗೆ ಸುಸ್ವಾಗತ. ಗುಣಮಟ್ಟ ಮತ್ತು ಸುರಕ್ಷತೆಗಾಗಿ ಈ ಕರೆಯನ್ನು ರೆಕಾರ್ಡ್ ಮಾಡಬಹುದು.'
  },
  {
    nodeId: 'consent_notice',
    language: 'ml',
    promptText: 'നമസ്കാരം! സ്കിൽബ്രിഡ്ജ് ഹെൽപ്പ് ലൈനിലേക്ക് സ്വാഗതം. ഗുണനിലവാരത്തിനും സുരക്ഷയ്ക്കുമായി ഈ കോൾ റെക്കോർഡ് ചെയ്തേക്കാം.'
  },
  {
    nodeId: 'consent_notice',
    language: 'bn',
    promptText: 'নমস্কার! স্কিলব্রিজ হেল্পলাইনে আপনাকে স্বাগতম। গুণমান এবং সুরক্ষার জন্য এই কল রেকর্ড করা হতে পারে।'
  },
  {
    nodeId: 'consent_notice',
    language: 'gu',
    promptText: 'નમસ્તે! સ્કિલબ્રિજ હેલ્પલાઇન પર આપનું સ્વાગત છે. ગુણવત્તા અને સુરક્ષા માટે આ કૉલ રેકોર્ડ થઈ શકે છે.'
  },
  {
    nodeId: 'consent_notice',
    language: 'or',
    promptText: 'ନମସ୍କାର! ସ୍କିଲବ୍ରିଜ୍ ହେଲ୍ପଲାଇନକୁ ସ୍ୱାଗତ। ଗୁଣବତ୍ତା ଏବଂ ସୁରକ୍ଷା ପାଇଁ ଏହି କଲ୍ ରେକର୍ଡ କରାଯାଇପାରେ।'
  },
  {
    nodeId: 'consent_notice',
    language: 'pa',
    promptText: 'ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਸਕਿੱਲਬ੍ਰਿਜ ਹੈਲਪਲਾਈਨ ਤੇ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ। ਸੁਰੱਖਿਆ ਅਤੇ ਗੁਣਵੱਤਾ ਲਈ ਇਹ ਕਾਲ ਰਿਕਾਰਡ ਕੀਤੀ ਜਾ ਸਕਦੀ ਹੈ।'
  },
  {
    nodeId: 'consent_notice',
    language: 'ur',
    promptText: 'خوش آمدید! اسکل برج ہیلپ لائن میں آپ کا خیر مقدم ہے۔ معیار اور حفاظت کے لیے یہ کال ریکارڈ کی جا سکتی ہے۔'
  },
  {
    nodeId: 'consent_notice',
    language: 'en',
    promptText: 'Welcome to SkillBridge Helpline. This call may be recorded for quality and safety purposes.'
  },

  // 2. Language Select Page 1
  {
    nodeId: 'lang_select_1',
    language: 'hi',
    promptText: 'हिंदी के लिए १ दबाएं। मराठी साठी २ दाबा। தமிழுக்கு ३ அழுத்தவும்। తెలుగు కోసం ४ నొక్కండి। ಕನ್ನಡಕ್ಕಾಗಿ ५ ಒತ್ತಿ। മലയാളത്തിനായി ६ അമർത്തുക। বাংলার জন্য ৭ টিপুন। अन्य भाषाओं के लिए ८ दबाएं।'
  },
  {
    nodeId: 'lang_select_1',
    language: 'en',
    promptText: 'For Hindi press 1. For Marathi press 2. For Tamil press 3. For Telugu press 4. For Kannada press 5. For Malayalam press 6. For Bengali press 7. For other languages press 8.'
  },

  // 3. Language Select Page 2
  {
    nodeId: 'lang_select_2',
    language: 'hi',
    promptText: 'ગુજરાતી માટે ૧ દબાવો। ଓଡ଼ିଆ ପାଇଁ ୨ ଦବାନ୍ତୁ। ਪੰਜਾਬੀ ਲਈ ੩ ਦਬਾਓ। اردو کے لیے ۴ دبائیں۔ For English press 5. वापस जाने के लिए स्टार दबाएं।'
  },
  {
    nodeId: 'lang_select_2',
    language: 'en',
    promptText: 'For Gujarati press 1. For Odia press 2. For Punjabi press 3. For Urdu press 4. For English press 5. To go back press star.'
  },

  // 4. Guest Main Menu
  {
    nodeId: 'guest_main_menu',
    language: 'hi',
    promptText: 'कारीगर रजिस्ट्रेशन और काम पाने के लिए १ दबाएं। कारीगर किराए पर लेने के लिए २ दबाएं। सहायता के लिए ९ दबाएं।'
  },
  {
    nodeId: 'guest_main_menu',
    language: 'mr',
    promptText: 'नवीन कारागीर नोंदणीसाठी १ दाबा. कारागीर कामावर ठेवण्यासाठी २ दाबा. मदतीसाठी ९ दाबा.'
  },
  {
    nodeId: 'guest_main_menu',
    language: 'ta',
    promptText: 'புதிய பணியாளர் பதிவுக்கு ۱ அழுத்தவும். ஆட்களை வேலைக்கு வைக்க ۲ அழுத்தவும். உதவிக்கு ۹ அழுத்தவும்.'
  },
  {
    nodeId: 'guest_main_menu',
    language: 'te',
    promptText: 'కొత్త కార్మికుల నమోదు కోసం ۱ నొక్కండి. పనికి మనుషులు కావాలంటే ۲ నొక్కండి. సహాయం కోసం ۹ నొక్కండి.'
  },
  {
    nodeId: 'guest_main_menu',
    language: 'kn',
    promptText: 'ಹೊಸ ಕಾರ್ಮಿಕ ನೋಂದಣಿಗಾಗಿ ۱ ಒತ್ತಿ. ಕೆಲಸಕ್ಕೆ ಆಳುಗಳನ್ನು ನೇಮಿಸಲು ۲ ಒತ್ತಿ. ಸಹಾಯಕ್ಕಾಗಿ ۹ ಒತ್ತಿ.'
  },
  {
    nodeId: 'guest_main_menu',
    language: 'ml',
    promptText: 'തൊഴിലാളി രജിസ്ട്രേഷനായി ۱ അമർത്തുക. തൊഴിലാളികളെ ലഭിക്കാൻ ۲ അമർത്തുക. സഹായത്തിനായി ۹ അമർത്തുക.'
  },
  {
    nodeId: 'guest_main_menu',
    language: 'bn',
    promptText: 'নতুন কর্মী নিবন্ধনের জন্য ۱ টিপুন। কর্মী নিয়োগের জন্য ۲ টিপুন। সহায়তার জন্য ৯ টিপুন।'
  },
  {
    nodeId: 'guest_main_menu',
    language: 'gu',
    promptText: 'કારીગર નોંધણી માટે ૧ દબાવો. કામ માટે માણસો રાખવા ૨ દબાવો. મદદ માટે ૯ દબાવો.'
  },
  {
    nodeId: 'guest_main_menu',
    language: 'or',
    promptText: 'ନୂତନ କାରିଗର ପଞ୍ଜୀକରଣ ପାଇଁ ۱ ଦବାନ୍ତୁ। କାମ ପାଇଁ ଲୋକ ନେବାକୁ ۲ ଦବାନ୍ତୁ। ସହାୟତା ପାଇଁ ۹ ଦବାନ୍ତୁ।'
  },
  {
    nodeId: 'guest_main_menu',
    language: 'pa',
    promptText: 'ਨਵੀਂ ਰਜਿਸਟ੍ਰੇਸ਼ਨ ਲਈ ۱ ਦਬਾਓ। ਕਾਰੀਗਰ ਰੱਖਣ ਲਈ ۲ ਦਬਾਓ। ਮਦਦ ਲਈ ۹ ਦਬਾਓ।'
  },
  {
    nodeId: 'guest_main_menu',
    language: 'ur',
    promptText: 'کاریگر رجسٹریشن کے لیے ۱ دبائیں۔ کاریگر ہائر کرنے کے لیے ۲ دبائیں۔ مدد کے لیے ۹ دبائیں۔'
  },
  {
    nodeId: 'guest_main_menu',
    language: 'en',
    promptText: 'Press 1 to register as a skilled worker. Press 2 to hire workers. Press 9 for live support.'
  },

  // 5. Worker Main Menu
  {
    nodeId: 'worker_main_menu',
    language: 'hi',
    promptText: 'नए काम के अलर्ट सुनने के लिए १ दबाएं। स्किल टेस्ट देकर बैज पाने के लिए २ दबाएं। अपनी कमाई और बैलेंस के लिए ३ दबाएं। उपलब्धता बदलने के लिए ४ दबाएं।'
  },
  {
    nodeId: 'worker_main_menu',
    language: 'mr',
    promptText: 'नवीन कामाचे अलर्ट ऐकण्यासाठी १ दाबा. कौशल्य परीक्षा देण्यासाठी २ दाबा. मिळकत आणि खात्यातील रक्कम तपासण्यासाठी ३ दाबा. उपलब्धता बदलण्यासाठी ४ दाबा.'
  },
  {
    nodeId: 'worker_main_menu',
    language: 'ta',
    promptText: 'புதிய வேலை வாய்ப்புகளை அறிய ۱ அழுத்தவும். திறன் தேர்வு எழுத ۲ அழுத்தவும். வருமானம் அறிய ۳ அழுத்தவும். பணி நேரம் மாற்ற ۴ அழுத்தவும்.'
  },
  {
    nodeId: 'worker_main_menu',
    language: 'te',
    promptText: 'కొత్త పని సమాచారం కోసం ۱ నొక్కండి. నైపుణ్య పరీక్ష కోసం ۲ నొక్కండి. మీ సంపాదన తెలుసుకోవడానికి ৩ నొక్కండి. లభ్యత మార్చడానికి ۴ నొక్కండి.'
  },
  {
    nodeId: 'worker_main_menu',
    language: 'kn',
    promptText: 'ಹೊಸ ಕೆಲಸದ ಮಾಹಿತಿಗಾಗಿ ۱ ಒತ್ತಿ. ಕೌಶಲ್ಯ ಪರೀಕ್ಷೆಗಾಗಿ ۲ ಒತ್ತಿ. ಗಳಿಕೆ ಮತ್ತು ಬಾಕಿ ತಿಳಿಯಲು ۳ ಒತ್ತಿ. ಲಭ್ಯತೆ ಬದಲಾಯಿಸಲು ۴ ಒತ್ತಿ.'
  },
  {
    nodeId: 'worker_main_menu',
    language: 'ml',
    promptText: 'പുതിയ ജോലികൾ അറിയാൻ ۱ അമർത്തുക. സ്കിൽ ടെസ്റ്റിനായി ۲ അമർത്തുക. വരുമാനം അറിയാൻ ۳ അമർത്തുക. ലഭ്യത മാറ്റാൻ ۴ അമർത്തുക.'
  },
  {
    nodeId: 'worker_main_menu',
    language: 'bn',
    promptText: 'নতুন কাজের খবরের জন্য ۱ টিপুন। স্কিল টেস্টের জন্য ۲ টিপুন। আয় ও ব্যালেন্স জানতে ৩ টিপুন। কাজের প্রাপ্যতা বদলাতে ৪ টিপুন।'
  },
  {
    nodeId: 'worker_main_menu',
    language: 'gu',
    promptText: 'નવા કામ માટે ૧ દબાવો. કૌશલ્ય પરીક્ષા માટે ૨ દબાવો. કમાણી અને બેલેન્સ માટે ૩ દબાવો. ઉપલબ્ધતા બદલવા ૪ દબાવો.'
  },
  {
    nodeId: 'worker_main_menu',
    language: 'or',
    promptText: 'ନୂଆ କାମ ଖବର ପାଇଁ ۱ ଦବାନ୍ତୁ। ସ୍କିଲ ଟେଷ୍ଟ ପାଇଁ ۲ ଦବାନ୍ତୁ। ରୋଜଗାର ଜାଣିବା ପାଇଁ ৩ ଦବାନ୍ତୁ। ଉପଲବ୍ଧତା ବଦଳାଇବା ପାଇଁ ۴ ଦବାନ୍ତୁ।'
  },
  {
    nodeId: 'worker_main_menu',
    language: 'pa',
    promptText: 'ਨਵੇਂ ਕੰਮ ਦੇ ਅਲਰਟ ਲਈ ۱ ਦਬਾਓ। ਸਕਿੱਲ ਟੈਸਟ ਲਈ ۲ ਦਬਾਓ। ਕਮਾਈ ਜਾਣਨ ਲਈ ۳ ਦਬਾਓ। ਉਪਲਬਧਤਾ ਬਦਲਣ ਲਈ ۴ ਦਬਾਓ।'
  },
  {
    nodeId: 'worker_main_menu',
    language: 'ur',
    promptText: 'نئے کام کے لیے ۱ دبائیں۔ اسکل ٹیسٹ کے لیے ۲ دبائیں۔ اپنی کمائی جاننے کے لیے ۳ دبائیں۔ دستیابی تبدیل کرنے کے لیے ۴ دبائیں۔'
  },
  {
    nodeId: 'worker_main_menu',
    language: 'en',
    promptText: 'Press 1 for job alerts. Press 2 for skill certification quiz. Press 3 for earnings and balance. Press 4 to update availability.'
  },

  // 6. Voice Recording Prompt
  {
    nodeId: 'voice_reg_prompt',
    language: 'hi',
    promptText: 'बीप की आवाज़ के बाद, अपना पूरा नाम, अपना हुनर जैसे इलेक्ट्रीशियन या प्लंबर, कितने साल का अनुभव है और अपना शहर बोलें। पूरा होने पर हैश (#) दबाएं।'
  },
  {
    nodeId: 'voice_reg_prompt',
    language: 'mr',
    promptText: 'बीपच्या आवाजानंतर, आपले पूर्ण नाव, आपले काम जसे की वायरमन किंवा गवंडी, अनुभवाची वर्षे आणि शहर सांगा. संपल्यावर हॅश (#) दाबा.'
  },
  {
    nodeId: 'voice_reg_prompt',
    language: 'ta',
    promptText: 'பீப் ஒலிக்கு பிறகு, உங்கள் பெயர், தொழில், அனுபவம் மற்றும் ஊரை தெளிவாக பேசுங்கள். முடிந்ததும் ஹேஷ் (#) அழுத்தவும்.'
  },
  {
    nodeId: 'voice_reg_prompt',
    language: 'te',
    promptText: 'బీప్ శబ్దం తర్వాత, మీ పేరు, పని, అనుభవం మరియు మీ నగరం పేరు చెప్పండి. పూర్తయ్యాక హ్యాష్ (#) నొక్కండి.'
  },
  {
    nodeId: 'voice_reg_prompt',
    language: 'kn',
    promptText: 'ಬೀಪ್ ಶಬ್ದದ ನಂತರ, ನಿಮ್ಮ ಹೆಸರು, ಕಸುಬು, ಅನುಭವ ಮತ್ತು ನಗರವನ್ನು ಮಾತನಾಡಿ. ಮುಗಿದ ನಂತರ ಹ್ಯಾಶ್ (#) ಒತ್ತಿ.'
  },
  {
    nodeId: 'voice_reg_prompt',
    language: 'ml',
    promptText: 'ബീപ്പിന് ശേഷം, നിങ്ങളുടെ പേര്, തൊഴിൽ, പരിചയം, സ്ഥലം എന്നിവ പറയുക. പൂർത്തിയാകുമ്പോൾ ഹാഷ് (#) അമർത്തുക.'
  },
  {
    nodeId: 'voice_reg_prompt',
    language: 'bn',
    promptText: 'বীপের পর আপনার নাম, কাজ, কাজের অভিজ্ঞতা এবং শহরের নাম বলুন। শেষ হলে হ্যাশ (#) টিপুন।'
  },
  {
    nodeId: 'voice_reg_prompt',
    language: 'gu',
    promptText: 'બીપ પછી, તમારું પૂરું નામ, તમારો વ્યવસાય, અનુભવના વર્ષો અને શહેર બોલો. પૂરું થયા પછી હેશ (#) દબાવો.'
  },
  {
    nodeId: 'voice_reg_prompt',
    language: 'or',
    promptText: 'ବୀପ୍ ପରେ, ଆପଣଙ୍କ ନାମ, କାମ, ଅଭିଜ୍ଞତା ଏବଂ ସହର କୁହନ୍ତୁ। ଶେଷ ହେଲେ ହ୍ୟାଶ୍ (#) ଦବାନ୍ତୁ।'
  },
  {
    nodeId: 'voice_reg_prompt',
    language: 'pa',
    promptText: 'ਬੀਪ ਤੋਂ ਬਾਅਦ ਆਪਣਾ ਨਾਮ, ਕੰਮ, ਤਜਰਬਾ ਅਤੇ ਸ਼ਹਿਰ ਬੋਲੋ। ਪੂਰਾ ਹੋਣ ਤੇ ਹੈਸ਼ (#) ਦਬਾਓ।'
  },
  {
    nodeId: 'voice_reg_prompt',
    language: 'ur',
    promptText: 'بیپ کی آواز کے بعد اپنا پورا نام، ہنر، تجربے کے سال اور شہر بتائیں۔ ختم کرنے کے لیے ہیش (#) دبائیں۔'
  },
  {
    nodeId: 'voice_reg_prompt',
    language: 'en',
    promptText: 'After the beep, clearly speak your full name, primary trade like electrician or plumber, years of experience, and your city. Press hash (#) when done.'
  },

  // 7. Voice Registration Confirm
  {
    nodeId: 'voice_reg_confirm',
    language: 'hi',
    promptText: 'आपकी आवाज़ दर्ज कर ली गई है। अगर यह सही है तो १ दबाएं, दोबारा रिकॉर्ड करने के लिए २ दबाएं।'
  },
  {
    nodeId: 'voice_reg_confirm',
    language: 'en',
    promptText: 'We recorded your voice profile. Press 1 if this is correct, or press 2 to record again.'
  },

  // 8. Voice Registration Success
  {
    nodeId: 'voice_reg_success',
    language: 'hi',
    promptText: 'बधाई हो! आपका प्रोफाइल बन चुका है। आपके फोन पर एसएमएस भेज दिया गया है। स्किल टेस्ट देने के लिए १ दबाएं, मुख्य मेन्यू के लिए ० दबाएं।'
  },
  {
    nodeId: 'voice_reg_success',
    language: 'en',
    promptText: 'Congratulations! Your SkillBridge profile is active. SMS confirmation sent. Press 1 to take the skill quiz now, or press 0 for main menu.'
  },

  // 9. Earnings PIN Prompt
  {
    nodeId: 'earnings_pin_prompt',
    language: 'hi',
    promptText: 'सुरक्षा के लिए अपना ४ अंकों का गुप्त पिन दर्ज करें और हैश (#) दबाएं।'
  },
  {
    nodeId: 'earnings_pin_prompt',
    language: 'mr',
    promptText: 'सुरक्षेसाठी आपला ४ अंकी गुप्त पिन प्रविष्ट करा आणि हॅश (#) दाबा.'
  },
  {
    nodeId: 'earnings_pin_prompt',
    language: 'ta',
    promptText: 'பாதுகாப்பிற்காக உங்கள் ৪ இலக்க பின்னை பதிவிட்டு ஹேஷ் (#) அழுத்தவும்.'
  },
  {
    nodeId: 'earnings_pin_prompt',
    language: 'te',
    promptText: 'భద్రత కోసం మీ ۴ అంకెల పిన్ నంబర్ నమోదు చేసి హ్యాష్ (#) నొక్కండి.'
  },
  {
    nodeId: 'earnings_pin_prompt',
    language: 'en',
    promptText: 'For security verification, enter your 4-digit voice PIN followed by hash (#).'
  },

  // 10. Earnings Summary
  {
    nodeId: 'earnings_summary',
    language: 'hi',
    promptText: 'आपके वॉलेट में उपलब्ध बैलेंस {balance} रुपये है। हालिया लेन-देन सुनने के लिए १ दबाएं। मुख्य मेन्यू के लिए ० दबाएं।'
  },
  {
    nodeId: 'earnings_summary',
    language: 'mr',
    promptText: 'आपल्या खात्यात उपलब्ध शिल्लक {balance} रुपये आहे. अलीकडील व्यवहार ऐकण्यासाठी १ दाबा. मुख्य मेन्यूसाठी ० दाबा.'
  },
  {
    nodeId: 'earnings_summary',
    language: 'en',
    promptText: 'Your current wallet balance is {balance} rupees. Press 1 to hear recent payout transactions. Press 0 for main menu.'
  },

  // 11. Availability Menu
  {
    nodeId: 'availability_menu',
    language: 'hi',
    promptText: 'काम के लिए उपलब्ध रहने के लिए १ दबाएं। काम के लिए अनुपलब्ध होने के लिए २ दबाएं। मुख्य मेन्यू के लिए ० दबाएं।'
  },
  {
    nodeId: 'availability_menu',
    language: 'mr',
    promptText: 'कामासाठी उपलब्ध राहण्यासाठी १ दाबा. सुट्टीवर राहण्यासाठी २ दाबा. मुख्य मेन्यूसाठी ० दाबा.'
  },
  {
    nodeId: 'availability_menu',
    language: 'ta',
    promptText: 'வேலைக்கு தயார் என பதிவு செய்ய ۱ அழுத்தவும். விடுப்பு எடுக்க ۲ அழுத்தவும்.'
  },
  {
    nodeId: 'availability_menu',
    language: 'te',
    promptText: 'పనికి అందుబాటులో ఉన్నారని నమోదు చేయడానికి ۱ నొక్కండి. సెలవు కోసం ۲ నొక్కండి.'
  },
  {
    nodeId: 'availability_menu',
    language: 'en',
    promptText: 'Press 1 to set status as Available for work. Press 2 to set as Unavailable. Press 0 for main menu.'
  },

  // 12. Job Alerts Menu
  {
    nodeId: 'job_alerts_menu',
    language: 'hi',
    promptText: 'आपके हुनर का नया काम उपलब्ध है: {jobDescription}। यह काम स्वीकार करने के लिए १ दबाएं, अस्वीकार करने के लिए २ दबाएं।'
  },
  {
    nodeId: 'job_alerts_menu',
    language: 'mr',
    promptText: 'आपल्यासाठी नवीन काम उपलब्ध आहे: {jobDescription}. हे काम स्वीकारण्यासाठी १ दाबा, नाकारण्यासाठी २ दाबा.'
  },
  {
    nodeId: 'job_alerts_menu',
    language: 'en',
    promptText: 'A matching job is available: {jobDescription}. Press 1 to accept this job, or press 2 to decline.'
  },

  // 13. Support / Agent Transfer & Voicemail
  {
    nodeId: 'agent_transfer',
    language: 'hi',
    promptText: 'कृपया लाइन पर बने रहें, हम आपको स्किलब्रिज सहायता विशेषज्ञ से जोड़ रहे हैं।'
  },
  {
    nodeId: 'agent_transfer',
    language: 'mr',
    promptText: 'कृपया फोन सुरू ठेवा, आम्ही आपल्याला ग्राहक सेवा प्रतिनिधीशी जोडत आहोत.'
  },
  {
    nodeId: 'agent_transfer',
    language: 'en',
    promptText: 'Please stay on the line while we transfer you to a SkillBridge support specialist.'
  },
  {
    nodeId: 'voicemail_prompt',
    language: 'hi',
    promptText: 'हमारा सहायता केंद्र अभी बंद है। सहायता का समय सुबह ९ से शाम ६ बजे तक है। कृपया बीप के बाद अपनी समस्या बोलें और हैश (#) दबाएं।'
  },
  {
    nodeId: 'voicemail_prompt',
    language: 'en',
    promptText: 'Our support desk is currently closed. Business hours are 9 AM to 6 PM Monday to Saturday. Please leave a voicemail after the beep and press hash (#).'
  },

  // 14. Goodbye
  {
    nodeId: 'call_goodbye',
    language: 'hi',
    promptText: 'स्किलब्रिज पर कॉल करने के लिए धन्यवाद। आपका दिन शुभ हो!'
  },
  {
    nodeId: 'call_goodbye',
    language: 'mr',
    promptText: 'स्किलब्रिजला कॉल केल्याबद्दल धन्यवाद. आपला दिवस चांगला जावो!'
  },
  {
    nodeId: 'call_goodbye',
    language: 'ta',
    promptText: 'ஸ்கில்பிரிட்ஜ் அழைத்தமைக்கு நன்றி. இனிய நாளாக அமையட்டும்!'
  },
  {
    nodeId: 'call_goodbye',
    language: 'te',
    promptText: 'స్కిల్‌బ్రిడ్జ్‌కు కాల్ చేసినందుకు ధన్యవాదాలు. శుభదినం!'
  },
  {
    nodeId: 'call_goodbye',
    language: 'en',
    promptText: 'Thank you for calling SkillBridge India. Have a wonderful day!'
  }
];
