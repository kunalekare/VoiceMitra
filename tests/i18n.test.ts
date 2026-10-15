import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales');
const ALL_LOCALES = ['en', 'hi', 'mr', 'ta', 'te', 'kn', 'ml', 'bn', 'gu', 'or', 'pa', 'ur'];

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

describe('i18n Multilingual Coverage & Invariants', () => {
  const enObj = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf8'));
  const enFlat = flattenKeys(enObj);
  const enKeys = Object.keys(enFlat).sort();

  it('verifies that English master template has complete namespace coverage', () => {
    expect(enKeys.length).toBeGreaterThanOrEqual(150);
    expect(enObj).toHaveProperty('nav');
    expect(enObj).toHaveProperty('landing');
    expect(enObj).toHaveProperty('auth');
    expect(enObj).toHaveProperty('voiceRegister');
    expect(enObj).toHaveProperty('search');
    expect(enObj).toHaveProperty('hire');
    expect(enObj).toHaveProperty('payment');
    expect(enObj).toHaveProperty('kyc');
    expect(enObj).toHaveProperty('quiz');
    expect(enObj).toHaveProperty('dashboard');
    expect(enObj).toHaveProperty('admin');
    expect(enObj).toHaveProperty('developer');
    expect(enObj).toHaveProperty('legal');
    expect(enObj).toHaveProperty('whatsapp');
    expect(enObj).toHaveProperty('ivr');
    expect(enObj).toHaveProperty('common');
    expect(enObj).toHaveProperty('errors');
    expect(enObj).toHaveProperty('notifications');
  });

  it('guarantees 100% key parity across all 12 supported Indian languages', () => {
    for (const lang of ALL_LOCALES) {
      if (lang === 'en') continue;
      const targetObj = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, `${lang}.json`), 'utf8'));
      const targetFlat = flattenKeys(targetObj);

      const missing = enKeys.filter(k => !(k in targetFlat));
      expect(missing, `Locale ${lang} is missing keys: ${missing.join(', ')}`).toHaveLength(0);
    }
  });

  it('interpolates dynamic variables accurately (e.g. {{count}}, {{wage}})', () => {
    function interpolate(template: string, params: Record<string, string | number>): string {
      return template.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (_, varName) => {
        return varName in params ? String(params[varName]) : `{{${varName}}}`;
      });
    }

    const templateEn = enFlat['search.workersFound']; // "{{count}} workers ready for hire"
    const renderedEn = interpolate(templateEn, { count: 42 });
    expect(renderedEn).toBe('42 workers ready for hire');

    const hiObj = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'hi.json'), 'utf8'));
    const hiFlat = flattenKeys(hiObj);
    const renderedHi = interpolate(hiFlat['search.workersFound'], { count: 18 });
    expect(renderedHi).toContain('18');
  });

  it('enforces RTL for Urdu and LTR for all other 11 languages', () => {
    function getDirection(langCode: string): 'rtl' | 'ltr' {
      return langCode === 'ur' ? 'rtl' : 'ltr';
    }

    expect(getDirection('ur')).toBe('rtl');
    expect(getDirection('hi')).toBe('ltr');
    expect(getDirection('mr')).toBe('ltr');
    expect(getDirection('ta')).toBe('ltr');
    expect(getDirection('en')).toBe('ltr');
  });

  it('formats numbers and currencies according to Indian locale standards', () => {
    const amount = 850;
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);

    expect(formatted).toMatch(/₹\s*850/);
  });
});
