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

console.log(`🔍 Checking i18n key parity and linguistic purity against English master (${enKeys.length} total keys)...`);

let hasErrors = false;

// Allowed unlocalized brand terms, protocols, currencies and emails
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
  const missing = enKeys.filter((k) => !(k in targetFlat));
  if (missing.length > 0) {
    console.error(`❌ [${lang}] Missing ${missing.length} keys:`);
    missing.slice(0, 10).forEach((k) => console.error(`   - ${k}`));
    hasErrors = true;
  }

  // Check extra keys
  const extra = targetKeys.filter((k) => !(k in enFlat));
  if (extra.length > 0) {
    console.error(`❌ [${lang}] Extra ${extra.length} keys not in en.json:`);
    extra.slice(0, 5).forEach((k) => console.error(`   - ${k}`));
    hasErrors = true;
  }

  // Check placeholder variables like {{count}}, {{wage}}
  for (const k of enKeys) {
    if (k in targetFlat) {
      const enMatches = enFlat[k].match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];
      const targetMatches = targetFlat[k].match(/\{\{([a-zA-Z0-9_]+)\}\}/g) || [];

      const enVars = enMatches.sort().join(',');
      const targetVars = targetMatches.sort().join(',');

      if (enVars !== targetVars) {
        console.error(
          `❌ [${lang}] Variable placeholder mismatch in "${k}": expected [${enVars}], got [${targetVars}]`
        );
        hasErrors = true;
      }

      // Check untranslated English copies
      if (targetFlat[k] === enFlat[k]) {
        const val = enFlat[k].trim();
        const isAllowed =
          BRAND_ALLOWED.includes(val) ||
          /^[\d\s₹.,:;/\-—+()%#]+$/.test(val) ||
          /^#\{\{[a-zA-Z0-9_]+\}\}$/.test(val) ||
          /^₹\{\{[a-zA-Z0-9_]+\}\}$/.test(val);
        if (!isAllowed) {
          console.error(`❌ [${lang}] Untranslated English copy found in key "${k}": "${val}"`);
          hasErrors = true;
        }
      }
    }
  }

  // Check Devanagari letters leakage in non-Devanagari languages (excluding shared Indic danda \u0964 and \u0965)
  if (!['hi', 'mr'].includes(lang)) {
    let devanagariCount = 0;
    for (const [k, val] of Object.entries(targetFlat)) {
      if (/[\u0900-\u0963\u0966-\u097F]/.test(val)) {
        devanagariCount++;
        if (devanagariCount <= 3) {
          console.error(`❌ [${lang}] Devanagari letter contamination in "${k}": "${val}"`);
        }
      }
    }
    if (devanagariCount > 0) {
      console.error(`❌ [${lang}] Total ${devanagariCount} keys contaminated with Devanagari script!`);
      hasErrors = true;
    }
  }

  if (!hasErrors) {
    console.log(`✅ [${lang}] Passed key parity & script purity (${targetKeys.length}/${enKeys.length} keys)`);
  }
}

if (hasErrors) {
  console.error('\n❌ i18n parity check failed.');
  process.exit(1);
} else {
  console.log('\n🎉 All 12 language files have 100% key parity and verified native script purity!');
  process.exit(0);
}
