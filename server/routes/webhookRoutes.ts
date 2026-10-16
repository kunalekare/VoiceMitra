import { Router, Request, Response } from 'express';
import { sendSuccess } from '../utils/response';
import { db } from '../config/database';
import { logAuditEvent } from '../middleware/logger';

export const webhookRouter = Router();

// Supported WhatsApp Languages
const WA_LANGUAGES: Record<string, { name: string; welcome: string; menu: string }> = {
  hi: {
    name: 'हिंदी',
    welcome: '🙏 नमस्ते! स्किलब्रिज (SkillBridge) आधिकारिक व्हाट्सएप सेवा में आपका स्वागत है।\n\nयहाँ आप सिर्फ मैसेज या 🎤 वॉइस नोट भेजकर काम पा सकते हैं, कमाई चेक कर सकते हैं और स्किल क्विज दे सकते हैं।',
    menu: '📌 कृपया एक विकल्प चुनें:\n1️⃣ 💼 नए जॉब्स देखें\n2️⃣ 💰 कमाई & वॉलेट बैलेंस\n3️⃣ 📝 स्किल वेरिफिकेशन क्विज\n4️⃣ 🆔 मेरा वर्कर डिजिटल कार्ड\n5️⃣ 🟢 काम के लिए उपलब्धता बदलें\n6️⃣ 🔒 आधार KYC सत्यापन\n7️⃣ 📞 सुपरवाइजर सहायता'
  },
  en: {
    name: 'English',
    welcome: '🙏 Welcome to SkillBridge Official WhatsApp Bot!\n\nYou can find jobs, check your escrow earnings, take skill certification quizzes, and verify your profile with voice or text.',
    menu: '📌 Please select an option:\n1️⃣ 💼 View Matching Jobs\n2️⃣ 💰 Earnings & Escrow Balance\n3️⃣ 📝 Skill Verification Quiz\n4️⃣ 🆔 My Worker ID Card\n5️⃣ 🟢 Toggle Availability\n6️⃣ 🔒 Aadhaar KYC Verification\n7️⃣ 📞 Agent Support'
  },
  mr: {
    name: 'मराठी',
    welcome: '🙏 नमस्कार! स्किलब्रिज अधिकृत व्हॉट्सॲप सेवेत आपले स्वागत आहे.\n\nयेथे आपण व्हॉइस नोट किंवा मेसेज पाठवून काम मिळवू शकता, कमाई तपासू शकता आणि कौशल्य चाचणी देऊ शकता.',
    menu: '📌 कृपया एक पर्याय निवडा:\n1️⃣ 💼 नवीन कामे पहा\n2️⃣ 💰 कमाई आणि वॉलेट शिल्लक\n3️⃣ 📝 कौशल्य पडताळणी क्विझ\n4️⃣ 🆔 माझे डिजिटल ओळखपत्र\n5️⃣ 🟢 कामासाठी उपलब्धता बदला\n6️⃣ 🔒 आधार पडताळणी\n7️⃣ 📞 मदत आणि संपर्क'
  },
  ta: {
    name: 'தமிழ்',
    welcome: '🙏 வணக்கம்! ஸ்கில்பிரிட்ஜ் அதிகாரப்பூர்வ வாட்ஸ்அப் சேவையில் உங்களை வரவேற்கிறோம்.',
    menu: '📌 விருப்பத்தைத் தேர்ந்தெடுக்கவும்:\n1️⃣ 💼 புதிய வேலைகள்\n2️⃣ 💰 வருமானம் மற்றும் இருப்பு\n3️⃣ 📝 திறன் வினாடி வினா\n4️⃣ 🆔 தொழிலாளர் அட்டை\n5️⃣ 🟢 கிடைக்கும் நிலை\n6️⃣ 🔒 ஆதார் சரிபார்ப்பு\n7️⃣ 📞 உதவி'
  },
  te: {
    name: 'తెలుగు',
    welcome: '🙏 నమస్కారం! స్కిల్‌బ్రిడ్జ్ అధికారిక వాట్సాప్ సేవకు స్వాగతం.',
    menu: '📌 దయచేసి ఎంచుకోండి:\n1️⃣ 💼 కొత్త ఉద్యోగాలు\n2️⃣ 💰 సంపాదన & బ్యాలెన్స్\n3️⃣ 📝 స్కిల్ క్విజ్\n4️⃣ 🆔 వర్కర్ ఐడీ కార్డు\n5️⃣ 🟢 లభ్యతను మార్చండి\n6️⃣ 🔒 ఆధార్ ధృవీకరణ\n7️⃣ 📞 సహాయం'
  },
  kn: {
    name: 'ಕನ್ನಡ',
    welcome: '🙏 ನಮಸ್ಕಾರ! ಸ್ಕಿಲ್‌ಬ್ರಿಡ್ಜ್ ಅಧಿಕೃತ ವಾಟ್ಸಾಪ್ ಸೇವೆಗೆ ಸ್ವಾಗತ.',
    menu: '📌 ಆಯ್ಕೆಯನ್ನು ಆರಿಸಿ:\n1️⃣ 💼 ಹೊಸ ಕೆಲಸಗಳು\n2️⃣ 💰 ಗಳಿಕೆ ಮತ್ತು ಬ್ಯಾಲೆನ್ಸ್\n3️⃣ 📝 ಕೌಶಲ್ಯ ಪರೀಕ್ಷೆ\n4️⃣ 🆔 ಕಾರ್ಮಿಕ ಐಡಿ ಕಾರ್ಡ್\n5️⃣ 🟢 ಲಭ್ಯತೆ ಬದಲಾಯಿಸಿ\n6️⃣ 🔒 ಆಧಾರ್ ಪರಿಶೀಲನೆ\n7️⃣ 📞 ಸಹಾಯ'
  },
  bn: {
    name: 'বাংলা',
    welcome: '🙏 নমস্কার! স্কিলব্রিজ অফিসিয়াল হোয়াটসঅ্যাপ সেবায় স্বাগতম।',
    menu: '📌 একটি বিকল্প নির্বাচন করুন:\n1️⃣ 💼 নতুন কাজ দেখুন\n2️⃣ 💰 উপার্জন ও ওয়ালেট ব্যালেন্স\n3️⃣ 📝 দক্ষতা যাচাই কুইজ\n4️⃣ 🆔 কর্মী ডিজিটাল কার্ড\n5️⃣ 🟢 প্রাপ্যতা পরিবর্তন করুন\n6️⃣ 🔒 আধার যাচাই\n7️⃣ 📞 সহায়তা'
  },
  gu: {
    name: 'ગુજરાતી',
    welcome: '🙏 નમસ્તે! સ્કિલબ્રિજ સત્તાવાર વ્હોટ્સએપ સેવામાં આપનું સ્વાગત છે.',
    menu: '📌 વિકલ્પ પસંદ કરો:\n1️⃣ 💼 નવી નોકરીઓ\n2️⃣ 💰 કમાણી અને બેલેન્સ\n3️⃣ 📝 કૌશલ્ય ક્વિઝ\n4️⃣ 🆔 વર્કર ઓળખપત્ર\n5️⃣ 🟢 ઉપલબ્ધતા બદલો\n6️⃣ 🔒 આધાર ચકાસણી\n7️⃣ 📞 સહાય'
  },
  pa: {
    name: 'ਪੰਜਾਬੀ',
    welcome: '🙏 ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਸਕਿੱਲਬ੍ਰਿਜ ਵਟਸਐਪ ਸੇਵਾ ਵਿੱਚ ਜੀ ਆਇਆਂ ਨੂੰ।',
    menu: '📌 ਕਿਰਪਾ ਕਰਕੇ ਚੁਣੋ:\n1️⃣ 💼 ਨਵੀਆਂ ਨੌਕਰੀਆਂ\n2️⃣ 💰 ਕਮਾਈ ਅਤੇ ਬੈਲੇਂਸ\n3️⃣ 📝 ਹੁਨਰ ਟੈਸਟ\n4️⃣ 🆔 ਵਰਕਰ ਆਈਡੀ ਕਾਰਡ\n5️⃣ 🟢 ਉਪਲਬਧਤਾ ਬਦਲੋ\n6️⃣ 🔒 ਆਧਾਰ ਤਸਦੀਕ\n7️⃣ 📞 ਸਹਾਇਤਾ'
  },
  ur: {
    name: 'اردو',
    welcome: '🙏 خوش آمدید! اسکل برج آفیشل واٹس ایپ سروس میں آپ کا خیرمقدم ہے۔',
    menu: '📌 براہ کرم ایک آپشن منتخب کریں:\n1️⃣ 💼 نئی ملازمتیں\n2️⃣ 💰 کمائی اور بیلنس\n3️⃣ 📝 مہارت کوئز\n4️⃣ 🆔 ورکر شناختی کارڈ\n5️⃣ 🟢 دستیابی تبدیل کریں\n6️⃣ 🔒 آدھار تصدیق\n7️⃣ 📞 مدد'
  }
};

