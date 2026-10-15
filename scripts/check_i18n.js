import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales');
const ALL_LOCALES = ['en', 'hi', 'mr', 'ta', 'te', 'kn', 'ml', 'bn', 'gu', 'or', 'pa', 'ur'];

function flattenKeys(obj, prefix = '') {
  let result = {};
  for (const [key, val] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      Object.assign(result, flattenKeys(val, fullPath));
    } else {
      result[fullPath] = String(val);
    }
  }
  return result;
}

const enPath = path.join(LOCALES_DIR, 'en.json');
if (!fs.existsSync(enPath)) {
  console.error('❌ Missing master locale file: src/i18n/locales/en.json');
  process.exit(1);
}

const enObj = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const enFlat = flattenKeys(enObj);
const enKeys = Object.keys(enFlat).sort();

console.log(`🔍 Checking i18n key parity against English source of truth (${enKeys.length} total keys)...`);

let hasErrors = false;

for (const lang of ALL_LOCALES) {
  if (lang === 'en') continue;

  const targetPath = path.join(LOCALES_DIR, `${lang}.json`);
  if (!fs.existsSync(targetPath)) {
    console.error(`❌ Missing locale file: ${lang}.json`);
    hasErrors = true;
    continue;
  }

  const targetObj = JSON.parse(fs.readFileSync(targetPath, 'utf8'));
  const targetFlat = flattenKeys(targetObj);
  const targetKeys = Object.keys(targetFlat).sort();

  // Check missing keys
  const missing = enKeys.filter(k => !(k in targetFlat));
  if (missing.length > 0) {
    console.error(`❌ [${lang}] Missing ${missing.length} keys:`);
    missing.slice(0, 10).forEach(k => console.error(`   - ${k}`));
    if (missing.length > 10) console.error(`   ... and ${missing.length - 10} more`);
    hasErrors = true;
  }

  // Check extra keys
  const extra = targetKeys.filter(k => !(k in enFlat));
  if (extra.length > 0) {
    console.warn(`⚠️ [${lang}] Extra ${extra.length} keys not in en.json:`);
    extra.slice(0, 5).forEach(k => console.warn(`   - ${k}`));
  }

  // Check placeholder variables like {{count}}, {{wage}}
  for (const k of enKeys) {
    if (k in targetFlat) {
      const enMatches = enFlat[k].match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];
      const targetMatches = targetFlat[k].match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];

      const enVars = enMatches.sort().join(',');
      const targetVars = targetMatches.sort().join(',');

      if (enVars !== targetVars) {
        console.warn(`⚠️ [${lang}] Variable placeholder mismatch in "${k}": expected [${enVars}], got [${targetVars}]`);
      }
    }
  }

  if (missing.length === 0) {
    console.log(`✅ [${lang}] Passed key parity check (${targetKeys.length}/${enKeys.length} keys present)`);
  }
}

if (hasErrors) {
  console.error('\n❌ i18n parity check failed.');
  process.exit(1);
} else {
  console.log('\n🎉 All 12 language files have 100% key parity with en.json!');
  process.exit(0);
}
