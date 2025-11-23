import * as fs from 'fs';
import * as path from 'path';

// Read the translations file
const filePath = path.join(process.cwd(), 'client/src/i18n/translations.ts');
const content = fs.readFileSync(filePath, 'utf-8');

// Extract the English translation section
const englishStart = content.indexOf('  English: {');
const frenchStart = content.indexOf('  French: {');
const englishSection = content.substring(englishStart, frenchStart).trim();

// Parse English keys and values
const englishLines = englishSection.split('\n');
const englishTranslations: Record<string, string> = {};
let currentComment = '';

for (const line of englishLines) {
  const trimmed = line.trim();
  
  // Track comments
  if (trimmed.startsWith('//')) {
    currentComment = trimmed;
    continue;
  }
  
  // Extract key-value pairs
  const match = trimmed.match(/^(\w+):\s*(.+),?\s*$/);
  if (match && !trimmed.startsWith('English:') && !trimmed.startsWith('}')) {
    const key = match[1];
    let value = match[2].replace(/,$/, '').trim();
    englishTranslations[key] = value;
  }
}

console.log(`Found ${Object.keys(englishTranslations).length} English translation keys`);

// Read current French section
const frenchEnd = content.indexOf('  Indonesian: {');
const frenchSection = content.substring(frenchStart, frenchEnd).trim();
const frenchLines = frenchSection.split('\n');
const frenchTranslations: Record<string, string> = {};

for (const line of frenchLines) {
  const trimmed = line.trim();
  const match = trimmed.match(/^(\w+):\s*(.+),?\s*$/);
  if (match && !trimmed.startsWith('French:') && !trimmed.startsWith('}') && !trimmed.startsWith('//')) {
    const key = match[1];
    let value = match[2].replace(/,$/, '').trim();
    frenchTranslations[key] = value;
  }
}

console.log(`Found ${Object.keys(frenchTranslations).length} existing French translations`);

// Read current Indonesian section  
const indonesianEnd = content.indexOf('};', frenchEnd);
const indonesianSection = content.substring(frenchEnd, indonesianEnd).trim();
const indonesianLines = indonesianSection.split('\n');
const indonesianTranslations: Record<string, string> = {};

for (const line of indonesianLines) {
  const trimmed = line.trim();
  const match = trimmed.match(/^(\w+):\s*(.+),?\s*$/);
  if (match && !trimmed.startsWith('Indonesian:') && !trimmed.startsWith('}') && !trimmed.startsWith('//')) {
    const key = match[1];
    let value = match[2].replace(/,$/, '').trim();
    indonesianTranslations[key] = value;
  }
}

console.log(`Found ${Object.keys(indonesianTranslations).length} existing Indonesian translations`);

// Build complete French section
const completeFrench: string[] = ['  French: {'];
let lastComment = '';

for (const line of englishLines) {
  const trimmed = line.trim();
  
  // Preserve comments
  if (trimmed.startsWith('//')) {
    completeFrench.push(`    ${trimmed}`);
    lastComment = trimmed;
    continue;
  }
  
  // Handle opening brace
  if (trimmed === 'English: {' || trimmed === '}' || trimmed === '') {
    continue;
  }
  
  // Extract key
  const match = trimmed.match(/^(\w+):\s*(.+),?\s*$/);
  if (match) {
    const key = match[1];
    const englishValue = match[2].replace(/,$/, '').trim();
    
    // Use existing French translation if available, otherwise use English
    const value = frenchTranslations[key] || englishValue;
    completeFrench.push(`    ${key}: ${value},`);
  }
}
completeFrench.push('  },');

// Build complete Indonesian section
const completeIndonesian: string[] = ['  Indonesian: {'];

for (const line of englishLines) {
  const trimmed = line.trim();
  
  // Preserve comments
  if (trimmed.startsWith('//')) {
    completeIndonesian.push(`    ${trimmed}`);
    continue;
  }
  
  // Handle opening brace
  if (trimmed === 'English: {' || trimmed === '}' || trimmed === '') {
    continue;
  }
  
  // Extract key
  const match = trimmed.match(/^(\w+):\s*(.+),?\s*$/);
  if (match) {
    const key = match[1];
    const englishValue = match[2].replace(/,$/, '').trim();
    
    // Use existing Indonesian translation if available, otherwise use English
    const value = indonesianTranslations[key] || englishValue;
    completeIndonesian.push(`    ${key}: ${value},`);
  }
}
completeIndonesian.push('  },');

// Replace French and Indonesian sections in the file
const beforeFrench = content.substring(0, frenchStart);
const afterIndonesian = content.substring(indonesianEnd);

const newContent = beforeFrench + 
  completeFrench.join('\n') + '\n  \n' +
  completeIndonesian.join('\n') + '\n' +
  afterIndonesian;

// Write back to file
fs.writeFileSync(filePath, newContent, 'utf-8');

console.log('✅ French and Indonesian translations completed!');
console.log(`French now has ${completeFrench.length - 2} lines`);
console.log(`Indonesian now has ${completeIndonesian.length - 2} lines`);
