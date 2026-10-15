import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales');

const en = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf8'));

// Helper to deep traverse and apply translation dictionaries
export function buildLanguage(langCode, dict) {
  function traverse(enObj, langObj, currentPath = '') {
    const out = {};
    for (const key of Object.keys(enObj)) {
      const p = currentPath ? `${currentPath}.${key}` : key;
      const enVal = enObj[key];
      const langVal = langObj ? langObj[key] : undefined;

      if (typeof enVal === 'object' && enVal !== null && !Array.isArray(enVal)) {
        out[key] = traverse(enVal, langVal || {}, p);
      } else {
        if (typeof langVal === 'string' && langVal.trim()) {
          out[key] = langVal;
        } else {
          throw new Error(`Missing translation for [${langCode}]: ${p}`);
        }
      }
    }
    return out;
  }
  return traverse(en, dict);
}
