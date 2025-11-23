import fs from 'fs';

console.log('=== FINAL TRANSLATION FILE VERIFICATION ===\n');

const content = fs.readFileSync('client/src/i18n/translations.ts', 'utf-8');
const lines = content.split('\n');

// 1. Check for duplicates
console.log('1. DUPLICATE KEY CHECK:');
const languageSections: Record<string, { start: number; end: number }> = {};
const languageStarts = [
  { name: 'English', line: 0 },
  { name: 'Arabic', line: 0 },
  { name: 'Chinese', line: 0 },
  { name: 'German', line: 0 },
  { name: 'Hindi', line: 0 },
  { name: 'Urdu', line: 0 },
  { name: 'Bengali', line: 0 },
  { name: 'Italian', line: 0 },
  { name: 'Spanish', line: 0 },
  { name: 'Tagalog', line: 0 },
  { name: 'French', line: 0 },
  { name: 'Indonesian', line: 0 }
];

for (let i = 0; i < lines.length; i++) {
  for (const lang of languageStarts) {
    if (lines[i].trim() === `${lang.name}: {`) {
      lang.line = i + 1;
    }
  }
}

for (let i = 0; i < languageStarts.length; i++) {
  const current = languageStarts[i];
  const next = languageStarts[i + 1];
  if (current.line > 0) {
    languageSections[current.name] = {
      start: current.line - 1,
      end: next && next.line > 0 ? next.line - 2 : lines.length - 2
    };
  }
}

let hasDuplicates = false;
for (const lang of Object.keys(languageSections)) {
  const section = languageSections[lang];
  const keys = new Map<string, number[]>();
  
  for (let i = section.start; i <= section.end; i++) {
    const match = lines[i].match(/^\s+([a-zA-Z][a-zA-Z0-9]*)\s*:/);
    if (match) {
      const key = match[1];
      if (!keys.has(key)) {
        keys.set(key, []);
      }
      keys.get(key)!.push(i + 1);
    }
  }
  
  const duplicates = Array.from(keys.entries()).filter(([k, lineNums]) => lineNums.length > 1);
  if (duplicates.length > 0) {
    console.log(`   ❌ ${lang}: Found ${duplicates.length} duplicate(s)`);
    hasDuplicates = true;
  }
}
if (!hasDuplicates) {
  console.log('   ✓ No duplicate keys found in any language\n');
}

// 2. Check businessManagementSystem in required languages
console.log('2. BUSINESSMANAGEMENTSYSTEM CHECK:');
const requiredLanguages = ['English', 'Arabic', 'Hindi', 'Urdu', 'French', 'Spanish', 'Tagalog', 'Indonesian'];
let allHaveBMS = true;
for (const lang of requiredLanguages) {
  if (!languageSections[lang]) {
    console.log(`   ❌ ${lang}: Section not found!`);
    allHaveBMS = false;
    continue;
  }
  const section = languageSections[lang];
  let found = false;
  for (let i = section.start; i <= section.end; i++) {
    if (lines[i].includes('businessManagementSystem:')) {
      found = true;
      break;
    }
  }
  if (!found) {
    console.log(`   ❌ ${lang}: businessManagementSystem MISSING`);
    allHaveBMS = false;
  }
}
if (allHaveBMS) {
  console.log('   ✓ businessManagementSystem exists in all 8 required languages\n');
}

// 3. Check critical auth keys
console.log('3. CRITICAL AUTH KEYS CHECK:');
const criticalKeys = ['emailAddress', 'sendResetLink', 'resetPassword', 'businessManagementSystem'];
const targetLangs = ['Arabic', 'Hindi', 'Urdu', 'Spanish', 'Tagalog'];
let allHaveAuthKeys = true;
for (const lang of targetLangs) {
  const section = languageSections[lang];
  for (const key of criticalKeys) {
    let found = false;
    for (let i = section.start; i <= section.end; i++) {
      if (lines[i].match(new RegExp(`^\\s+${key}\\s*:`))) {
        found = true;
        break;
      }
    }
    if (!found) {
      console.log(`   ❌ ${lang}: Missing "${key}"`);
      allHaveAuthKeys = false;
    }
  }
}
if (allHaveAuthKeys) {
  console.log('   ✓ All critical auth keys present in target languages\n');
}

console.log('=== VERIFICATION COMPLETE ===');
