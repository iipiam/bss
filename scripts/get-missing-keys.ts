import { translations } from '../client/src/i18n/translations';

// Get all keys from English (the reference)
const englishKeys = Object.keys(translations.English).sort();
const chineseKeys = Object.keys(translations.Chinese).sort();

// Get missing keys
const missingKeys = englishKeys.filter(key => !(key in translations.Chinese));

console.log(`Missing ${missingKeys.length} keys:\n`);
missingKeys.forEach((key, index) => {
  const value = translations.English[key as keyof typeof translations.English];
  console.log(`${index + 1}. ${key}: "${value}"`);
});
