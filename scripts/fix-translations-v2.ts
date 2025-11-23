import * as fs from 'fs';
import * as path from 'path';

const filePath = path.join(process.cwd(), 'client/src/i18n/translations.ts');
const lines = fs.readFileSync(filePath, 'utf-8').split('\n');

// Find section boundaries
let englishStart = -1, frenchStart = -1, indonesianStart = -1, endOfTranslations = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].trim() === 'English: {') englishStart = i;
  if (lines[i].trim() === 'French: {') frenchStart = i;
  if (lines[i].trim() === 'Indonesian: {') indonesianStart = i;
  if (lines[i].trim() === '};' && englishStart !== -1 && endOfTranslations === -1) {
    // Find the closing of the translations object
    if (i > indonesianStart) {
      endOfTranslations = i;
    }
  }
}

console.log(`English starts at line ${englishStart}`);
console.log(`French starts at line ${frenchStart}`);
console.log(`Indonesian starts at line ${indonesianStart}`);
console.log(`End of translations at line ${endOfTranslations}`);

// Extract English translations with their structure preserved
const englishSection: string[] = [];
for (let i = englishStart + 1; i < frenchStart; i++) {
  const line = lines[i];
  if (line.trim() === '},') break;
  englishSection.push(line);
}

console.log(`English section has ${englishSection.length} lines`);

// Parse existing French translations
const existingFrench = new Map<string, string>();
for (let i = frenchStart + 1; i < indonesianStart; i++) {
  const line = lines[i].trim();
  const match = line.match(/^(\w+):\s*(.+?),?\s*$/);
  if (match && !line.startsWith('//') && !line.startsWith('}')) {
    const key = match[1];
    const value = match[2].endsWith(',') ? match[2] : match[2] + ',';
    existingFrench.set(key, value);
  }
}

console.log(`Found ${existingFrench.size} existing French translations`);

// Parse existing Indonesian translations
const existingIndonesian = new Map<string, string>();
for (let i = indonesianStart + 1; i < endOfTranslations; i++) {
  const line = lines[i].trim();
  const match = line.match(/^(\w+):\s*(.+?),?\s*$/);
  if (match && !line.startsWith('//') && !line.startsWith('}')) {
    const key = match[1];
    const value = match[2].endsWith(',') ? match[2] : match[2] + ',';
    existingIndonesian.set(key, value);
  }
}

console.log(`Found ${existingIndonesian.size} existing Indonesian translations`);

// Build complete French section
const frenchComplete: string[] = ['  French: {'];
for (const line of englishSection) {
  const trimmed = line.trim();
  
  // Keep comments
  if (trimmed.startsWith('//') || trimmed === '') {
    frenchComplete.push(line);
    continue;
  }
  
  // Extract key from English line
  const match = trimmed.match(/^(\w+):\s*(.+?),?\s*$/);
  if (match) {
    const key = match[1];
    const englishValue = match[2].endsWith(',') ? match[2] : match[2] + ',';
    
    // Use existing French if available, otherwise use English
    const value = existingFrench.get(key) || englishValue;
    frenchComplete.push(`    ${key}: ${value}`);
  }
}
frenchComplete.push('  },');

// Build complete Indonesian section
const indonesianComplete: string[] = ['  Indonesian: {'];
for (const line of englishSection) {
  const trimmed = line.trim();
  
  // Keep comments
  if (trimmed.startsWith('//') || trimmed === '') {
    indonesianComplete.push(line);
    continue;
  }
  
  // Extract key from English line
  const match = trimmed.match(/^(\w+):\s*(.+?),?\s*$/);
  if (match) {
    const key = match[1];
    const englishValue = match[2].endsWith(',') ? match[2] : match[2] + ',';
    
    // Use existing Indonesian if available, otherwise use English
    const value = existingIndonesian.get(key) || englishValue;
    indonesianComplete.push(`    ${key}: ${value}`);
  }
}
indonesianComplete.push('  },');

// Reconstruct the file
const before = lines.slice(0, frenchStart);
const after = lines.slice(endOfTranslations);

const newLines = [
  ...before,
  ...frenchComplete,
  '  ',
  ...indonesianComplete,
  ...after
];

// Write the file
fs.writeFileSync(filePath, newLines.join('\n'), 'utf-8');

console.log('✅ Translation file updated successfully!');
console.log(`French section now has ${frenchComplete.length} lines`);
console.log(`Indonesian section now has ${indonesianComplete.length} lines`);
