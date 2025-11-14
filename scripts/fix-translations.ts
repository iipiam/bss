#!/usr/bin/env tsx
// Script to fix Italian, Spanish, and Tagalog translations
// Removes invalid keys and fills missing keys with English fallbacks

import * as fs from 'fs';
import { translations } from '../client/src/i18n/translations';

const validKeys = Object.keys(translations.English);
const languagesToFix: Array<'Italian' | 'Spanish' | 'Tagalog'> = [
  'Italian',
  'Spanish',
  'Tagalog'
];

console.log(`\n=== Translation Fixer ===`);
console.log(`Valid keys from English: ${validKeys.length}\n`);

const fixed: any = {};

for (const lang of languagesToFix) {
  console.log(`--- Fixing ${lang} ---`);
  
  const original = translations[lang];
  const originalKeys = Object.keys(original);
  const cleaned: any = {};
  
  let droppedCount = 0;
  let filledCount = 0;
  
  // First, copy all valid existing keys
  for (const key of originalKeys) {
    if (validKeys.includes(key)) {
      cleaned[key] = original[key as keyof typeof original];
    } else {
      droppedCount++;
    }
  }
  
  // Then, fill in missing keys with English fallback
  for (const key of validKeys) {
    if (!cleaned[key]) {
      cleaned[key] = translations.English[key as keyof typeof translations.English];
      filledCount++;
    }
  }
  
  fixed[lang] = cleaned;
  
  console.log(`Original keys: ${originalKeys.length}`);
  console.log(`Dropped invalid keys: ${droppedCount}`);
  console.log(`Filled missing keys (English fallback): ${filledCount}`);
  console.log(`Final keys: ${Object.keys(cleaned).length}`);
  console.log(``);
}

// Generate the TypeScript code to replace
console.log(`\n=== Generated TypeScript ===\n`);

for (const lang of languagesToFix) {
  const obj = fixed[lang];
  
  console.log(`  ${lang}: {`);
  for (const key of validKeys) {
    const value = JSON.stringify(obj[key]);
    console.log(`    ${key}: ${value},`);
  }
  console.log(`  },\n`);
}

console.log(`\n=== Fix Complete ===\n`);
