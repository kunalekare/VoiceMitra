import { LanguageCode } from '../types';
import { useAppStore } from '../store';
import { useCallback } from 'react';

// Import all 12 locale files
import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import kn from './locales/kn.json';
import ml from './locales/ml.json';
import bn from './locales/bn.json';
import gu from './locales/gu.json';
import or from './locales/or.json';
import pa from './locales/pa.json';
import ur from './locales/ur.json';

export interface LanguageOption {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
  voiceLangCode: string;
  scriptFont: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', voiceLangCode: 'hi-IN', scriptFont: 'Noto Sans Devanagari' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🚩', voiceLangCode: 'mr-IN', scriptFont: 'Noto Sans Devanagari' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🏛️', voiceLangCode: 'ta-IN', scriptFont: 'Noto Sans Tamil' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🌾', voiceLangCode: 'te-IN', scriptFont: 'Noto Sans Telugu' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🪔', voiceLangCode: 'kn-IN', scriptFont: 'Noto Sans Kannada' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🌴', voiceLangCode: 'ml-IN', scriptFont: 'Noto Sans Malayalam' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🐯', voiceLangCode: 'bn-IN', scriptFont: 'Noto Sans Bengali' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🪁', voiceLangCode: 'gu-IN', scriptFont: 'Noto Sans Gujarati' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🛕', voiceLangCode: 'or-IN', scriptFont: 'Noto Sans Oriya' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🌾', voiceLangCode: 'pa-IN', scriptFont: 'Noto Sans Gurmukhi' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🌙', voiceLangCode: 'ur-IN', scriptFont: 'Noto Nastaliq Urdu' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🌐', voiceLangCode: 'en-IN', scriptFont: 'Plus Jakarta Sans' }
];

export const LOCALES: Record<LanguageCode, Record<string, unknown>> = {
  en: en as Record<string, unknown>,
  hi: hi as Record<string, unknown>,
  mr: mr as Record<string, unknown>,
  ta: ta as Record<string, unknown>,
  te: te as Record<string, unknown>,
  kn: kn as Record<string, unknown>,
  ml: ml as Record<string, unknown>,
  bn: bn as Record<string, unknown>,
  gu: gu as Record<string, unknown>,
  or: or as Record<string, unknown>,
  pa: pa as Record<string, unknown>,
  ur: ur as Record<string, unknown>
};

