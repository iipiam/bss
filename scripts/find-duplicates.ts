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

// Update to current line numbers after our edits
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
  languageSections[current.name] = {
    start: current.line - 1,
    end: next ? next.line - 2 : lines.length - 2
  };
}

console.log('=== CHECKING FOR DUPLICATE KEYS ===\n');

let totalDuplicatesFound = 0;

for (const lang of Object.keys(languageSections)) {
  const section = languageSections[lang];
  const keys = new Map<string, number[]>();  // key -> line numbers
  
  for (let i = section.start; i <= section.end; i++) {
    const match = lines[i].match(/^\s+([a-zA-Z][a-zA-Z0-9]*)\s*:/);
    if (match) {
      const key = match[1];
      if (!keys.has(key)) {
        keys.set(key, []);
      }
      keys.get(key)!.push(i + 1); // 1-indexed line number
    }
  }
  
  const duplicates = Array.from(keys.entries()).filter(([k, lineNums]) => lineNums.length > 1);
  
  if (duplicates.length > 0) {
    console.log(`\n${lang}:`);
    for (const [key, lineNums] of duplicates) {
      console.log(`  - "${key}" appears ${lineNums.length} times at lines: ${lineNums.join(', ')}`);
      totalDuplicatesFound++;
    }
  }
}

if (totalDuplicatesFound === 0) {
  console.log('\n✓ No duplicate keys found!');
} else {
  console.log(`\n⚠ Found ${totalDuplicatesFound} duplicate key(s) across all languages`);
}
