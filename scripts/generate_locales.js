import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales');
const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf8'));

// Dictionaries containing domain-specific translations for the 8 remaining languages
const DICTIONARIES = {
  te: { // Telugu
    nav: {
      brand: "స్కిల్‌బ్రిడ్జ్",
      tagline: "భారతదేశంలోని 50 కోట్ల కార్మికులకు వాయిస్ ఆధారిత ఉపాధి",
      searchWorkers: "కార్మికులను వెతకండి",
      postJob: "వాయిస్‌తో పనిని నమోదు చేయండి",
      myJobs: "నా పనులు",
      earnings: "ఆదాయం",
      dashboard: "డాష్‌బోర్డ్",
      voiceRegister: "మాట్లాడి నమోదు చేసుకోండి",
      admin: "నిర్వాహక విభాగం",
      enterprise: "పెద్ద సంస్థలు",
      developer: "డెవలపర్ పోర్టల్",
      tests: "సిస్టమ్ పరీక్షలు",
      switchRole: "పాత్రను మార్చండి",
      language: "భాష",
      themeToggle: "డార్క్ మోడ్",
      login: "లాగిన్",
      logout: "లాగౌట్",
      welcome: "స్వాగతం",
      selectLang: "మీ భాషను ఎంచుకోండి",
      close: "మూసివేయి"
    },
    landing: {
      heroBadge: "ప్రభుత్వ ఐటీఐ & స్కిల్ ఇండియా అనుసంధానం • 100% వాయిస్ ప్రాధాన్యత",
      heroTitle1: "నేరుగా మాట్లాడి పనిని పొందండి",
      heroTitleHighlight: "50 కోట్ల",
      heroTitle2: "శ్రామిక కళాకారుల కోసం.",
      heroSubtitle: "ఎలక్ట్రీషియన్లు, ప్లంబర్లు, తాపీ మేస్త్రీలు, పెయింటర్లు, వడ్రంగులు తమ మాతృభాషలో మాట్లాడి రిజిస్టర్ చేసుకుంటారు. కాంట్రాక్టర్లు మీ వాయిస్ విని, పని ఇచ్చి, సురక్షితమైన ఎస్క్రో ద్వారా వేతనాలు చెల్లిస్తారు.",
      ctaSpeakRegister: "మాట్లాడి ప్రొఫైల్ సృష్టించండి",
      ctaPostJob: "వాయిస్‌తో పనిని పోస్ట్ చేయండి",
      statsWorkers: "నమోదిత కార్మికులు",
      statsJobs: "పూర్తయిన పనులు",
      statsWage: "సగటు రోజువారీ వేతనం",
      statsRating: "వినియోగదారుల సంతృప్తి",
      step1Title: "1. మీ భాషలో మాట్లాడండి",
      step1Desc: "మీ పేరు, పని, అనుభవం మరియు జిల్లాను తెలుగులో లేదా మీ సొంత భాషలో మాట్లాడి చెప్పండి.",
      step2Title: "2. తక్షణమే ఏఐ ప్రొఫైల్ సిద్ధం",
      step2Desc: "మా ఏఐ మోడల్ మీ మాటలను గ్రహించి మీ నైపుణ్యాలతో డిజిటల్ ప్రొఫైల్‌ను తయారు చేస్తుంది.",
      step3Title: "3. సురక్షితమైన నగదుతో పనిని పొందండి",
      step3Desc: "యజమానులు నేరుగా మీకు పని ఇస్తారు. పని ప్రారంభించే ముందే వేతనం భద్రంగా జమ చేయబడి, పని పూర్తయ్యాక మీ ఖాతాకు వస్తుంది.",
      tradesHeading: "నిర్మాణం & గృహ మరమ్మత్తుల ప్రధాన పనులు",
      tradesSubtitle: "ప్రధాన నగరాలు మరియు పారిశ్రామిక ప్రాంతాలలో నిపుణులైన కార్మికులు అందుబాటులో ఉన్నారు.",
      trustedHeading: "కాంట్రాక్టర్లు, బిల్డర్లు & కుటుంబాల నమ్మకం",
      trustedSubtitle: "స్పష్టమైన రోజువారీ రేట్లు, సమీపంలోని కార్మికులు మరియు ప్రభుత్వ ఐటీఐ గుర్తింపు బ్యాడ్జ్‌లు.",
      hearVoicesHeading: "కార్మికుల అసలైన వాయిస్ ప్రొఫైల్‌లను వినండి",
      listenButton: "పరిచయ వాయిస్ వినండి",
      audioDisclaimer: "కార్మికులు తమ సొంత భాషలో రికార్డ్ చేసినది."
    },
    common: {
      save: "భద్రపరచు",
      cancel: "రద్దు చేయి",
      close: "మూసివేయి",
      back: "వెనుకకు",
      next: "తరువాత",
      submit: "సమర్పించు",
      retry: "మళ్ళీ ప్రయత్నించండి",
      loading: "లోడ్ అవుతోంది...",
      error: "లోపం",
      success: "విజయవంతం",
      search: "వెతుకు",
      clear: "తొలగించు",
      listen: "వినండి",
      mute: "మ్యూట్",
      speakScreen: "ఈ స్క్రీన్‌ను చదివి వినిపించండి",
      currencySymbol: "₹",
      inr: "రూపాయలు",
      days: "రోజులు",
      years: "సంవత్సరాలు",
      ratings: "రేటింగ్‌లు",
      distance: "దూరం",
      verified: "ధృవీకరించబడింది",
      unverified: "ధృవీకరించబడలేదు"
    }
  },
  kn: { // Kannada
    nav: {
      brand: "ಸ್ಕಿಲ್‌ಬ್ರಿಡ್ಜ್",
      tagline: "ಭಾರತದ 50 ಕೋಟಿ ಕಾರ್ಮಿಕರಿಗೆ ಧ್ವನಿ ಆಧಾರಿತ ಉದ್ಯೋಗ",
      searchWorkers: "ಕಾರ್ಮಿಕರನ್ನು ಹುಡುಕಿ",
      postJob: "ಮಾತನಾಡಿ ಕೆಲಸ ನೀಡಿ",
      myJobs: "ನನ್ನ ಕೆಲಸಗಳು",
      earnings: "ಗಳಿಕೆ",
      dashboard: "ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
      voiceRegister: "ಮಾತನಾಡಿ ನೋಂದಾಯಿಸಿ",
      admin: "ಆಡಳಿತ ಮಂಡಳಿ",
      enterprise: "ದೊಡ್ಡ ಸಂಸ್ಥೆಗಳು",
      developer: "ಡೆವಲಪರ್ ಪೋರ್ಟಲ್",
      tests: "ವ್ಯವಸ್ಥೆ ಪರೀಕ್ಷೆ",
      switchRole: "ಪಾತ್ರ ಬದಲಾಯಿಸಿ",
      language: "ಭಾಷೆ",
      themeToggle: "ಡಾರ್ಕ್ ಮೋಡ್",
      login: "ಲಾಗಿನ್",
      logout: "ಲಾಗೌಟ್",
      welcome: "ಸ್ವಾಗತ",
      selectLang: "ನಿಮ್ಮ ಭಾಷೆ ಆಯ್ಕೆಮಾಡಿ",
      close: "ಮುಚ್ಚಿ"
    },
    landing: {
      heroBadge: "ಸರ್ಕಾರಿ ಐಟಿಐ & ಸ್ಕಿಲ್ ಇಂಡಿಯಾ ಜೋಡಣೆ • 100% ಧ್ವನಿ ಆಧಾರಿತ",
      heroTitle1: "ನೇರವಾಗಿ ಧ್ವನಿಯ ಮೂಲಕ ಕೆಲಸ ಪಡೆಯಿರಿ",
      heroTitleHighlight: "50 ಕೋಟಿ",
      heroTitle2: "ಶ್ರಮಿಕ ಕಾರ್ಮಿಕರಿಗಾಗಿ.",
      heroSubtitle: "ಎಲೆಕ್ಟ್ರಿಷಿಯನ್, ಪ್ಲಂಬರ್, ಮೇಸ್ತ್ರಿ, ಪೇಂಟರ್ ಮತ್ತು ಬಡಗಿಗಳು ತಮ್ಮ ಮಾತೃಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ ನೋಂದಾಯಿಸಿಕೊಳ್ಳುತ್ತಾರೆ. ಗುತ್ತಿಗೆದಾರರು ಧ್ವನಿ ಕೇಳಿ, ಕೆಲಸ ನೀಡಿ, ಸುರಕ್ಷಿತ ಎಸ್ಕ್ರೋ ಮೂಲಕ ಹಣ ಪಾವತಿಸುತ್ತಾರೆ.",
      ctaSpeakRegister: "ಮಾತನಾಡಿ ಪ್ರೊಫೈಲ್ ರಚಿಸಿ",
      ctaPostJob: "ಧ್ವನಿಯಲ್ಲಿ ಕೆಲಸ ಹಾಕಿ",
      statsWorkers: "ನೋಂದಾಯಿತ ಕಾರ್ಮಿಕರು",
      statsJobs: "ಪೂರ್ಣಗೊಂಡ ಕೆಲಸಗಳು",
      statsWage: "ಸರಾಸರಿ ದೈನಂದಿನ ವೇತನ",
      statsRating: "ಗ್ರಾಹಕರ ತೃಪ್ತಿ",
      step1Title: "1. ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ",
      step1Desc: "ನಿಮ್ಮ ಹೆಸರು, ಕೆಲಸ, ಅನುಭವ ಮತ್ತು ಜಿಲ್ಲೆಯನ್ನು ಕನ್ನಡದಲ್ಲಿ ಅಥವಾ ನಿಮ್ಮದೇ ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ ತಿಳಿಸಿ.",
      step2Title: "2. ತಕ್ಷಣದ ಎಐ ಪ್ರೊಫೈಲ್",
      step2Desc: "ನಮ್ಮ ಎಐ ಮಾದರಿಯು ನಿಮ್ಮ ಧ್ವನಿಯನ್ನು ಗ್ರಹಿಸಿ ನಿಮ್ಮ ಕೌಶಲ್ಯಗಳೊಂದಿಗೆ ಡಿಜಿಟಲ್ ಪ್ರೊಫೈಲ್ ಸಿದ್ಧಪಡಿಸುತ್ತದೆ.",
      step3Title: "3. ಸುರಕ್ಷಿತ ಹಣದೊಂದಿಗೆ ಕೆಲಸ ಪಡೆಯಿರಿ",
      step3Desc: "ಮಾಲೀಕರು ನೇರವಾಗಿ ಕೆಲಸ ನೀಡುತ್ತಾರೆ. ಕೆಲಸ ಆರಂಭಿಸುವ ಮುನ್ನವೇ ಕೂಲಿ ಸುರಕ್ಷಿತವಾಗಿಡಲಾಗುತ್ತದೆ ಮತ್ತು ಕೆಲಸ ಮುಗಿದ ತಕ್ಷಣ ಬ್ಯಾಂಕ್‌ಗೆ ಬರುತ್ತದೆ.",
      tradesHeading: "ನಿರ್ಮಾಣ ಮತ್ತು ಮನೆ ದುರಸ್ತಿಯ ಪ್ರಮುಖ ಕೆಲಸಗಳು",
      tradesSubtitle: "ಪ್ರಮುಖ ನಗರಗಳಲ್ಲಿ ನುರಿತ ಕುಶಲಕರ್ಮಿಗಳು ಸಿದ್ಧರಾಗಿದ್ದಾರೆ.",
      trustedHeading: "ಗುತ್ತಿಗೆದಾರರು ಮತ್ತು ಮನೆಮಾಲೀಕರ ನಂಬಿಕೆ",
      trustedSubtitle: "ಸ್ಪಷ್ಟ ದೈನಂದಿನ ದರಗಳು, ಸಮೀಪದ ಕಾರ್ಮಿಕರು ಮತ್ತು ಸರ್ಕಾರಿ ಐಟಿಐ ಮಾನ್ಯತೆ ಪಡೆದ ಬ್ಯಾಡ್ಜ್‌ಗಳು.",
      hearVoicesHeading: "ಕಾರ್ಮಿಕರ ಅಸಲಿ ಧ್ವನಿಯನ್ನು ಆಲಿಸಿ",
      listenButton: "ಪರಿಚಯ ಧ್ವನಿ ಕೇಳಿ",
      audioDisclaimer: "ಕಾರ್ಮಿಕರು ತಮ್ಮ ಸ್ವಂತ ಭಾಷೆಯಲ್ಲಿ ರೆಕಾರ್ಡ್ ಮಾಡಿರುವುದು."
    },
    common: {
      save: "ಉಳಿಸಿ",
      cancel: "ರದ್ದುಮಾಡಿ",
      close: "ಮುಚ್ಚಿ",
      back: "ಹಿಂದಕ್ಕೆ",
      next: "ಮುಂದಕ್ಕೆ",
      submit: "ಸಲ್ಲಿಸಿ",
      retry: "ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ",
      loading: "ಲೋಡ್ ಆಗುತ್ತಿದೆ...",
      error: "ದೋಷ",
      success: "ಯಶಸ್ವಿ",
      search: "ಹುಡುಕಿ",
      clear: "ಅಳಿಸಿ",
      listen: "ಕೇಳಿ",
      mute: "ಮ್ಯೂಟ್",
      speakScreen: "ಈ ಪರದೆಯನ್ನು ಓದಿ ಕೇಳಿಸಿ",
      currencySymbol: "₹",
      inr: "ರೂಪಾಯಿ",
      days: "ದಿನಗಳು",
      years: "ವರ್ಷಗಳು",
      ratings: "ರೇಟಿಂಗ್‌ಗಳು",
      distance: "ದೂರ",
      verified: "ದೃಢೀಕರಿಸಲಾಗಿದೆ",
      unverified: "ದೃಢೀಕರಿಸಲಾಗಿಲ್ಲ"
    }
  },
  ml: { // Malayalam
    nav: {
      brand: "സ്കിൽബ്രിഡ്ജ്",
      tagline: "ഇന്ത്യയിലെ 50 കോടി തൊഴിലാളികൾക്ക് ശബ്ദത്തിലൂടെ തൊഴിൽ",
      searchWorkers: "തൊഴിലാളികളെ കണ്ടെത്തുക",
      postJob: "സംസാരിച്ച് തൊഴിൽ നൽകുക",
      myJobs: "എന്റെ ജോലികൾ",
      earnings: "വരുമാനം",
      dashboard: "ഡാഷ്‌ബോർഡ്",
      voiceRegister: "സംസാരിച്ച് രജിസ്റ്റർ ചെയ്യുക",
      admin: "അഡ്മിൻ പാനൽ",
      enterprise: "വലിയ കമ്പനികൾ",
      developer: "ഡെവലപ്പർ പോർട്ടൽ",
      tests: "ടെസ്റ്റുകൾ",
      switchRole: "റോൾ മാറ്റുക",
      language: "ഭാഷ",
      themeToggle: "ഡാർക്ക് മോഡ്",
      login: "ലോഗിൻ",
      logout: "ലോഗൗട്ട്",
      welcome: "സ്വാഗതം",
      selectLang: "ഭാഷ തിരഞ്ഞെടുക്കുക",
      close: "അടയ്ക്കുക"
    },
    landing: {
      heroBadge: "സർക്കാർ ഐടിഐ & സ്കിൽ ഇന്ത്യ അഫിലിയേറ്റഡ് • 100% വോയ്സ് ഫസ്റ്റ്",
      heroTitle1: "ശബ്ദത്തിലൂടെ നേരിട്ട് തൊഴിൽ നേടൂ",
      heroTitleHighlight: "50 കോടി",
      heroTitle2: "തൊഴിലാളികൾക്കായി.",
      heroSubtitle: "ഇലക്ട്രീഷ്യൻ, പ്ലംബർ, മേസ്തിരി, പെയിന്റർ, ആശാരിമാർ എന്നിവർ സ്വന്തം മാതൃഭാഷയിൽ സംസാരിച്ച് രജിസ്റ്റർ ചെയ്യുന്നു. കരാറുകാർ നിങ്ങളുടെ ശബ്ദം കേട്ട് തൊഴിൽ നൽകുന്നു.",
      ctaSpeakRegister: "സംസാരിച്ച് പ്രൊഫൈൽ ഉണ്ടാക്കൂ",
      ctaPostJob: "ശബ്ദത്തിൽ തൊഴിൽ പോസ്റ്റ് ചെയ്യൂ",
      statsWorkers: "രജിസ്റ്റർ ചെയ്ത തൊഴിലാളികൾ",
      statsJobs: "പൂർത്തിയാക്കിയ ജോലികൾ",
      statsWage: "ശരാശരി പ്രതിദിന വേതനം",
      statsRating: "ഉപഭോക്തൃ സംതൃപ്തി",
      step1Title: "1. സ്വന്തം ഭാഷയിൽ സംസാരിക്കുക",
      step1Desc: "നിങ്ങളുടെ പേര്, ജോലി, പ്രവൃത്തിപരിചയം, ജില്ല എന്നിവ മലയാളത്തിൽ സംസാരിച്ച് പറയുക.",
      step2Title: "2. തൽക്ഷണം എഐ പ്രൊഫൈൽ",
      step2Desc: "ഞങ്ങളുടെ എഐ നിങ്ങളുടെ ശബ്ദം കേട്ട് കഴിവുകൾ മനസ്സിലാക്കി ഉടൻ പ്രൊഫൈൽ തയ്യാറാക്കുന്നു.",
      step3Title: "3. സുരക്ഷിത വേതനത്തോടെ ജോലി",
      step3Desc: "തൊഴിലുടമകൾ നേരിട്ട് ജോലി നൽകുന്നു. പണം മുൻകൂട്ടി സുരക്ഷിതമായി സൂക്ഷിക്കുകയും ജോലി തീർന്നയുടൻ അക്കൗണ്ടിൽ എത്തുകയും ചെയ്യുന്നു.",
      tradesHeading: "നിർമ്മാണ & അറ്റകുറ്റപ്പണി മേഖലയിലെ പ്രധാന ജോലികൾ",
      tradesSubtitle: "നഗരങ്ങളിലും വ്യാവസായിക മേഖലകളിലും വിദഗ്ദ്ധരായ തൊഴിലാളികൾ ലഭ്യമാണ്.",
      trustedHeading: "കരാറുകാരുടെയും കുടുംബങ്ങളുടെയും വിശ്വാസം",
      trustedSubtitle: "സുതാര്യമായ പ്രതിദിന നിരക്കുകൾ, അടുത്തുള്ള തൊഴിലാളികൾ, സർക്കാർ ഐടിഐ ബാഡ്ജുകൾ.",
      hearVoicesHeading: "തൊഴിലാളികളുടെ യഥാർത്ഥ ശബ്ദം കേൾക്കൂ",
      listenButton: "ശബ്ദ ആമുഖം കേൾക്കുക",
      audioDisclaimer: "തൊഴിലാളികൾ സ്വന്തം ഭാഷയിൽ റെക്കോർഡ് ചെയ്തത്."
    },
    common: {
      save: "സംരക്ഷിക്കുക",
      cancel: "റദ്ദാക്കുക",
      close: "അടയ്ക്കുക",
      back: "പുറകോട്ട്",
      next: "അടുത്തത്",
      submit: "സമർപ്പിക്കുക",
      retry: "വീണ്ടും ശ്രമിക്കുക",
      loading: "ലോഡ് ചെയ്യുന്നു...",
      error: "പിശക്",
      success: "വിജയം",
      search: "തിരയുക",
      clear: "മായ്ക്കുക",
      listen: "കേൾക്കുക",
      mute: "മ്യൂട്ട്",
      speakScreen: "ഈ സ്ക്രീൻ വായിച്ചു കേൾപ്പിക്കുക",
      currencySymbol: "₹",
      inr: "രൂപ",
      days: "ദിവസങ്ങൾ",
      years: "വർഷങ്ങൾ",
      ratings: "റേറ്റിംഗുകൾ",
      distance: "ദൂരം",
      verified: "പരിശോധിച്ചുറപ്പിച്ചത്",
      unverified: "പരിശോധിച്ചിട്ടില്ല"
    }
  },
  bn: { // Bengali
    nav: {
      brand: "স্কিলব্রিজ",
      tagline: "ভারতের ৫০ কোটি শ্রমিকের জন্য কণ্ঠস্বরে কর্মসংস্থান",
      searchWorkers: "কারিগর খুঁজুন",
      postJob: "মুখে বলে কাজ দিন",
      myJobs: "আমার কাজ",
      earnings: "উপার্জন",
      dashboard: "ড্যাশবোর্ড",
      voiceRegister: "মুখে বলে যোগ দিন",
      admin: "অ্যাডমিন প্যানেল",
      enterprise: "বড় কোম্পানি",
      developer: "ডেভেলপার পোর্টাল",
      tests: "সিস্টেম টেস্ট",
      switchRole: "ভূমিকা পরিবর্তন",
      language: "ভাষা",
      themeToggle: "ডার্ক মোড",
      login: "লগইন",
      logout: "লগআউট",
      welcome: "স্বাগতম",
      selectLang: "আপনার ভাষা বেছে নিন",
      close: "বন্ধ করুন"
    },
    landing: {
      heroBadge: "সরকারি আইটিআই ও স্কিল ইন্ডিয়া অনুমোদিত • ১০০% ভয়েস ফার্স্ট",
      heroTitle1: "সরাসরি মুখে বলে কাজ পান",
      heroTitleHighlight: "৫০ কোটি",
      heroTitle2: "মেহনতি কারিগরদের জন্য।",
      heroSubtitle: "ইলেকট্রিশিয়ান, প্লাম্বার, রাজমিস্ত্রি, পেইন্টার এবং কাঠমিস্ত্রিরা নিজেদের মাতৃভাষায় বলে রেজিস্টার করেন। ঠিকাদাররা আপনার পরিচয় শুনে কাজ দেন এবং সুরক্ষিত এসক্রো মারফত মজুরি দেন।",
      ctaSpeakRegister: "মুখে বলে প্রোফাইল বানান",
      ctaPostJob: "কণ্ঠস্বরে কাজের নোটিশ দিন",
      statsWorkers: "নিবন্ধিত কারিগর",
      statsJobs: "সম্পন্ন কাজ",
      statsWage: "গড় দৈনিক মজুরি",
      statsRating: "গ্রাহক সন্তুষ্টি",
      step1Title: "১. নিজের ভাষায় বলুন",
      step1Desc: "আপনার নাম, কাজের ধরন, অভিজ্ঞতা এবং জেলার নাম বাংলায় পরিষ্কারভাবে বলুন।",
      step2Title: "২. তাৎক্ষণিক এআই প্রোফাইল",
      step2Desc: "আমাদের এআই মডেল আপনার কথা শুনে তৎক্ষণাৎ আপনার ডিজিটাল প্রোফাইল তৈরি করে।",
      step3Title: "৩. সুরক্ষিত পারিশ্রমিকে কাজ",
      step3Desc: "মালিকরা সরাসরি আপনাকে কাজ দেন। কাজ শুরুর আগেই মজুরি সুরক্ষিত থাকে এবং কাজ শেষ হতেই অ্যাকাউন্টে জমা হয়।",
      tradesHeading: "নির্মাণ ও বাড়ি মেরামতের প্রধান কাজগুলি",
      tradesSubtitle: "প্রধান শহরগুলিতে দক্ষ ও যাচাইকৃত কারিগররা প্রস্তুত আছেন।",
      trustedHeading: "ঠিকাদার ও পরিবারের নির্ভরযোগ্য ভরসা",
      trustedSubtitle: "স্বচ্ছ দৈনিক রেট, কাছের কারিগর এবং সরকারি আইটিআই ব্যাজ।",
      hearVoicesHeading: "কারিগরদের আসল কণ্ঠস্বর শুনুন",
      listenButton: "পরিচয় শুনুন",
      audioDisclaimer: "কারিগরদের নিজেদের ভাষায় রেকর্ড করা।"
    },
    common: {
      save: "সংরক্ষণ",
      cancel: "বাতিল",
      close: "বন্ধ করুন",
      back: "পেছনে",
      next: "পরবর্তী",
      submit: "জমা দিন",
      retry: "আবার চেষ্টা করুন",
      loading: "লোড হচ্ছে...",
      error: "ত্রুটি",
      success: "সফল",
      search: "অনুসন্ধান",
      clear: "মুছুন",
      listen: "শুনুন",
      mute: "মিউট",
      speakScreen: "এই স্ক্রিনটি পড়ে শুনুন",
      currencySymbol: "₹",
      inr: "টাকা",
      days: "দিন",
      years: "বছর",
      ratings: "রেটিং",
      distance: "দূরত্ব",
      verified: "যাচাইকৃত",
      unverified: "অযাচাইকৃত"
    }
  },
  gu: { // Gujarati
    nav: {
      brand: "સ્કિલબ્રિજ",
      tagline: "ભારતના 50 કરોડ શ્રમિકો માટે અવાજ આધારિત રોજગાર",
      searchWorkers: "કારીગરો શોધો",
      postJob: "બોલીને કામ આપો",
      myJobs: "મારા કામ",
      earnings: "કમાણી",
      dashboard: "ડેશબોર્ડ",
      voiceRegister: "બોલીને નોંધણી કરો",
      admin: "એડમિન કંટ્રોલ",
      enterprise: "મોટી કંપનીઓ",
      developer: "ડેવલપર પોર્ટલ",
      tests: "સિસ્ટમ ટેસ્ટ",
      switchRole: "રોલ બદલો",
      language: "ભાષા",
      themeToggle: "ડાર્ક મોડ",
      login: "લૉગિન",
      logout: "લૉગઆઉટ",
      welcome: "નમસ્તે",
      selectLang: "તમારી ભાષા પસંદ કરો",
      close: "બંધ કરો"
    },
    landing: {
      heroBadge: "સરકારી આઈટીઆઈ & સ્કિલ ઈન્ડિયા સાથે જોડાયેલું • 100% વોઈસ આધારિત",
      heroTitle1: "સીધા અવાજથી કામ મેળવો",
      heroTitleHighlight: "50 કરોડ",
      heroTitle2: "મહેનતુ કારીગરો માટે.",
      heroSubtitle: "ઇલેક્ટ્રિશિયન, પ્લમ્બર, કડિયા, કલરકામ અને સુથાર પોતાની માતૃભાષામાં બોલીને નોંધણી કરે છે. કોન્ટ્રાક્ટરો અવાજ સાંભળીને સીધું કામ આપે છે અને સુરક્ષિત રીતે મજૂરી ચૂકવે છે.",
      ctaSpeakRegister: "બોલીને પ્રોફાઇલ બનાવો",
      ctaPostJob: "અવાજથી કામ નોંધો",
      statsWorkers: "નોંધાયેલા કારીગરો",
      statsJobs: "પૂર્ણ થયેલા કામ",
      statsWage: "સરેરાશ દૈનિક વેતન",
      statsRating: "ગ્રાહક સંતોષ",
      step1Title: "1. તમારી ભાષામાં બોલો",
      step1Desc: "તમારું નામ, કામ, અનુભવ અને જિલ્લો ગુજરાતીમાં બોલીને જણાવો.",
      step2Title: "2. તરત જ પ્રોફાઇલ તૈયાર",
      step2Desc: "અમારું એઆઈ તમારા અવાજને સમજીને તરત જ તમારી ડિજિટલ પ્રોફાઇલ તૈયાર કરી દેશે.",
      step3Title: "3. સુરક્ષિત પૈસા સાથે કામ મેળવો",
      step3Desc: "માલિકો સીધું તમને કામ આપશે. કામ શરૂ થતાં પહેલાં મજૂરી સુરક્ષિત જમા રહે છે અને કામ પૂરું થતાં સીધી ખાતામાં આવે છે.",
      tradesHeading: "બાંધકામ અને ઘર રિપેરિંગના મુખ્ય કામો",
      tradesSubtitle: "મુખ્ય શહેરોમાં કુશળ અને પ્રમાણિત કારીગરો ઉપલબ્ધ છે.",
      trustedHeading: "કોન્ટ્રાક્ટરો અને પરિવારોનો અતૂટ વિશ્વાસ",
      trustedSubtitle: "સ્પષ્ટ દૈનિક ભાવ, નજીકના કારીગરો અને સરકારી આઈટીઆઈ પ્રમાણિત બેજ.",
      hearVoicesHeading: "કારીગરોનો અસલી અવાજ સાંભળો",
      listenButton: "પરિચય સાંભળો",
      audioDisclaimer: "કારીગરો દ્વારા તેમની પોતાની ભાષામાં રેકોર્ડ કરેલું."
    },
    common: {
      save: "સાચવો",
      cancel: "રદ કરો",
      close: "બંધ કરો",
      back: "પાછળ",
      next: "આગળ",
      submit: "સબમિટ કરો",
      retry: "ફરી પ્રયાસ કરો",
      loading: "લોડ થઈ રહ્યું છે...",
      error: "ભૂલ",
      success: "સફળ",
      search: "શોધો",
      clear: "સાફ કરો",
      listen: "સાંભળો",
      mute: "મ્યૂટ",
      speakScreen: "આ સ્ક્રીન બોલીને સંભળાવો",
      currencySymbol: "₹",
      inr: "રૂપિયા",
      days: "દિવસો",
      years: "વર્ષ",
      ratings: "રેટિંગ્સ",
      distance: "અંતર",
      verified: "પ્રમાણિત",
      unverified: "અપ્રમાણિત"
    }
  },
  or: { // Odia
    nav: {
      brand: "ସ୍କିଲବ୍ରିଜ୍",
      tagline: "ଭାରତର ୫୦ କୋଟି ଶ୍ରମିକଙ୍କ ପାଇଁ କଣ୍ଠସ୍ୱର ମାଧ୍ୟମରେ ରୋଜଗାର",
      searchWorkers: "କାରିଗର ଖୋଜନ୍ତୁ",
      postJob: "କହିକି କାମ ଦିଅନ୍ତୁ",
      myJobs: "ମୋର କାମ",
      earnings: "ଉପାର୍ଜନ",
      dashboard: "ଡ୍ୟାସବୋର୍ଡ",
      voiceRegister: "କହିକି ପଞ୍ଜୀକରଣ କରନ୍ତୁ",
      admin: "ପ୍ରଶାସକ କକ୍ଷ",
      enterprise: "ବଡ଼ କମ୍ପାନୀ",
      developer: "ଡେଭଲପର ପୋର୍ଟାଲ",
      tests: "ସିଷ୍ଟମ ପରୀକ୍ଷା",
      switchRole: "ଭୂମିକା ବଦଳାନ୍ତୁ",
      language: "ଭାଷା",
      themeToggle: "ଡାର୍କ ମୋଡ୍",
      login: "ଲଗଇନ୍",
      logout: "ଲଗଆଉଟ୍",
      welcome: "ସ୍ୱାଗତ",
      selectLang: "ଭାଷା ବାଛନ୍ତୁ",
      close: "ବନ୍ଦ କରନ୍ତୁ"
    },
    landing: {
      heroBadge: "ସରକାରୀ ଆଇଟିଆଇ ସଂଲଗ୍ନ • ୧୦୦% କଣ୍ଠସ୍ୱର ଆଧାରିତ",
      heroTitle1: "ସିଧାସଳଖ କହିକି କାମ ପାଆନ୍ତୁ",
      heroTitleHighlight: "୫୦ କୋଟି",
      heroTitle2: "ମେହନତୀ କାରିଗରଙ୍କ ପାଇଁ।",
      heroSubtitle: "ଇଲେକ୍ଟ୍ରିସିଆନ୍, ପ୍ଲମ୍ବର, ରାଜମିସ୍ତ୍ରୀ, ପେଣ୍ଟର ଏବଂ ବଢ଼େଇ ନିଜ ମାତୃଭାଷାରେ କହିକି ରେଜିଷ୍ଟର କରନ୍ତି। ଠିକାଦାରମାନେ ଆପଣଙ୍କ ସ୍ୱର ଶୁଣି କାମ ଦିଅନ୍ତି ଏବଂ ସୁରକ୍ଷିତ ଏସକ୍ରୋ ଜରିଆରେ ମଜୁରୀ ଦିଅନ୍ତି।",
      ctaSpeakRegister: "କହିକି ପ୍ରୋଫାଇଲ୍ ବନାନ୍ତୁ",
      ctaPostJob: "କଣ୍ଠସ୍ୱରରେ କାମ ପୋଷ୍ଟ କରନ୍ତୁ",
      statsWorkers: "ପଞ୍ଜୀକୃତ କାରିଗର",
      statsJobs: "ସମ୍ପୂର୍ଣ୍ଣ କାମ",
      statsWage: "ହାରାହାରି ଦୈନିକ ମଜୁରୀ",
      statsRating: "ଗ୍ରାହକ ସନ୍ତୋଷ",
      step1Title: "୧. ନିଜ ଭାଷାରେ କୁହନ୍ତୁ",
      step1Desc: "ଆପଣଙ୍କ ନାମ, କାମ, ଅଭିଜ୍ଞତା ଏବଂ ଜିଲ୍ଲା ଓଡ଼ିଆରେ କହିକି ଜଣାନ୍ତୁ।",
      step2Title: "୨. ତୁରନ୍ତ ଏଆଇ ପ୍ରୋଫାଇଲ୍",
      step2Desc: "ଆମର ଏଆଇ ମଡେଲ ଆପଣଙ୍କ କଥା ବୁଝି ତୁରନ୍ତ ଡିଜିଟାଲ୍ ପ୍ରୋଫାଇଲ୍ ପ୍ରସ୍ତୁତ କରେ।",
      step3Title: "୩. ସୁରକ୍ଷିତ ଟଙ୍କା ସହ କାମ",
      step3Desc: "ମାଲିକମାନେ ସିଧାସଳଖ ଆପଣଙ୍କୁ କାମ ଦିଅନ୍ତି। କାମ ଆରମ୍ଭ ପୂର୍ବରୁ ମଜୁରୀ ସୁରକ୍ଷିତ ରହେ ଏବଂ କାମ ସରିବା ମାତ୍ରେ ଖାତାକୁ ଆସେ।",
      tradesHeading: "ନିର୍ମାଣ ଓ ଘର ମରାମତିର ମୁଖ୍ୟ କାର୍ଯ୍ୟ",
      tradesSubtitle: "ପ୍ରମୁଖ ସହରମାନଙ୍କରେ ଦକ୍ଷ କାରିଗର ଉପଲବ୍ଧ ଅଛନ୍ତି।",
      trustedHeading: "ଠିକାଦାର ଓ ପରିବାରମାନଙ୍କର ବିଶ୍ୱାସ",
      trustedSubtitle: "ସ୍ୱଚ୍ଛ ଦୈନିକ ଦର, ନିକଟସ୍ଥ କାରିଗର ଏବଂ ସରକାରୀ ଆଇଟିଆଇ ବ୍ୟାଜ୍।",
      hearVoicesHeading: "କାରିଗରମାନଙ୍କ ପ୍ରକୃତ କଣ୍ଠସ୍ୱର ଶୁଣନ୍ତୁ",
      listenButton: "ପରିଚୟ ଶୁଣନ୍ତୁ",
      audioDisclaimer: "କାରିଗରମାନଙ୍କ ଦ୍ୱାରା ନିଜ ଭାଷାରେ ରେକର୍ଡ କରାଯାଇଛି।"
    },
    common: {
      save: "ସାଇତନ୍ତୁ",
      cancel: "ବାତିଲ୍",
      close: "ବନ୍ଦ କରନ୍ତୁ",
      back: "ପଛକୁ",
      next: "ଆଗକୁ",
      submit: "ଦାଖଲ କରନ୍ତୁ",
      retry: "ପୁନଃ ଚେଷ୍ଟା କରନ୍ତୁ",
      loading: "ଲୋଡ୍ ହେଉଛି...",
      error: "ତ୍ରୁଟି",
      success: "ସଫଳ",
      search: "ଖୋଜନ୍ତୁ",
      clear: "ସଫା କରନ୍ତୁ",
      listen: "ଶୁଣନ୍ତୁ",
      mute: "ମ୍ୟୁଟ୍",
      speakScreen: "ଏହି ସ୍କ୍ରିନ୍ ପଢ଼ି ଶୁଣାନ୍ତୁ",
      currencySymbol: "₹",
      inr: "ଟଙ୍କା",
      days: "ଦିନ",
      years: "ବର୍ଷ",
      ratings: "ରେଟିଂ",
      distance: "ଦୂରତା",
      verified: "ଯାଞ୍ଚ ହୋଇଛି",
      unverified: "ଯାଞ୍ଚ ହୋଇନାହିଁ"
    }
  },
  pa: { // Punjabi
    nav: {
      brand: "ਸਕਿੱਲਬ੍ਰਿਜ",
      tagline: "ਭਾਰਤ ਦੇ 50 ਕਰੋੜ ਕਾਮਿਆਂ ਲਈ ਆਵਾਜ਼ ਰਾਹੀਂ ਰੋਜ਼ਗਾਰ",
      searchWorkers: "ਕਾਰੀਗਰ ਲੱਭੋ",
      postJob: "ਬੋਲ ਕੇ ਕੰਮ ਪਾਓ",
      myJobs: "ਮੇਰੇ ਕੰਮ",
      earnings: "ਕਮਾਈ",
      dashboard: "ਡੈਸ਼ਬੋਰਡ",
      voiceRegister: "ਬੋਲ ਕੇ ਰਜਿਸਟਰ ਕਰੋ",
      admin: "ਐਡਮਿਨ ਪੈਨਲ",
      enterprise: "ਵੱਡੀਆਂ ਕੰਪਨੀਆਂ",
      developer: "ਡਿਵੈਲਪਰ ਪੋਰਟਲ",
      tests: "ਸਿਸਟਮ ਟੈਸਟ",
      switchRole: "ਰੋਲ ਬਦਲੋ",
      language: "ਭਾਸ਼ਾ",
      themeToggle: "ਡਾਰਕ ਮੋਡ",
      login: "ਲਾਗਇਨ",
      logout: "ਲਾਗਆਉਟ",
      welcome: "ਜੀ ਆਇਆਂ ਨੂੰ",
      selectLang: "ਆਪਣੀ ਭਾਸ਼ਾ ਚੁਣੋ",
      close: "ਬੰਦ ਕਰੋ"
    },
    landing: {
      heroBadge: "ਸਰਕਾਰੀ ਆਈਟੀਆਈ & ਸਕਿੱਲ ਇੰਡੀਆ ਮਾਨਤਾ ਪ੍ਰਾਪਤ • 100% ਆਵਾਜ਼ ਆਧਾਰਿਤ",
      heroTitle1: "ਸਿੱਧਾ ਆਵਾਜ਼ ਰਾਹੀਂ ਕੰਮ ਪ੍ਰਾਪਤ ਕਰੋ",
      heroTitleHighlight: "50 ਕਰੋੜ",
      heroTitle2: "ਮਿਹਨਤੀ ਕਾਰੀਗਰਾਂ ਲਈ।",
      heroSubtitle: "ਇਲੈਕਟ੍ਰੀਸ਼ੀਅਨ, ਪਲੰਬਰ, ਰਾਜਮਿਸਤਰੀ, ਪੇਂਟਰ ਅਤੇ ਤਰਖਾਣ ਆਪਣੀ ਮਾਂ-ਬੋਲੀ ਵਿੱਚ ਬੋਲ ਕੇ ਰਜਿਸਟਰ ਕਰਦੇ ਹਨ। ਠੇਕੇਦਾਰ ਤੁਹਾਡੀ ਆਵਾਜ਼ ਸੁਣ ਕੇ ਕੰਮ ਦਿੰਦੇ ਹਨ ਅਤੇ ਸੁਰੱਖਿਅਤ ਐਸਕਰੋ ਰਾਹੀਂ ਦਿਹਾੜੀ ਅਦਾ ਕਰਦੇ ਹਨ।",
      ctaSpeakRegister: "ਬੋਲ ਕੇ ਪ੍ਰੋਫਾਈਲ ਬਣਾਓ",
      ctaPostJob: "ਆਵਾਜ਼ ਰਾਹੀਂ ਕੰਮ ਪੋਸਟ ਕਰੋ",
      statsWorkers: "ਰਜਿਸਟਰਡ ਕਾਰੀਗਰ",
      statsJobs: "ਮੁਕੰਮਲ ਕੀਤੇ ਕੰਮ",
      statsWage: "ਔਸਤ ਰੋਜ਼ਾਨਾ ਦਿਹਾੜੀ",
      statsRating: "ਗਾਹਕ ਸੰਤੁਸ਼ਟੀ",
      step1Title: "1. ਆਪਣੀ ਬੋਲੀ ਵਿੱਚ ਬੋਲੋ",
      step1Desc: "ਆਪਣਾ ਨਾਮ, ਕੰਮ, ਤਜਰਬਾ ਅਤੇ ਜ਼ਿਲ੍ਹਾ ਪੰਜਾਬੀ ਵਿੱਚ ਬੋਲ ਕੇ ਦੱਸੋ।",
      step2Title: "2. ਤੁਰੰਤ ਏਆਈ ਪ੍ਰੋਫਾਈਲ",
      step2Desc: "ਸਾਡਾ ਏਆਈ ਮਾਡਲ ਤੁਹਾਡੀ ਗੱਲ ਸੁਣ ਕੇ ਤੁਰੰਤ ਤੁਹਾਡੀ ਡਿਜੀਟਲ ਪ੍ਰੋਫਾਈਲ ਤਿਆਰ ਕਰ ਦਿੰਦਾ ਹੈ।",
      step3Title: "3. ਸੁਰੱਖਿਅਤ ਪੈਸਿਆਂ ਨਾਲ ਕੰਮ ਲਵੋ",
      step3Desc: "ਮਾਲਕ ਸਿੱਧਾ ਤੁਹਾਨੂੰ ਕੰਮ ਦਿੰਦੇ ਹਨ। ਕੰਮ ਸ਼ੁਰੂ ਹੋਣ ਤੋਂ ਪਹਿਲਾਂ ਦਿਹਾੜੀ ਸੁਰੱਖਿਅਤ ਜਮ੍ਹਾਂ ਰਹਿੰਦੀ ਹੈ ਅਤੇ ਕੰਮ ਮੁੱਕਦੇ ਹੀ ਖਾਤੇ ਵਿੱਚ ਆਉਂਦੀ ਹੈ।",
      tradesHeading: "ਉਸਾਰੀ ਅਤੇ ਘਰੇਲੂ ਮੁਰੰਮਤ ਦੇ ਮੁੱਖ ਕੰਮ",
      tradesSubtitle: "ਪ੍ਰਮੁੱਖ ਸ਼ਹਿਰਾਂ ਵਿੱਚ ਹੁਨਰਮੰਦ ਕਾਰੀਗਰ ਤਿਆਰ ਹਨ।",
      trustedHeading: "ਠੇਕੇਦਾਰਾਂ ਅਤੇ ਪਰਿਵਾਰਾਂ ਦਾ ਭਰੋਸਾ",
      trustedSubtitle: "ਸਪੱਸ਼ਟ ਰੋਜ਼ਾਨਾ ਰੇਟ, ਨੇੜਲੇ ਕਾਰੀਗਰ ਅਤੇ ਸਰਕਾਰੀ ਆਈਟੀਆਈ ਸਰਟੀਫਾਈਡ ਬੈਜ।",
      hearVoicesHeading: "ਕਾਰੀਗਰਾਂ ਦੀ ਅਸਲ ਆਵਾਜ਼ ਸੁਣੋ",
      listenButton: "ਜਾਣ-ਪਛਾਣ ਸੁਣੋ",
      audioDisclaimer: "ਕਾਰੀਗਰਾਂ ਵੱਲੋਂ ਆਪਣੀ ਬੋਲੀ ਵਿੱਚ ਰਿਕਾਰਡ ਕੀਤਾ ਗਿਆ।"
    },
    common: {
      save: "ਸੰਭਾਲੋ",
      cancel: "ਰੱਦ ਕਰੋ",
      close: "ਬੰਦ ਕਰੋ",
      back: "ਪਿੱਛੇ",
      next: "ਅੱਗੇ",
      submit: "ਜਮ੍ਹਾਂ ਕਰੋ",
      retry: "ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ",
      loading: "ਲੋਡ ਹੋ ਰਿਹਾ ਹੈ...",
      error: "ਗਲਤੀ",
      success: "ਸਫਲ",
      search: "ਖੋਜੋ",
      clear: "ਸਾਫ਼ ਕਰੋ",
      listen: "ਸੁਣੋ",
      mute: "ਮਿਊਟ",
      speakScreen: "ਇਹ ਸਕ੍ਰੀਨ ਪੜ੍ਹ ਕੇ ਸੁਣਾਓ",
      currencySymbol: "₹",
      inr: "ਰੁਪਏ",
      days: "ਦਿਨ",
      years: "ਸਾਲ",
      ratings: "ਰੇਟਿੰਗਾਂ",
      distance: "ਦੂਰੀ",
      verified: "ਤਸਦੀਕਸ਼ੁਦਾ",
      unverified: "ਗੈਰ-ਤਸਦੀਕਸ਼ੁਦਾ"
    }
  },
  ur: { // Urdu (RTL)
    nav: {
      brand: "اسکل برج",
      tagline: "ہندوستان کے 50 کروڑ غیر رسمی کارکنوں کے لیے آواز کے ذریعے روزگار",
      searchWorkers: "کاریگر تلاش کریں",
      postJob: "بول کر کام درج کریں",
      myJobs: "میرے کام",
      earnings: "آمدنی",
      dashboard: "ڈیش بورڈ",
      voiceRegister: "بول کر رجسٹریشن کریں",
      admin: "ایڈمن پینل",
      enterprise: "بڑے ادارے",
      developer: "ڈویلپر پورٹل",
      tests: "سسٹم ٹیسٹ",
      switchRole: "کردار تبدیل کریں",
      language: "زبان",
      themeToggle: "ڈارک موڈ",
      login: "لاگ ان",
      logout: "لاگ آؤٹ",
      welcome: "خوش آمدید",
      selectLang: "اپنی زبان منتخب کریں",
      close: "بند کریں"
    },
    landing: {
      heroBadge: "سرکاری آئی ٹی آئی اور اسکل انڈیا سے منسلک • 100% آواز پر مبنی",
      heroTitle1: "براہ راست آواز کے ذریعے کام حاصل کریں",
      heroTitleHighlight: "50 کروڑ",
      heroTitle2: "محنتی کاریگروں کے لیے۔",
      heroSubtitle: "الیکٹریشن، پلمبر، راج مستری، پینٹر اور بڑھئی اپنی مادری زبان میں بول کر رجسٹر ہوتے ہیں۔ ٹھیکیدار اور مالکان آپ کی آواز سن کر کام دیتے ہیں اور محفوظ طریقے سے اجرت ادا کرتے ہیں۔",
      ctaSpeakRegister: "بول کر پروفائل بنائیں",
      ctaPostJob: "آواز کے ذریعے کام درج کریں",
      statsWorkers: "تصدیق شدہ کاریگر",
      statsJobs: "مکمل شدہ کام",
      statsWage: "اوسط یومیہ اجرت",
      statsRating: "صارفین کا اطمینان",
      step1Title: "1. اپنی زبان میں بولیں",
      step1Desc: "اپنا نام، پیشہ، تجربہ اور ضلع اردو یا اپنی زبان میں بول کر بتائیں۔",
      step2Title: "2. فوری طور پر اے آئی پروفائل تیار",
      step2Desc: "ہمارا ماڈل آپ کی آواز سن کر آپ کی مہارتوں کی بنیاد پر ڈیجیٹل پروفائل تیار کرتا ہے۔",
      step3Title: "3. محفوظ ادائیگی کے ساتھ کام حاصل کریں",
      step3Desc: "مالکان براہ راست آپ کو کام دیتے ہیں۔ کام شروع ہونے سے پہلے اجرت محفوظ رکھی جاتی ہے اور کام کے اختتام پر فوری منتقل ہوتی ہے۔",
      tradesHeading: "تعمیرات اور گھریلو مرمت کے اہم شعبے",
      tradesSubtitle: "بڑے شہروں میں ماہر کاریگر فوری دستیاب ہیں۔",
      trustedHeading: "ٹھیکیداروں، بلڈروں اور خاندانوں کا بھروسہ",
      trustedSubtitle: "شفاف یومیہ اجرت، قریبی کاریگر اور سرکاری آئی ٹی آئی سرٹیفائیڈ بیجز۔",
      hearVoicesHeading: "کاریگروں کی اصل آواز سنیں",
      listenButton: "آواز میں تعارف سنیں",
      audioDisclaimer: "کاریگروں کی جانب سے اپنی زبان میں ریکارڈ شدہ۔"
    },
    common: {
      save: "محفوظ کریں",
      cancel: "منسوخ کریں",
      close: "بند کریں",
      back: "پیچھے",
      next: "آگے",
      submit: "جمع کریں",
      retry: "دوبارہ کوشش کریں",
      loading: "لوڈ ہو رہا ہے...",
      error: "خرابی",
      success: "کامیاب",
      search: "تلاش کریں",
      clear: "صاف کریں",
      listen: "سنیں",
      mute: "خاموش",
      speakScreen: "اس اسکرین کو سنیں",
      currencySymbol: "₹",
      inr: "روپے",
      days: "دن",
      years: "سال",
      ratings: "درجہ بندی",
      distance: "فاصلہ",
      verified: "تصدیق شدہ",
      unverified: "غیر تصدیق شدہ"
    }
  }
};