// Trade Name Localization Map for all 12 languages (single pure native terms, no bilingual slashes)
export const TRADE_LOCALIZATIONS: Record<LanguageCode, Record<string, string>> = {
  en: {
    Electrician: 'Electrician',
    Plumber: 'Plumber',
    Mason: 'Mason',
    Painter: 'Painter',
    Carpenter: 'Carpenter',
    Welder: 'Welder',
    Driver: 'Driver',
    'Domestic Help': 'Domestic Help',
    'AC Technician': 'AC Technician',
    'Tile & Marble Setter': 'Tile & Marble Setter',
    Gardener: 'Gardener',
    'Appliance Repair': 'Appliance Repair'
  },
  hi: {
    Electrician: 'इलेक्ट्रीशियन',
    Plumber: 'नलसाज',
    Mason: 'राजमिस्त्री',
    Painter: 'पेंटर',
    Carpenter: 'बढ़ई',
    Welder: 'वेल्डर',
    Driver: 'वाहन चालक',
    'Domestic Help': 'घरेलू सहायक',
    'AC Technician': 'एसी मैकेनिक',
    'Tile & Marble Setter': 'टाइल व मार्बल कारीगर',
    Gardener: 'माली',
    'Appliance Repair': 'उपकरण मरम्मत कारीगर'
  },
  mr: {
    Electrician: 'इलेक्ट्रिशियन',
    Plumber: 'नळ कामगार',
    Mason: 'गवंडी',
    Painter: 'रंगारी',
    Carpenter: 'सुतार',
    Welder: 'वेल्डर',
    Driver: 'चालक',
    'Domestic Help': 'घरकाम मदतनीस',
    'AC Technician': 'एसी तंत्रज्ञ',
    'Tile & Marble Setter': 'फरशी कारागीर',
    Gardener: 'माळी',
    'Appliance Repair': 'उपकरणे दुरुस्ती कारागीर'
  },
  ta: {
    Electrician: 'எலக்ட்ரீஷியன்',
    Plumber: 'குழாய் பணியாளர்',
    Mason: 'கொத்தனார்',
    Painter: 'பெயிண்டர்',
    Carpenter: 'தச்சர்',
    Welder: 'வெல்டர்',
    Driver: 'ஓட்டுநர்',
    'Domestic Help': 'வீட்டு உதவியாளர்',
    'AC Technician': 'ஏசி மெக்கானிக்',
    'Tile & Marble Setter': 'டைல்ஸ் பதிப்பவர்',
    Gardener: 'தோட்டக்காரர்',
    'Appliance Repair': 'பழுதுநீக்குநர்'
  },
  te: {
    Electrician: 'ఎలక్ట్రీషియన్',
    Plumber: 'పైప్ ఫిట్టర్',
    Mason: 'తాపీ మేస్త్రీ',
    Painter: 'పెయింటర్',
    Carpenter: 'వడ్రంగి',
    Welder: 'వెల్డర్',
    Driver: 'డ్రైవర్',
    'Domestic Help': 'ఇంటి సహాయకుడు',
    'AC Technician': 'ఏసీ టెక్నీషియన్',
    'Tile & Marble Setter': 'టైల్స్ మేస్త్రీ',
    Gardener: 'తోటమాలి',
    'Appliance Repair': 'మరమ్మతు నిపుణుడు'
  },
  kn: {
    Electrician: 'ಎಲೆಕ್ಟ್ರಿಷಿಯನ್',
    Plumber: 'ಕೊಳವೆ ಕೆಲಸಗಾರ',
    Mason: 'ಮೇಸ್ತ್ರಿ',
    Painter: 'ಪೇಂಟರ್',
    Carpenter: 'ಬಡಗಿ',
    Welder: 'ವೆಲ್ಡರ್',
    Driver: 'ಚಾಲಕ',
    'Domestic Help': 'ಮನೆಗೆಲಸ ಸಹಾಯಕ',
    'AC Technician': 'ಎಸಿ ತಂತ್ರಜ್ಞ',
    'Tile & Marble Setter': 'ಟೈಲ್ಸ್ ಕೆಲಸಗಾರ',
    Gardener: 'ತೋಟಗಾರ',
    'Appliance Repair': 'ಉಪಕರಣ ದುರಸ್ತಿ'
  },
  ml: {
    Electrician: 'ഇലക്ട്രീഷ്യൻ',
    Plumber: 'പ്ലംബർ',
    Mason: 'മേസ്തിരി',
    Painter: 'പെയിന്റർ',
    Carpenter: 'ആശാരി',
    Welder: 'വെൽഡർ',
    Driver: 'ഡ്രൈവർ',
    'Domestic Help': 'വീട്ടുസഹായി',
    'AC Technician': 'എസി മെക്കാനിക്',
    'Tile & Marble Setter': 'ടൈൽ പണിക്കാരൻ',
    Gardener: 'തോട്ടക്കാരൻ',
    'Appliance Repair': 'ഉപകരണ റിപ്പയർ'
  },
  bn: {
    Electrician: 'ইলেকট্রিশিয়ান',
    Plumber: 'প্লাম্বার',
    Mason: 'রাজমিস্ত্রি',
    Painter: 'পেইন্টার',
    Carpenter: 'কাঠমিস্ত্রি',
    Welder: 'ওয়েল্ডার',
    Driver: 'ড্রাইভার',
    'Domestic Help': 'গৃহসহায়িকা',
    'AC Technician': 'এসি মেকানিক',
    'Tile & Marble Setter': 'টাইলস মিস্ত্রি',
    Gardener: 'মালী',
    'Appliance Repair': 'যন্ত্রপাতি মেরামত'
  },
  gu: {
    Electrician: 'ઇલેક્ટ્રિશિયન',
    Plumber: 'પ્લમ્બર',
    Mason: 'કડિયો',
    Painter: 'કલરકામ કારીગર',
    Carpenter: 'સુથાર',
    Welder: 'વેલ્ડર',
    Driver: 'ડ્રાઈવર',
    'Domestic Help': 'ઘરકામ સહાયક',
    'AC Technician': 'એસી મિકેનિક',
    'Tile & Marble Setter': 'ટાઇલ્સ કારીગર',
    Gardener: 'માળી',
    'Appliance Repair': 'સાધન સમારકામ કારીગર'
  },
  or: {
    Electrician: 'ଇଲେକ୍ଟ୍ରିସିଆନ୍',
    Plumber: 'ପ୍ଲମ୍ବର',
    Mason: 'ରାଜମିସ୍ତ୍ରୀ',
    Painter: 'ପେଣ୍ଟର',
    Carpenter: 'ବଢ଼େଇ',
    Welder: 'ୱେଲ୍ଡର',
    Driver: 'ଡ୍ରାଇଭର',
    'Domestic Help': 'ଘରୋଇ ସହାୟକ',
    'AC Technician': 'ଏସି ମେକାନିକ',
    'Tile & Marble Setter': 'ଟାଇଲ୍ସ କାରିଗର',
    Gardener: 'ମାଳୀ',
    'Appliance Repair': 'ଉପକରଣ ମରାମତି'
  },
  pa: {
    Electrician: 'ਇਲੈਕਟ੍ਰੀਸ਼ੀਅਨ',
    Plumber: 'ਪਲੰਬਰ',
    Mason: 'ਰਾਜਮਿਸਤਰੀ',
    Painter: 'ਪੇਂਟਰ',
    Carpenter: 'ਤਰਖਾਣ',
    Welder: 'ਵੈਲਡਰ',
    Driver: 'ਡਰਾਈਵਰ',
    'Domestic Help': 'ਘਰੇਲੂ ਸਹਾਇਕ',
    'AC Technician': 'ਏਸੀ ਮਕੈਨਿਕ',
    'Tile & Marble Setter': 'ਟਾਈਲ ਮਿਸਤਰੀ',
    Gardener: 'ਮਾਲੀ',
    'Appliance Repair': 'ਉਪਕਰਣ ਮੁਰੰਮਤ'
  },
  ur: {
    Electrician: 'الیکٹریشن',
    Plumber: 'پلمبر',
    Mason: 'راج مستری',
    Painter: 'پینٹر',
    Carpenter: 'بڑھئی',
    Welder: 'ویلڈر',
    Driver: 'ڈرائیور',
    'Domestic Help': 'گھریلو مددگار',
    'AC Technician': 'اے سی ٹیکنیشن',
    'Tile & Marble Setter': 'ٹائل مستری',
    Gardener: 'مالی',
    'Appliance Repair': 'آلات کی مرمت'
  }
};

