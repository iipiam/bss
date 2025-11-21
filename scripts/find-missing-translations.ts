import { translations, type Language } from '../client/src/i18n/translations';

const languages: Language[] = ['English', 'Arabic', 'Chinese', 'German', 'Hindi', 'Urdu', 'Bengali', 'Italian', 'Spanish', 'Tagalog'];

// Get all keys from English (the reference)
const englishKeys = Object.keys(translations.English).sort();

console.log(`Total English keys: ${englishKeys.length}\n`);

// Check each language
for (const lang of languages) {
  if (lang === 'English') continue;
  
  const langKeys = Object.keys(translations[lang]).sort();
  const missingKeys = englishKeys.filter(key => !(key in translations[lang]));
  
  console.log(`${lang}:`);
  console.log(`  Total keys: ${langKeys.length}`);
  console.log(`  Missing keys: ${missingKeys.length}`);
  
  if (missingKeys.length > 0 && missingKeys.length <= 20) {
    console.log(`  Missing: ${missingKeys.join(', ')}`);
  } else if (missingKeys.length > 20) {
    console.log(`  First 20 missing: ${missingKeys.slice(0, 20).join(', ')}...`);
  }
  console.log('');
}