// WhatsApp Bot Simulator Inbound Webhook
webhookRouter.post('/whatsapp', async (req: Request, res: Response) => {
  const { from, message = '', actionPayload, audioBase64, isVoice, language: reqLang } = req.body;
  const phone = (from || '+919822011201').trim();
  const rawText = (message || actionPayload || '').trim();
  const lowerText = rawText.toLowerCase();

  // 1. Fetch or initialize session from whatsapp_sessions table
  let session = db.queryOne<{ phone: string; state: string; language: string; worker_id: string | null; session_data: string }>(
    'SELECT * FROM whatsapp_sessions WHERE phone = ?;',
    [phone]
  );

  let lang = reqLang || session?.language || 'hi';
  if (!WA_LANGUAGES[lang]) lang = 'hi';

  let state = session?.state || 'MAIN_MENU';
  let sessionData: Record<string, any> = {};
  try {
    if (session?.session_data) sessionData = JSON.parse(session.session_data);
  } catch {
    sessionData = {};
  }

  // 2. Fetch existing worker record if registered
  let worker = db.queryOne<{
    id: string;
    name: string;
    primary_skill: string;
    experience_years: number;
    district: string;
    reputation_score: number;
    total_jobs: number;
    is_available: number;
    aadhaar_verified: number;
    aadhaar_masked: string | null;
    verified_skill_badges: string;
    wallet_balance_paise: number;
  }>('SELECT * FROM workers WHERE phone = ?;', [phone]);

  let botResponse = '';
  let buttons: Array<{ label: string; payload: string }> = [];
  let mediaCard: any = null;
  let nextState = state;

  // Global command overrides
  if (lowerText === '/reset' || lowerText === 'reset' || actionPayload === 'RESET') {
    state = 'MAIN_MENU';
    nextState = 'MAIN_MENU';
    sessionData = {};
    botResponse = (WA_LANGUAGES[lang] || WA_LANGUAGES.hi).welcome + '\n\n' + (WA_LANGUAGES[lang] || WA_LANGUAGES.hi).menu;
    buttons = [
      { label: '💼 नए काम', payload: 'MENU_JOBS' },
      { label: '💰 कमाई', payload: 'MENU_EARNINGS' },
      { label: '📝 क्विज', payload: 'MENU_QUIZ' },
      { label: '🌐 भाषा', payload: 'MENU_LANG' }
    ];
  } else if (lowerText === '/lang' || actionPayload === 'MENU_LANG' || lowerText === 'भाषा') {
    nextState = 'LANG_SELECT';
    botResponse = '🌐 कृपया अपनी पसंदीदा भाषा चुनें / Please choose your language:';
    buttons = [
      { label: 'हिंदी', payload: 'SET_LANG_hi' },
      { label: 'English', payload: 'SET_LANG_en' },
      { label: 'मराठी', payload: 'SET_LANG_mr' },
      { label: 'தமிழ்', payload: 'SET_LANG_ta' },
      { label: 'తెలుగు', payload: 'SET_LANG_te' },
      { label: 'ಕನ್ನಡ', payload: 'SET_LANG_kn' }
    ];
  } else if (lowerText.startsWith('set_lang_') || actionPayload?.startsWith('SET_LANG_')) {
    const chosen = (actionPayload || lowerText).replace('set_lang_', '').replace('SET_LANG_', '').toLowerCase();
    if (WA_LANGUAGES[chosen]) {
      lang = chosen;
      nextState = 'MAIN_MENU';
      botResponse = `✅ भाषा बदलकर ${WA_LANGUAGES[chosen].name} कर दी गई है।\n\n` + (WA_LANGUAGES[chosen] || WA_LANGUAGES.hi).menu;
      buttons = [
        { label: '💼 काम देखें', payload: 'MENU_JOBS' },
        { label: '💰 कमाई', payload: 'MENU_EARNINGS' },
        { label: '📝 क्विज', payload: 'MENU_QUIZ' },
        { label: '🆔 वर्कर कार्ड', payload: 'MENU_CARD' }
      ];
    }
  } else if (actionPayload === 'MENU_JOBS' || lowerText === '1' || lowerText.includes('काम') || lowerText.includes('job')) {
    // 1. MATCHING JOBS
    nextState = 'JOB_OFFER';
    const skill = worker?.primary_skill || 'Electrician';
    const jobs = db.query<{
      id: string;
      title: string;
      category: string;
      location_district: string;
      budget_inr: number;
      duration_days: number;
      status: string;
      employer_id: string;
    }>('SELECT * FROM jobs WHERE status = "open" ORDER BY created_at DESC LIMIT 2;');

    if (jobs && jobs.length > 0) {
      const j = jobs[0];
      sessionData.activeJobId = j.id;
      botResponse = `🔔 *नया काम उपलब्ध है!*\n\n📌 *काम:* ${j.title}\n📍 *स्थान:* ${j.location_district}\n💰 *मजदूरी:* ₹${j.budget_inr} (${j.duration_days} दिन)\n🛡️ *एस्क्रो गारंटी:* राशि सुरक्षित बैंक खाते में जमा है।\n\nक्या आप यह काम स्वीकार करना चाहते हैं?`;
      buttons = [
        { label: '✅ स्वीकार करें (Accept)', payload: `JOB_ACCEPT_${j.id}` },
        { label: '❌ मना करें (Decline)', payload: `JOB_DECLINE_${j.id}` },
        { label: '⬅️ मुख्य मेनू', payload: 'RESET' }
      ];
      mediaCard = {
        type: 'job_card',
        jobId: j.id,
        title: j.title,
        district: j.location_district,
        budget: j.budget_inr,
        duration: j.duration_days
      };
    } else {
      botResponse = 'ℹ️ आपके इलाके में अभी सभी काम बुक हैं। नया काम पोस्ट होते ही हम आपको तुरंत व्हाट्सएप पर संदेश भेजेंगे!';
      buttons = [
        { label: '💰 कमाई चेक करें', payload: 'MENU_EARNINGS' },
        { label: '📝 क्विज दें', payload: 'MENU_QUIZ' }
      ];
    }
  } else if (lowerText.startsWith('job_accept_') || actionPayload?.startsWith('JOB_ACCEPT_')) {
    const jobId = (actionPayload || rawText).replace('job_accept_', '').replace('JOB_ACCEPT_', '').trim();
    // Update real job in DB
    try {
      db.run('UPDATE jobs SET status = "assigned", worker_id = ? WHERE id = ?;', [worker?.id || 'w-ngp-01', jobId]);
      logAuditEvent(phone, 'worker', 'WHATSAPP_JOB_ACCEPTED', 'job', jobId, undefined, { phone });
    } catch {}

    nextState = 'JOB_ACCEPTED';
    botResponse = `🎉 *बधाई हो! काम सफलतापूर्वक बुक हो गया है!*\n\n📋 *जॉब आईडी:* ${jobId}\n👤 *ठेकेदार:* राजेश शाह (+91 98221 00001)\n📍 *पता:* प्लॉट नं 42, धरमपेठ एक्सटेंशन, नागपुर\n⏰ *समय:* कल सुबह 9:00 बजे\n\nकाम पूरा होने पर *'काम पूरा हुआ'* बटन दबाएं और अपनी स्टार रेटिंग प्राप्त करें।`;
    buttons = [
      { label: '⭐ काम पूरा हुआ (रिव्यू दें)', payload: `JOB_COMPLETE_${jobId}` },
      { label: '📍 लोकेशन मैप', payload: 'JOB_MAP' },
      { label: '⬅️ मुख्य मेनू', payload: 'RESET' }
    ];
  } else if (lowerText.startsWith('job_decline_') || actionPayload?.startsWith('JOB_DECLINE_')) {
    nextState = 'MAIN_MENU';
    botResponse = '👌 ठीक है, हमने आपका अस्वीकरण दर्ज कर लिया है। आपकी रेटिंग पर कोई असर नहीं पड़ेगा। हम दूसरा काम भेजेंगे।';
    buttons = [
      { label: '💼 अन्य काम', payload: 'MENU_JOBS' },
      { label: '⬅️ मुख्य मेनू', payload: 'RESET' }
    ];
  } else if (lowerText.startsWith('job_complete_') || actionPayload?.startsWith('JOB_COMPLETE_')) {
    const jobId = (actionPayload || rawText).replace('job_complete_', '').replace('JOB_COMPLETE_', '').trim();
    try {
      db.run('UPDATE jobs SET status = "completed" WHERE id = ?;', [jobId]);
      if (worker?.id) {
        db.run('UPDATE workers SET total_jobs = total_jobs + 1, reputation_score = MIN(5.0, reputation_score + 0.1) WHERE id = ?;', [worker.id]);
      }
    } catch {}
    nextState = 'REVIEW_SUBMIT';
    botResponse = `⭐ *शानदार काम! काम पूरा होने की पुष्टि हो गई है।*\n\nकृपया नियोक्ता के लिए अपना 1 से 5 स्टार रेटिंग दें या 🎤 वॉइस नोट भेजकर अपना अनुभव बताएं:`;
    buttons = [
      { label: '⭐⭐⭐⭐⭐ 5 Star', payload: 'RATE_5' },
      { label: '⭐⭐⭐⭐ 4 Star', payload: 'RATE_4' },
      { label: '🎤 वॉइस रिव्यू भेजें', payload: 'RATE_VOICE' }
    ];
  } else if (actionPayload?.startsWith('RATE_') || lowerText.startsWith('rate_')) {
    nextState = 'MAIN_MENU';
    botResponse = `🌟 *धन्यवाद! आपका रिव्यू दर्ज कर लिया गया है।*\n\nराशि ₹850 आपके स्किलब्रिज वॉलेट में ट्रांसफर कर दी गई है। सुरक्षित बैंक ट्रांसफर के लिए '💰 कमाई' बटन दबाएं।`;
    buttons = [
      { label: '💰 कमाई बैलेंस', payload: 'MENU_EARNINGS' },
      { label: '💼 नए काम देखें', payload: 'MENU_JOBS' }
    ];
  } else if (actionPayload === 'MENU_EARNINGS' || lowerText === '2' || lowerText.includes('कमाई') || lowerText.includes('balance') || lowerText.includes('wallet')) {
    // 2. EARNINGS & ESCROW BALANCE
    nextState = 'MAIN_MENU';
    const balancePaise = worker?.wallet_balance_paise || 425000;
    const balanceRupees = Math.round(balancePaise / 100);
    const completedJobs = worker?.total_jobs || 14;

    botResponse = `💰 *स्किलब्रिज एस्क्रो वॉलेट विवरण*\n\n📱 *खाता धारक:* ${worker?.name || 'राजेश कुमार'}\n💳 *उपलब्ध बैलेंस:* ₹${balanceRupees.toLocaleString('en-IN')}\n🔒 *एस्क्रो में सुरक्षित:* ₹850 (अगला काम)\n🏆 *कुल पूरे किए गए काम:* ${completedJobs}\n🏦 *लिंक्ड UPI:* ${phone.replace(/[^0-9]/g, '').slice(-10)}@upi\n\nआप किसी भी समय अपने बैंक खाते में तत्काल निकासी कर सकते हैं।`;
    buttons = [
      { label: '⚡ तत्काल UPI निकासी', payload: 'PAYOUT_REQUEST' },
      { label: '📜 पिछले 3 लेनदेन', payload: 'TXN_HISTORY' },
      { label: '⬅️ मुख्य मेनू', payload: 'RESET' }
    ];
    mediaCard = {
      type: 'wallet_card',
      balance: balanceRupees,
      escrowLocked: 850,
      totalJobs: completedJobs
    };
  } else if (actionPayload === 'PAYOUT_REQUEST' || lowerText.includes('निकासी') || lowerText.includes('payout')) {
    nextState = 'MAIN_MENU';
    botResponse = `✅ *तत्काल UPI भुगतान अनुरोध सफल!*\n\n₹1,500 की राशि आपके लिंक्ड बैंक खाते (NPCI IMPS) में भेज दी गई है।\n\nUTR नंबर: *SB${Date.now().toString().slice(-8)}*\nबैंक SMS जल्द ही प्राप्त होगा।`;
    buttons = [
      { label: '💰 बैलेंस देखें', payload: 'MENU_EARNINGS' },
      { label: '⬅️ मुख्य मेनू', payload: 'RESET' }
    ];
  } else if (actionPayload === 'TXN_HISTORY') {
    nextState = 'MAIN_MENU';
    botResponse = `📜 *हाल के लेनदेन (Last 3 Transactions):*\n\n1️⃣ +₹850 (धरमपेठ वायरिंग जॉब) - आज 11:30 AM [सफल]\n2️⃣ +₹1,200 (मानेवाड़ा रिपेयर) - 2 दिन पहले [सफल]\n3️⃣ -₹1,500 (UPI ट्रांसफर) - 4 दिन पहले [खाते में जमा]`;
    buttons = [
      { label: '💰 वापस वॉलेट', payload: 'MENU_EARNINGS' },
      { label: '⬅️ मुख्य मेनू', payload: 'RESET' }
    ];
  } else if (actionPayload === 'MENU_QUIZ' || lowerText === '3' || lowerText.includes('क्विज') || lowerText.includes('quiz')) {
    // 3. SKILL QUIZ
    sessionData.quizIndex = 0;
    sessionData.quizScore = 0;
    sessionData.quizTrade = worker?.primary_skill?.toLowerCase() || 'electrician';
    nextState = 'QUIZ_IN_PROGRESS';

    const questions = [
      {
        q: 'भारतीय घरेलू वायरिंग में अर्थिंग (ग्राउंड) तार का मानक रंग क्या होता है?',
        options: ['1. हरा या हरा-पीला', '2. लाल', '3. काला', '4. नीला'],
        correct: 1
      },
      {
        q: 'पावर सॉकेट (AC/गीजर) के लिए मानक MCB रेटिंग क्या होती है?',
        options: ['1. 16A या 20A', '2. 6A', '3. 32A', '4. 63A'],
        correct: 1
      },
      {
        q: 'तांबे को छुए बिना वोल्टेज की सुरक्षित जांच किस यंत्र से की जाती है?',
        options: ['1. नियॉन फेज टेस्टर', '2. साधारण प्लास', '3. हथौड़ी', '4. लोहे की कील'],
        correct: 1
      }
    ];
    sessionData.quizQuestions = questions;

    botResponse = `📝 *कारीगर कौशल प्रमाणन परीक्षा (प्रश्न 1/3)*\n\n❓ *${questions[0].q}*\n\n${questions[0].options.join('\n')}\n\nकृपया सही विकल्प चुनें:`;
    buttons = [
      { label: 'विकल्प 1', payload: 'QUIZ_ANS_1' },
      { label: 'विकल्प 2', payload: 'QUIZ_ANS_2' },
      { label: 'विकल्प 3', payload: 'QUIZ_ANS_3' },
      { label: 'विकल्प 4', payload: 'QUIZ_ANS_4' }
    ];
  } else if (state === 'QUIZ_IN_PROGRESS' && (actionPayload?.startsWith('QUIZ_ANS_') || ['1', '2', '3', '4'].includes(lowerText))) {
    const selected = actionPayload ? parseInt(actionPayload.replace('QUIZ_ANS_', ''), 10) : parseInt(lowerText, 10);
    const qIndex = sessionData.quizIndex || 0;
    const questions = sessionData.quizQuestions || [];

    if (questions[qIndex] && selected === questions[qIndex].correct) {
      sessionData.quizScore = (sessionData.quizScore || 0) + 1;
    }

    const nextQIndex = qIndex + 1;
    if (nextQIndex < questions.length) {
      sessionData.quizIndex = nextQIndex;
      const q = questions[nextQIndex];
      botResponse = `📝 *प्रश्न (${nextQIndex + 1}/${questions.length})*\n\n❓ *${q.q}*\n\n${q.options.join('\n')}\n\nकृपया सही विकल्प चुनें:`;
      buttons = [
        { label: 'विकल्प 1', payload: 'QUIZ_ANS_1' },
        { label: 'विकल्प 2', payload: 'QUIZ_ANS_2' },
        { label: 'विकल्प 3', payload: 'QUIZ_ANS_3' },
        { label: 'विकल्प 4', payload: 'QUIZ_ANS_4' }
      ];
    } else {
      // Quiz complete
      nextState = 'MAIN_MENU';
      const finalScore = sessionData.quizScore || 0;
      const totalQ = questions.length;
      const passed = finalScore >= 2;

      if (passed && worker?.id) {
        try {
          db.run("UPDATE workers SET verified_skill_badges = '[\"Certified Pro\", \"IS-732 Compliant\"]' WHERE id = ?;", [worker.id]);
        } catch {}
      }

      botResponse = passed
        ? `🏆 *बधाई हो! आपने क्विज पास कर ली!*\n\nअंक: ${finalScore}/${totalQ} (उत्कृष्ट)\nबैज: *'Certified Pro'* बैज आपके प्रोफाइल से जुड़ गया है!\n\nअब आपकी प्रोफाइल नियोक्ताओं को 3 गुना अधिक प्राथमिकता के साथ दिखाई जाएगी।`
        : `👍 आपने प्रयास किया: अंक ${finalScore}/${totalQ}। आप 24 घंटे बाद फिर से टेस्ट दे सकते हैं।`;

      buttons = [
        { label: '🆔 मेरा डिजिटल कार्ड देखें', payload: 'MENU_CARD' },
        { label: '💼 नए काम देखें', payload: 'MENU_JOBS' },
        { label: '⬅️ मुख्य मेनू', payload: 'RESET' }
      ];
    }
  } else if (actionPayload === 'MENU_CARD' || lowerText === '4' || lowerText.includes('कार्ड') || lowerText.includes('card') || lowerText.includes('profile')) {
    // 4. WORKER DIGITAL ID CARD
    nextState = 'MAIN_MENU';
    botResponse = `🆔 *स्किलब्रिज प्रमाणित कारीगर कार्ड*\n\n👤 *नाम:* ${worker?.name || 'राजेश कुमार'}\n⚡ *काम:* ${worker?.primary_skill || 'इलेक्ट्रीशियन'}\n⏱️ *अनुभव:* ${worker?.experience_years || 8} वर्ष\n📍 *जिला:* ${worker?.district || 'नागपुर'}\n⭐ *रेटिंग:* ${worker?.reputation_score || 4.9} / 5.0 (14 काम)\n🛡️ *आधार सत्यापन:* ${worker?.aadhaar_verified ? 'सत्यापित (Verified Pro ✓)' : 'लंबित'}\n🟢 *उपलब्धता:* ${worker?.is_available ? 'उपलब्ध (Available)' : 'व्यस्त (Busy)'}`;
    buttons = [
      { label: '💼 काम देखें', payload: 'MENU_JOBS' },
      { label: '🟢 उपलब्धता बदलें', payload: 'MENU_STATUS' },
      { label: '⬅️ मुख्य मेनू', payload: 'RESET' }
    ];
    mediaCard = {
      type: 'worker_card',
      name: worker?.name || 'राजेश कुमार',
      skill: worker?.primary_skill || 'इलेक्ट्रीशियन',
      rating: worker?.reputation_score || 4.9,
      phone: phone,
      district: worker?.district || 'नागपुर',
      isVerified: Boolean(worker?.aadhaar_verified)
    };
  } else if (actionPayload === 'MENU_STATUS' || lowerText === '5' || lowerText.includes('उपलब्धता') || lowerText.includes('availability')) {
    // 5. TOGGLE AVAILABILITY
    nextState = 'MAIN_MENU';
    const currentAvail = worker?.is_available === 1;
    const newAvail = currentAvail ? 0 : 1;
    if (worker?.id) {
      try {
        db.run('UPDATE workers SET is_available = ? WHERE id = ?;', [newAvail, worker.id]);
      } catch {}
    }
    botResponse = newAvail === 1
      ? '🟢 *आपकी उपलब्धता सक्रिय (ON) कर दी गई है!*\n\nठेकेदार और ग्राहक आपको नए काम के लिए सीधे संपर्क कर सकेंगे।'
      : '🔴 *आपकी स्थिति व्यस्त (OFF) कर दी गई है!*\n\nजब तक आप फिर से उपलब्ध नहीं होते, आपको नए जॉब अलर्ट नहीं मिलेंगे।';
    buttons = [
      { label: newAvail === 1 ? '🔴 व्यस्त मार्क करें' : '🟢 उपलब्ध मार्क करें', payload: 'MENU_STATUS' },
      { label: '⬅️ मुख्य मेनू', payload: 'RESET' }
    ];
  } else if (actionPayload === 'MENU_KYC' || lowerText === '6' || lowerText.includes('आधार') || lowerText.includes('kyc')) {
    // 6. AADHAAR KYC
    nextState = 'KYC_OTP_INPUT';
    botResponse = '🔒 *UIDAI आधार e-KYC सत्यापन*\n\nUIDAI सर्वर द्वारा आपके पंजीकृत मोबाइल नंबर पर 6 अंकों का OTP भेजा गया है (सुरक्षा हेतु सिमुलेशन OTP: *789012*)।\n\nकृपया 6 अंकों का OTP दर्ज करें:';
    buttons = [
      { label: 'OTP: 789012 दर्ज करें', payload: 'KYC_OTP_789012' },
      { label: 'रद्द करें', payload: 'RESET' }
    ];
  } else if (state === 'KYC_OTP_INPUT' || actionPayload === 'KYC_OTP_789012' || lowerText.includes('789012')) {
    nextState = 'MAIN_MENU';
    if (worker?.id) {
      try {
        db.run('UPDATE workers SET aadhaar_verified = 1, aadhaar_masked = "XXXX-XXXX-8921" WHERE id = ?;', [worker.id]);
      } catch {}
    }
    botResponse = `🎉 *आधार e-KYC सत्यापन सफल!*\n\nआधार संख्या: *XXXX-XXXX-8921*\nनाम: *${worker?.name || 'राजेश कुमार'}*\nसत्यापन तिथि: ${new Date().toLocaleDateString('hi-IN')}\n\nआपके खाते पर 🛡️ *'Verified Pro'* बैज जोड़ दिया गया है!`;
    buttons = [
      { label: '🆔 मेरा वर्कर कार्ड देखें', payload: 'MENU_CARD' },
      { label: '💼 नए काम देखें', payload: 'MENU_JOBS' },
      { label: '⬅️ मुख्य मेनू', payload: 'RESET' }
    ];
  } else if (actionPayload === 'MENU_SUPPORT' || lowerText === '7' || lowerText.includes('सहायता') || lowerText.includes('support') || lowerText.includes('help')) {
    // 7. SUPPORT / GRIEVANCE
    nextState = 'MAIN_MENU';
    const ticketId = `TCK-${Date.now().toString().slice(-6)}`;
    try {
      db.run('INSERT INTO ivr_support_tickets (id, call_id, caller_number, language, transcript, status) VALUES (?, ?, ?, ?, ?, ?);', [
        ticketId,
        `wa_${Date.now()}`,
        phone,
        lang,
        'Support request via WhatsApp Bot',
        'open'
      ]);
    } catch {}
    botResponse = `📞 *स्किलब्रिज सहायता केंद्र*\n\nटिकट आईडी: *#${ticketId}*\n\nहमारी सपोर्ट टीम सुबह 9:00 से शाम 7:00 बजे के बीच सक्रिय है। आपका टिकट दर्ज हो गया है और एक प्रतिनिधि आपसे इसी नंबर पर 15 मिनट के भीतर संपर्क करेगा।\n\nआपातकालीन टोल-फ्री नंबर: *1800-889-2026*`;
    buttons = [
      { label: '💼 काम देखें', payload: 'MENU_JOBS' },
      { label: '⬅️ मुख्य मेनू', payload: 'RESET' }
    ];
  } else if (isVoice || lowerText.includes('voice') || lowerText.length > 20) {
    // Natural voice or text registration/profile update
    nextState = 'MAIN_MENU';
    botResponse = `✅ *आपकी आवाज़ और विवरण दर्ज कर लिए गए हैं!*\n\n👤 *नाम:* राजेश कुमार\n⚡ *काम:* इलेक्ट्रीशियन (Electrician)\n⏱️ *अनुभव:* 8 वर्ष\n📍 *शहर:* नागपुर\n\nआपकी प्रोफाइल लाइव है! नीचे दिए गए विकल्पों से नया काम देखें या कमाई चेक करें।`;
    buttons = [
      { label: '💼 काम देखें', payload: 'MENU_JOBS' },
      { label: '💰 कमाई', payload: 'MENU_EARNINGS' },
      { label: '📝 क्विज', payload: 'MENU_QUIZ' }
    ];
  } else {
    // Default fallback to Main Menu
    nextState = 'MAIN_MENU';
    botResponse = (WA_LANGUAGES[lang] || WA_LANGUAGES.hi).welcome + '\n\n' + (WA_LANGUAGES[lang] || WA_LANGUAGES.hi).menu;
    buttons = [
      { label: '💼 काम देखें', payload: 'MENU_JOBS' },
      { label: '💰 कमाई', payload: 'MENU_EARNINGS' },
      { label: '📝 क्विज', payload: 'MENU_QUIZ' },
      { label: '🆔 वर्कर कार्ड', payload: 'MENU_CARD' }
    ];
  }

  // 3. Upsert session in database
  try {
    db.run(
      `INSERT INTO whatsapp_sessions (phone, state, language, worker_id, session_data, updated_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(phone) DO UPDATE SET
         state = excluded.state,
         language = excluded.language,
         session_data = excluded.session_data,
         updated_at = datetime('now');`,
      [phone, nextState, lang, worker?.id || null, JSON.stringify(sessionData)]
    );
  } catch (err) {
    console.warn('Could not save whatsapp session in DB:', err);
  }

  logAuditEvent(phone, 'worker', 'WHATSAPP_WEBHOOK_MESSAGE', 'webhook', phone, undefined, {
    state,
    nextState,
    inputSnippet: rawText.slice(0, 50),
    language: lang
  });

  return sendSuccess(req, res, {
    from: phone,
    reply: botResponse,
    buttons,
    mediaCard,
    nextState,
    language: lang,
    timestamp: new Date().toISOString()
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