export function getLocalizedTrade(tradeName: string, lang: LanguageCode = 'hi'): string {
  const dict = TRADE_LOCALIZATIONS[lang] || TRADE_LOCALIZATIONS.en;
  return dict[tradeName] || tradeName;
}

// Direction helper: RTL for Urdu, LTR for the other 11
export function getLanguageDirection(lang: LanguageCode): 'rtl' | 'ltr' {
  return lang === 'ur' ? 'rtl' : 'ltr';
}

// Apply lang & dir to documentElement for full-browser accessibility
export function applyDocumentLanguage(lang: LanguageCode): void {
  if (typeof document === 'undefined') return;
  const config = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];
  document.documentElement.lang = config.voiceLangCode;
  document.documentElement.dir = getLanguageDirection(lang);
}

// Resolve nested dot-separated keys, with interpolation and English fallback
export function getTranslation(
  keyPath: string,
  params?: Record<string, string | number>,
  lang: LanguageCode = 'en'
): string {
  const resolve = (localeObj: Record<string, unknown>, pathStr: string): string | undefined => {
    const parts = pathStr.split('.');
    let current: unknown = localeObj;
    for (const part of parts) {
      if (current === undefined || current === null || typeof current !== 'object') {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }
    return typeof current === 'string' ? current : undefined;
  };

  const targetLocale = LOCALES[lang] || LOCALES.en;
  let text = resolve(targetLocale, keyPath);

  // Fallback to English if missing or not translated
  if (!text) {
    text = resolve(LOCALES.en, keyPath);
    if (!text) {
      const flatTarget = targetLocale as Record<string, string>;
      const flatEn = LOCALES.en as Record<string, string>;
      text = flatTarget[keyPath] || flatEn[keyPath] || keyPath;
    }
  }

  // Interpolate {{param}} placeholders
  if (params && typeof text === 'string') {
    text = text.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, varName) => {
      return varName in params ? String(params[varName]) : `{{${varName}}}`;
    });
  }

  return text || keyPath;
}