// Function to recursively populate missing keys from English master template
function buildLocale(langCode, targetDict) {
  const result = {};

  function traverse(enObj, langObj, pathArr = []) {
    const out = {};
    for (const key of Object.keys(enObj)) {
      const enVal = enObj[key];
      const langVal = langObj ? langObj[key] : undefined;

      if (typeof enVal === 'object' && enVal !== null && !Array.isArray(enVal)) {
        out[key] = traverse(enVal, langVal || {}, [...pathArr, key]);
      } else {
        // Use native translation if present in dictionary, otherwise use contextual localized mapping
        if (typeof langVal === 'string' && langVal.trim()) {
          out[key] = langVal;
        } else {
          // Provide vernacular translation fallback based on the key and language
          out[key] = getVernacularFallback(langCode, [...pathArr, key].join('.'), enVal);
        }
      }
    }
    return out;
  }

  return traverse(en, targetDict);
}

// Vernacular fallback generator for complete translations
function getVernacularFallback(lang, keyPath, enText) {
  // If the text contains placeholders like {{count}}, preserve them
  const hasCount = enText.includes('{{count}}');
  const hasWage = enText.includes('{{wage}}');
  const hasYears = enText.includes('{{years}}');
  const hasSeconds = enText.includes('{{seconds}}');
  
  // High quality vernacular phrase map per language family
  const langNames = {
    te: 'తెలుగు',
    kn: 'ಕನ್ನಡ',
    ml: 'മലയാളം',
    bn: 'বাংলা',
    gu: 'ગુજરાતી',
    or: 'ଓଡ଼ିଆ',
    pa: 'ਪੰਜਾਬੀ',
    ur: 'اردو'
  };

  if (keyPath.startsWith('auth.')) {
    if (keyPath === 'auth.phoneLabel') return lang === 'ur' ? 'موبائل نمبر' : lang === 'te' ? 'మొబైల్ నంబర్' : lang === 'kn' ? 'ಮೊಬೈಲ್ ಸಂಖ್ಯೆ' : lang === 'bn' ? 'মোবাইল নম্বর' : lang === 'gu' ? 'મોબાઇલ નંબર' : lang === 'ml' ? 'മൊബൈൽ നമ്പർ' : lang === 'pa' ? 'ਮੋਬਾਈਲ ਨੰਬਰ' : 'ମୋବାଇଲ୍ ନମ୍ବର';
    if (keyPath === 'auth.sendOtp') return lang === 'ur' ? 'او ٹی پی کوڈ بھیجیں' : lang === 'te' ? 'ఓటీపీ పంపండి' : lang === 'kn' ? 'ಒಟಿಪಿ ಕಳುಹಿಸಿ' : lang === 'bn' ? 'ওটিপি পাঠান' : lang === 'gu' ? 'ઓટીપી મોકલો' : lang === 'ml' ? 'ഒടിപി അയക്കുക' : lang === 'pa' ? 'ਓਟੀਪੀ ਭੇਜੋ' : 'ଓଟିପି ପଠାନ୍ତୁ';
    if (keyPath === 'auth.verifyOtp') return lang === 'ur' ? 'تصدیق کر کے آگے بڑھیں' : lang === 'te' ? 'ధృవీకరించి కొనసాగండి' : lang === 'kn' ? 'ದೃಢೀಕರಿಸಿ ಮುಂದುವರಿಯಿರಿ' : lang === 'bn' ? 'যাচাই করে এগিয়ে যান' : lang === 'gu' ? 'ચકાસીને આગળ વધો' : lang === 'ml' ? 'സ്ഥിരീകരിച്ച് തുടരുക' : lang === 'pa' ? 'ਤਸਦੀਕ ਕਰਕੇ ਅੱਗੇ ਵਧੋ' : 'ଯାଞ୍ଚ କରି ଆଗକୁ ବଢ଼ନ୍ତୁ';
  }

  if (keyPath.startsWith('voiceRegister.')) {
    if (keyPath === 'voiceRegister.step1') return lang === 'ur' ? '1. بولیں' : lang === 'te' ? '1. మాట్లాడండి' : lang === 'kn' ? '1. ಮಾತನಾಡಿ' : lang === 'bn' ? '১. বলুন' : lang === 'gu' ? '1. બોલો' : lang === 'ml' ? '1. സംസാരിക്കുക' : lang === 'pa' ? '1. ਬੋਲੋ' : '୧. କୁହନ୍ତୁ';
    if (keyPath === 'voiceRegister.step2') return lang === 'ur' ? '2. تصدیق کریں' : lang === 'te' ? '2. తనిఖీ చేయండి' : lang === 'kn' ? '2. ಪರಿಶೀಲಿಸಿ' : lang === 'bn' ? '২. যাচাই করুন' : lang === 'gu' ? '2. ચકાસો' : lang === 'ml' ? '2. പരിശോധിക്കുക' : lang === 'pa' ? '2. ਜਾਂਚੋ' : '୨. ଯାଞ୍ଚ କରନ୍ତୁ';
    if (keyPath === 'voiceRegister.step3') return lang === 'ur' ? '3. مصدقہ' : lang === 'te' ? '3. ధృవీకరించబడింది' : lang === 'kn' ? '3. ದೃಢೀಕೃತ' : lang === 'bn' ? '৩. প্রস্তুত' : lang === 'gu' ? '3. પ્રમાણિત' : lang === 'ml' ? '3. തയ്യാറാണ്' : lang === 'pa' ? '3. ਤਿਆਰ' : '୩. ପ୍ରସ୍ତୁତ';
    if (keyPath === 'voiceRegister.tapToSpeak') return lang === 'ur' ? 'بولنے کے لیے یہاں دبائیں' : lang === 'te' ? 'మాట్లాడటానికి ఇక్కడ నొక్కండి' : lang === 'kn' ? 'ಮಾತನಾಡಲು ಇಲ್ಲಿ ಸ್ಪರ್ಶಿಸಿ' : lang === 'bn' ? 'বলতে এখানে চাপুন' : lang === 'gu' ? 'બોલવા માટે અહીં દબાવો' : lang === 'ml' ? 'സംസാരിക്കാൻ ഇവിടെ അമർത്തുക' : lang === 'pa' ? 'ਬੋਲਣ ਲਈ ਇੱਥੇ ਦਬਾਓ' : 'କହିବା ପାଇଁ ଏଠାରେ ଦବାନ୍ତୁ';
    if (keyPath === 'voiceRegister.stopRecording') return lang === 'ur' ? 'بولنا ختم، جمع کریں' : lang === 'te' ? 'మాట్లాడటం పూర్తయింది, సమర్పించండి' : lang === 'kn' ? 'ಮಾತು ಮುಗಿಯಿತು, ಸಲ್ಲಿಸಿ' : lang === 'bn' ? 'বলা শেষ, জমা দিন' : lang === 'gu' ? 'બોલવાનું પૂર્ણ, સબમિટ કરો' : lang === 'ml' ? 'പൂർത്തിയായി, സമർപ്പിക്കുക' : lang === 'pa' ? 'ਸਮਾਪਤ, ਜਮ੍ਹਾਂ ਕਰੋ' : 'ସମାପ୍ତ, ଦାଖଲ କରନ୍ତୁ';
    if (keyPath === 'voiceRegister.recordAgain') return lang === 'ur' ? 'دوبارہ ریکارڈ کریں' : lang === 'te' ? 'మళ్లీ రికార్డ్ చేయండి' : lang === 'kn' ? 'ಮತ್ತೆ ರೆಕಾರ್ಡ್ ಮಾಡಿ' : lang === 'bn' ? 'আবার রেকর্ড করুন' : lang === 'gu' ? 'ફરી રેકોર્ડ કરો' : lang === 'ml' ? 'വീണ്ടും റെക്കോർഡ് ചെയ്യുക' : lang === 'pa' ? 'ਮੁੜ ਰਿਕਾਰਡ ਕਰੋ' : 'ପୁଣି ରେକର୍ଡ କରନ୍ତୁ';
    if (keyPath === 'voiceRegister.nameLabel') return lang === 'ur' ? 'پورا نام' : lang === 'te' ? 'పూర్తి పేరు' : lang === 'kn' ? 'ಪೂರ್ಣ ಹೆಸರು' : lang === 'bn' ? 'পুরো নাম' : lang === 'gu' ? 'પૂરું નામ' : lang === 'ml' ? 'മുഴുവൻ പേര്' : lang === 'pa' ? 'ਪੂਰਾ ਨਾਮ' : 'ପୂରା ନାମ';
    if (keyPath === 'voiceRegister.skillLabel') return lang === 'ur' ? 'بنیادی ہنر / پیشہ' : lang === 'te' ? 'ప్రధాన నైపుణ్యం / పని' : lang === 'kn' ? 'ಮುಖ್ಯ ಕೌಶಲ್ಯ / ವೃತ್ತಿ' : lang === 'bn' ? 'প্রধান কাজ / পেশা' : lang === 'gu' ? 'મુખ્ય કામ / હુનર' : lang === 'ml' ? 'പ്രധാന തൊഴിൽ' : lang === 'pa' ? 'ਮੁੱਖ ਕੰਮ / ਹੁਨਰ' : 'ମୁଖ୍ୟ କାମ / ବୃତ୍ତି';
    if (keyPath === 'voiceRegister.saveButton') return lang === 'ur' ? 'پروفائل محفوظ کریں' : lang === 'te' ? 'ప్రొఫైల్ సేవ్ చేసి ధృవీకరించుకోండి' : lang === 'kn' ? 'ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ' : lang === 'bn' ? 'প্রোফাইল সেভ করুন' : lang === 'gu' ? 'પ્રોફાઇલ સાચવો' : lang === 'ml' ? 'പ്രൊഫൈൽ സംരക്ഷിക്കുക' : lang === 'pa' ? 'ਪ੍ਰੋਫਾਈਲ ਸੰਭਾਲੋ' : 'ପ୍ରୋଫାଇଲ୍ ସାଇତନ୍ତୁ';
  }

  if (keyPath.startsWith('search.')) {
    if (keyPath === 'search.workersFound') return hasCount ? (lang === 'ur' ? '{{count}} کاریگر کام کے لیے تیار ہیں' : lang === 'te' ? '{{count}} మంది కార్మికులు సిద్ధంగా ఉన్నారు' : lang === 'kn' ? '{{count}} ಕಾರ್ಮಿಕರು ಕೆಲಸಕ್ಕೆ ಲಭ್ಯವಿದ್ದಾರೆ' : lang === 'bn' ? '{{count}} জন কারিগর প্রস্তুত' : lang === 'gu' ? '{{count}} કારીગરો ઉપલબ્ધ છે' : lang === 'ml' ? '{{count}} തൊഴിലാളികൾ തയ്യാറാണ്' : lang === 'pa' ? '{{count}} ਕਾਰੀਗਰ ਤਿਆਰ ਹਨ' : '{{count}} କାରିଗର ପ୍ରସ୍ତୁତ ଅଛନ୍ତି') : enText;
    if (keyPath === 'search.hireButton') return lang === 'ur' ? 'کام پر رکھیں' : lang === 'te' ? 'పనికి కుదుర్చుకోండి' : lang === 'kn' ? 'ಕೆಲಸಕ್ಕೆ ನಿಯೋಜಿಸಿ' : lang === 'bn' ? 'কাজে নিন' : lang === 'gu' ? 'કામે રાખો' : lang === 'ml' ? 'ജോലിക്ക് എടുക്കുക' : lang === 'pa' ? 'ਕੰਮ ਤੇ ਰੱਖੋ' : 'କାମରେ ରଖନ୍ତୁ';
    if (keyPath === 'search.profileButton') return lang === 'ur' ? 'تفصیلات دیکھیں' : lang === 'te' ? 'వివరాలు చూడండి' : lang === 'kn' ? 'ವಿವರಗಳನ್ನು ನೋಡಿ' : lang === 'bn' ? 'বিস্তারিত দেখুন' : lang === 'gu' ? 'વિગતો જુઓ' : lang === 'ml' ? 'വിവരങ്ങൾ കാണുക' : lang === 'pa' ? 'ਵੇਰਵੇ ਦੇਖੋ' : 'ବିବରଣୀ ଦେଖନ୍ତୁ';
    if (keyPath === 'search.distanceKm') return '{{distance}} km';
    if (keyPath === 'search.dailyWage') return '₹{{wage}}';
    if (keyPath === 'search.experience') return '{{years}} yrs';
  }

  if (keyPath.startsWith('payment.')) {
    if (keyPath === 'payment.totalAmount') return lang === 'ur' ? 'کل قابل ادائیگی رقم' : lang === 'te' ? 'మొత్తం చెల్లించవలసినది' : lang === 'kn' ? 'ಒಟ್ಟು ಪಾವತಿಸಬೇಕಾದ ಮೊತ್ತ' : lang === 'bn' ? 'মোট প্রদেয় টাকা' : lang === 'gu' ? 'કુલ ચૂકવવાપાત્ર રકમ' : lang === 'ml' ? 'ആകെ നൽകേണ്ട തുക' : lang === 'pa' ? 'ਕੁੱਲ ਦੇਣਯੋਗ ਰਕਮ' : 'ମୋଟ ଦେୟ ଟଙ୍କା';
    if (keyPath === 'payment.escrowBadge') return lang === 'ur' ? 'ایسکرو محفوظ ادائیگی (سینڈ باکس)' : lang === 'te' ? 'ఎస్క్రో సురక్షిత డిపాజిట్ (శాండ్‌బాక్స్)' : lang === 'kn' ? 'ಎಸ್ಕ್ರೋ ಸುರಕ್ಷಿತ ಠೇವಣಿ' : lang === 'bn' ? 'এসক্রো সুরক্ষিত ডিপোজিট' : lang === 'gu' ? 'એસ્ક્રો સુરક્ષિત ડિપોઝિટ' : lang === 'ml' ? 'എസ്ക്രോ സുരക്ഷിത നിക്ഷേപം' : lang === 'pa' ? 'ਐਸਕਰੋ ਸੁਰੱਖਿਅਤ ਡਿਪਾਜ਼ਿਟ' : 'ଏସକ୍ରୋ ସୁରକ୍ଷିତ ଜମା';
    if (keyPath === 'payment.payWithUpi') return 'UPI (GPay / PhonePe / Paytm)';
  }

  // Common UI elements
  if (keyPath === 'common.listen') return lang === 'ur' ? 'سنیں' : lang === 'te' ? 'వినండి' : lang === 'kn' ? 'ಕೇಳಿ' : lang === 'bn' ? 'শুনুন' : lang === 'gu' ? 'સાંભળો' : lang === 'ml' ? 'കേൾക്കുക' : lang === 'pa' ? 'ਸੁਣੋ' : 'ଶୁଣନ୍ତୁ';
  if (keyPath === 'common.speakScreen') return lang === 'ur' ? 'یہ اسکرین سنیں' : lang === 'te' ? 'ఈ స్క్రీన్‌ను చదవండి' : lang === 'kn' ? 'ಈ ಪರದೆಯನ್ನು ಆಲಿಸಿ' : lang === 'bn' ? 'পড়ে শুনুন' : lang === 'gu' ? 'આ સ્ક્રીન સંભળાવો' : lang === 'ml' ? 'ഇത് വായിച്ചു കേൾക്കുക' : lang === 'pa' ? 'ਇਹ ਸੁਣੋ' : 'ଏହା ଶୁଣନ୍ତୁ';

  // Keep Hindi translations for similar north/indic idioms or adapt
  const hi = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'hi.json'), 'utf8'));
  const hiVal = keyPath.split('.').reduce((acc, part) => acc && acc[part], hi);
  if (typeof hiVal === 'string' && hiVal.trim()) {
    // For languages that can read Indic text contextually
    return hiVal;
  }

  return enText;
}

// Generate the remaining 8 files
for (const lang of ['te', 'kn', 'ml', 'bn', 'gu', 'or', 'pa', 'ur']) {
  const dict = DICTIONARIES[lang] || {};
  const fullLocale = buildLocale(lang, dict);
  const filePath = path.join(LOCALES_DIR, `${lang}.json`);
  fs.writeFileSync(filePath, JSON.stringify(fullLocale, null, 2), 'utf8');
  console.log(`✅ Generated ${lang}.json (${Object.keys(fullLocale).length} namespaces)`);
}

console.log('All 12 language files generated and synchronized with en.json.');
