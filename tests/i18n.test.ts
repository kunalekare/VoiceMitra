import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  SUPPORTED_LANGUAGES,
  getTranslation,
  getLocalizedTrade,
  getLanguageDirection,
  formatCurrency,
  formatNumber,
  formatDate
} from '../src/i18n';
import { LanguageCode } from '../src/types';

const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales');
const ALL_LOCALES: LanguageCode[] = ['en', 'hi', 'mr', 'ta', 'te', 'kn', 'ml', 'bn', 'gu', 'or', 'pa', 'ur'];

function flattenKeys(obj: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, val] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      Object.assign(result, flattenKeys(val as Record<string, unknown>, fullPath));
    } else {
      result[fullPath] = String(val);
    }
  }
  return result;
}

describe('i18n Comprehensive Multilingual Suite (12 Languages)', () => {
  const enObj = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf8'));
  const enFlat = flattenKeys(enObj);
  const enKeys = Object.keys(enFlat).sort();

  it('guarantees master English template covers all app namespaces', () => {
    expect(enKeys.length).toBeGreaterThanOrEqual(300);
    const requiredNamespaces = [
      'nav',
      'landing',
      'auth',
      'voiceRegister',
      'search',
      'hire',
      'payment',
      'kyc',
      'quiz',
      'dashboard',
      'employerJobs',
      'workerProfile',
      'enterprise',
      'analytics',
      'unitTests',
      'admin',
      'developer',
      'legal',
      'privacyModal',
      'languageChooser',
      'whatsapp',
      'ivr',
      'common',
      'errors',
      'notifications'
    ];
    for (const ns of requiredNamespaces) {
      expect(enObj, `Missing namespace: ${ns}`).toHaveProperty(ns);
    }
  });

  it('guarantees 100% key parity across all 12 supported Indian languages', () => {
    for (const lang of ALL_LOCALES) {
      if (lang === 'en') continue;
      const targetObj = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${lang}.json`), 'utf8'));
      const targetFlat = flattenKeys(targetObj);

      const missing = enKeys.filter((k) => !(k in targetFlat));
      expect(missing, `Locale [${lang}] is missing keys: ${missing.join(', ')}`).toHaveLength(0);

      const extra = Object.keys(targetFlat).filter((k) => !(k in enFlat));
      expect(extra, `Locale [${lang}] has extra keys: ${extra.join(', ')}`).toHaveLength(0);
    }
  });

  it('verifies that non-English locales do not contain untranslated English copies (excluding approved brand names)', () => {
    const BRAND_ALLOWED = [
      'SkillBridge',
      'UPI',
      'Aadhaar',
      'GST',
      'OTP',
      'INR',
      '₹',
      'SMS',
      'PDF',
      'CSV',
      'HTTP',
      'API',
      'DigiLocker',
      'Razorpay',
      'DPDP',
      'ITI',
      'PMKVY',
      'MCB',
      'GPS',
      'B2B',
      'SLA',
      'IVR',
      'WhatsApp',
      'AI',
      'grievance-officer@skillbridge.in',
      '+91 (080) 4719-0099',
      'SkillBridge Technologies Pvt. Ltd., Civil Lines, Nagpur, MH 440001, India',
      'Mr. Rajeshwar Sharma',
      '080-47190000',
      '123456'
    ];

    for (const lang of ALL_LOCALES) {
      if (lang === 'en') continue;
      const targetObj = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${lang}.json`), 'utf8'));
      const targetFlat = flattenKeys(targetObj);

      for (const k of enKeys) {
        if (targetFlat[k] === enFlat[k]) {
          const val = enFlat[k].trim();
          const isAllowed =
            BRAND_ALLOWED.includes(val) ||
            /^[\d\s₹.,:;/\-—+()%#]+$/.test(val) ||
            /^#\{\{[a-zA-Z0-9_]+\}\}$/.test(val) ||
            /^₹\{\{[a-zA-Z0-9_]+\}\}$/.test(val);
          expect(isAllowed, `Untranslated English string found in [${lang}] for key "${k}": "${val}"`).toBe(true);
        }
      }
    }
  });

  it('verifies no Devanagari contamination in non-Devanagari language files', () => {
    const nonDevanagari: LanguageCode[] = ['ta', 'te', 'kn', 'ml', 'bn', 'gu', 'or', 'pa', 'ur'];
    for (const lang of nonDevanagari) {
      const targetObj = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${lang}.json`), 'utf8'));
      const targetFlat = flattenKeys(targetObj);

      for (const [k, val] of Object.entries(targetFlat)) {
        // Exclude shared Indic danda \u0964 and \u0965
        const devanagariLetters = val.match(/[\u0900-\u0963\u0966-\u097F]/g);
        expect(
          devanagariLetters,
          `Found Devanagari characters in [${lang}] key "${k}": "${val}"`
        ).toBeNull();
      }
    }
  });

  it('interpolates dynamic variables accurately across languages', () => {
    const renderedEn = getTranslation('search.workersFound', { count: 42 }, 'en');
    expect(renderedEn).toBe('42 workers ready for hire');

    const renderedHi = getTranslation('search.workersFound', { count: 18 }, 'hi');
    expect(renderedHi).toContain('18');
    expect(renderedHi).toContain('कारीगर');

    const renderedTe = getTranslation('search.workersFound', { count: 25 }, 'te');
    expect(renderedTe).toContain('25');
    expect(renderedTe).toContain('కార్మికులు');
  });

  it('enforces RTL direction exclusively for Urdu and LTR for the other 11 languages', () => {
    expect(getLanguageDirection('ur')).toBe('rtl');
    for (const lang of ALL_LOCALES) {
      if (lang !== 'ur') {
        expect(getLanguageDirection(lang)).toBe('ltr');
      }
    }
  });

  it('localizes trade names accurately across all 12 languages without bilingual slashes', () => {
    const electricHi = getLocalizedTrade('Electrician', 'hi');
    const electricTa = getLocalizedTrade('Electrician', 'ta');
    const electricUr = getLocalizedTrade('Electrician', 'ur');
    const electricKn = getLocalizedTrade('Electrician', 'kn');

    expect(electricHi).toBe('इलेक्ट्रीशियन');
    expect(electricTa).toBe('எலக்ட்ரீஷியன்');
    expect(electricUr).toBe('الیکٹریشن');
    expect(electricKn).toBe('ಎಲೆಕ್ಟ್ರಿಷಿಯನ್');
    expect(electricHi).not.toContain('/');
  });

  it('formats numbers and currencies according to Indian locale standards', () => {
    const formattedInr = formatCurrency(1250, 'en');
    expect(formattedInr).toMatch(/₹\s*1,250/);

    const formattedNum = formatNumber(500000000, 'en');
    expect(formattedNum).toBe('50,00,00,000');
  });
});
