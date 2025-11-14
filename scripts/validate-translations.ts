#!/usr/bin/env tsx
// One-off script to clean Italian, Spanish, and Tagalog translations
// to only include keys that exist in the English (canonical) translations

import { translations } from '../client/src/i18n/translations';

const validKeys = new Set(Object.keys(translations.English));

const languagesToClean: Array<'Italian' | 'Spanish' | 'Tagalog'> = [
  'Italian',
  'Spanish',
  'Tagalog'
];

console.log(`\n=== Translation Validation & Cleanup ===`);
console.log(`Valid keys from English: ${validKeys.size}`);

for (const lang of languagesToClean) {
  console.log(`\n--- Cleaning ${lang} ---`);
  
  const original = translations[lang];
  const originalKeys = Object.keys(original);
  const cleaned: any = {};
  const droppedKeys: string[] = [];
  
  for (const key of originalKeys) {
    if (validKeys.has(key)) {
      cleaned[key] = original[key as keyof typeof original];
    } else {
      droppedKeys.push(key);
    }
  }
  
  const cleanedKeys = Object.keys(cleaned);
  const missingKeys = Array.from(validKeys).filter(k => !cleanedKeys.includes(k));
  
  console.log(`Original keys: ${originalKeys.length}`);
  console.log(`Cleaned keys: ${cleanedKeys.length}`);
  console.log(`Dropped keys: ${droppedKeys.length}`);
  console.log(`Missing keys: ${missingKeys.length}`);
  
  if (droppedKeys.length > 0) {
    console.log(`\nDropped keys (first 20):`);
    console.log(droppedKeys.slice(0, 20).join(', '));
  }
  
  if (missingKeys.length > 0) {
    console.log(`\nMissing keys (first 20):`);
    console.log(missingKeys.slice(0, 20).join(', '));
  }
  
  // Verify signup-critical keys are present
  const signupKeys = [
    'passwordsDontMatch',
    'passwordsDontMatchDesc',
    'passwordTooShort',
    'passwordTooShortDesc',
    'failedToCreateAdminAccount',
    'loginFailed'
  ];
  
  const missingSignupKeys = signupKeys.filter(k => !cleanedKeys.includes(k));
  if (missingSignupKeys.length > 0) {
    console.warn(`\n⚠️  WARNING: Missing signup-critical keys:`, missingSignupKeys);
  } else {
    console.log(`\n✅ All signup-critical keys present`);
  }
  
  // Print cleaned object for manual replacement
  console.log(`\n--- ${lang} cleaned object (ready to paste) ---`);
  console.log(`${lang}: {`);
  
  for (const key of Array.from(validKeys)) {
    if (cleaned[key]) {
      const value = JSON.stringify(cleaned[key]);
      console.log(`  ${key}: ${value},`);
    }
  }
  
  console.log(`},\n`);
}

console.log(`\n=== Cleanup Complete ===\n`);
