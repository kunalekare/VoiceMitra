import { execSync } from 'child_process';

console.log('🔄 Regenerating all 12 localized dictionaries with verified native scripts...');
try {
  execSync('node scripts/create_locales_hi.js', { stdio: 'inherit' });
  execSync('node scripts/create_locales_mr_ta.js', { stdio: 'inherit' });
  execSync('node scripts/create_locales_south.js', { stdio: 'inherit' });
  execSync('node scripts/create_locales_bn_gu.js', { stdio: 'inherit' });
  execSync('node scripts/create_locales_or_pa_ur.js', { stdio: 'inherit' });
  execSync('node scripts/check_i18n.js', { stdio: 'inherit' });
  console.log('✅ All 12 languages generated and verified with 100% key parity!');
} catch (err) {
  console.error('❌ Locale generation failed:', err);
  process.exit(1);
}
