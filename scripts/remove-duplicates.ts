import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(process.cwd(), 'client/src/i18n/translations.ts');
const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// Find all language section boundaries
const sections: { name: string; start: number; end: number }[] = [];
const languageRegex = /^  ([A-Z][a-z]+): \{$/;

for (let i = 0; i < lines.length; i++) {
  const match = lines[i].match(languageRegex);
  if (match) {
    const name = match[1];
    const start = i;
    
    // Find the end of this section (next language or closing brace)
    let end = i + 1;
    let braceCount = 1;
    while (end < lines.length && braceCount > 0) {
      const line = lines[end].trim();
      if (line === '},') {
        braceCount--;
        if (braceCount === 0) break;
      }
      end++;
    }
    
    sections.push({ name, start, end });
  }
}

console.log(`Found ${sections.length} language sections`);

// Process each section to remove duplicates
const newLines = [...lines];
let totalDuplicatesRemoved = 0;

for (const section of sections) {
  const seenKeys = new Set<string>();
  let duplicatesInSection = 0;
  
  for (let i = section.start + 1; i < section.end; i++) {
    const line = lines[i].trim();
    const match = line.match(/^(\w+):\s*.+$/);
    
    if (match && !line.startsWith('//')) {
      const key = match[1];
      
      if (seenKeys.has(key)) {
        // This is a duplicate - remove it
        newLines[i] = '';  // Mark for removal
        duplicatesInSection++;
        console.log(`Duplicate in ${section.name}: ${key} at line ${i + 1}`);
      } else {
        seenKeys.add(key);
      }
    }
  }
  
  if (duplicatesInSection > 0) {
    console.log(`Removed ${duplicatesInSection} duplicates from ${section.name}`);
    totalDuplicatesRemoved += duplicatesInSection;
  }
}

// Filter out empty lines that were marked for removal
const filteredLines = newLines.filter((line, i) => {
  if (line === '') {
    // Check if this was a duplicate we marked for removal
    const originalLine = lines[i].trim();
    if (originalLine && originalLine.match(/^(\w+):\s*.+$/)) {
      return false;  // Remove this line
    }
  }
  return true;
});

// Write back to file
fs.writeFileSync(filePath, filteredLines.join('\n'), 'utf-8');

console.log(`\n✅ Removed ${totalDuplicatesRemoved} duplicate keys total`);
console.log(`File reduced from ${lines.length} to ${filteredLines.length} lines`);