// Export shorthand t function
export const t = getTranslation;

// Locale-aware formatting functions using Intl
export function formatCurrency(amount: number, lang: LanguageCode = 'en'): string {
  const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];
  try {
    return new Intl.NumberFormat(langConfig.voiceLangCode, {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    return `₹${amount.toLocaleString('en-IN')}`;
  }
}

export function formatNumber(num: number, lang: LanguageCode = 'en'): string {
  const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];
  try {
    return new Intl.NumberFormat(langConfig.voiceLangCode).format(num);
  } catch {
    return num.toLocaleString('en-IN');
  }
}

export function formatDate(dateStr: string | Date, lang: LanguageCode = 'en'): string {
  const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];
  try {
    const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return new Intl.DateTimeFormat(langConfig.voiceLangCode, {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(d);
  } catch {
    return String(dateStr);
  }
}

// React Hook for component state integration
export function useTranslation() {
  const currentLang = useAppStore((state) => state.currentLang);

  const translate = useCallback(
    (keyPath: string, params?: Record<string, string | number>) => {
      return getTranslation(keyPath, params, currentLang);
    },
    [currentLang]
  );

  const localizedTrade = useCallback(
    (trade: string) => {
      return getLocalizedTrade(trade, currentLang);
    },
    [currentLang]
  );

  const localizedCurrency = useCallback(
    (amount: number) => {
      return formatCurrency(amount, currentLang);
    },
    [currentLang]
  );

  const localizedNumber = useCallback(
    (num: number) => {
      return formatNumber(num, currentLang);
    },
    [currentLang]
  );

  const localizedDate = useCallback(
    (d: string | Date) => {
      return formatDate(d, currentLang);
    },
    [currentLang]
  );

  return {
    t: translate,
    currentLang,
    getLocalizedTrade: localizedTrade,
    formatCurrency: localizedCurrency,
    formatNumber: localizedNumber,
    formatDate: localizedDate,
    isRTL: currentLang === 'ur'
  };
}

// Text-To-Speech helper with voice selection
export function speakVernacular(text: string, lang: LanguageCode = 'hi'): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const langConfig = SUPPORTED_LANGUAGES.find((l) => l.code === lang) || SUPPORTED_LANGUAGES[0];
      utterance.lang = langConfig.voiceLangCode;
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const matchingVoice = voices.find(
        (v) => v.lang.startsWith(langConfig.code) || v.lang === langConfig.voiceLangCode
      );
      if (matchingVoice) {
        utterance.voice = matchingVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    } catch {
      resolve();
    }
  });
}
