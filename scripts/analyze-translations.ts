import fs from 'fs';

const content = fs.readFileSync('client/src/i18n/translations.ts', 'utf-8');
const lines = content.split('\n');

// Find language section boundaries
const languageSections: Record<string, { start: number; end: number }> = {};
const languageStarts = [
  { name: 'English', line: 1198 },
  { name: 'Arabic', line: 2389 },
  { name: 'Chinese', line: 3559 },
  { name: 'German', line: 4622 },
  { name: 'Hindi', line: 5684 },
  { name: 'Urdu', line: 6840 },
  { name: 'Bengali', line: 7996 },
  { name: 'Italian', line: 9059 },
  { name: 'Spanish', line: 10060 },
  { name: 'Tagalog', line: 11153 },
  { name: 'French', line: 12247 },
  { name: 'Indonesian', line: 13438 }
];

for (let i = 0; i < languageStarts.length; i++) {
  const current = languageStarts[i];
  const next = languageStarts[i + 1];
  languageSections[current.name] = {
    start: current.line - 1, // Convert to 0-indexed
    end: next ? next.line - 2 : lines.length - 2
  };
}

// Extract keys from each language
function getKeys(langName: string): Set<string> {
  const section = languageSections[langName];
  const keys = new Set<string>();
  const duplicates: string[] = [];
  
  for (let i = section.start; i <= section.end; i++) {
    const match = lines[i].match(/^\s+([a-zA-Z][a-zA-Z0-9]*)\s*:/);
    if (match) {
      const key = match[1];
      if (keys.has(key)) {
        duplicates.push(key);
      }
      keys.add(key);
    }
  }
  
  if (duplicates.length > 0) {
    console.log(`\n${langName} DUPLICATES:`, duplicates);
  }
  
  return keys;
}

const englishKeys = getKeys('English');
console.log('\n=== DUPLICATE KEY ANALYSIS ===');
for (const lang of Object.keys(languageSections)) {
  getKeys(lang);
}

console.log('\n=== MISSING KEY ANALYSIS ===');
const targetLangs = ['Arabic', 'Hindi', 'Urdu', 'Spanish', 'Tagalog'];
for (const lang of targetLangs) {
  const langKeys = getKeys(lang);
  const missing = [...englishKeys].filter(k => !langKeys.has(k));
  console.log(`\n${lang} missing ${missing.length} keys:`);
  console.log(missing.slice(0, 30));
}

console.log('\n=== BUSINESSMANAGEMENTSYSTEM CHECK ===');
for (const lang of Object.keys(languageSections)) {
  const section = languageSections[lang];
  let found = false;
  for (let i = section.start; i <= section.end; i++) {
    if (lines[i].includes('businessManagementSystem:')) {
      found = true;
      break;
    }
  }
  console.log(`${lang}: ${found ? '✓' : '✗ MISSING'}`);
}
