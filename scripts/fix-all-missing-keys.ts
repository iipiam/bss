import fs from 'fs';

const content = fs.readFileSync('client/src/i18n/translations.ts', 'utf-8');
let lines = content.split('\n');

// Missing keys with English placeholder text
const missingKeys = [
  "    emailAddress: 'Email Address',",
  "    enterYourEmail: 'Enter your email',",
  "    sendResetLink: 'Send Reset Link',",
  "    sending: 'Sending...',",
  "    resetting: 'Resetting...',",
  "    redirectingToLogin: 'Redirecting to login page...',",
  "    goToLogin: 'Go to Login',",
  "    backToLogin: 'Back to Login',",
  "    confirmNewPassword: 'Confirm New Password',",
  "    enterNewPasswordPlaceholder: 'Enter new password',",
  "    enterConfirmPasswordPlaceholder: 'Confirm new password',",
  "    accountInformation: 'Account Information',",
  "    companyInformation: 'Company Information',",
  "    welcomeToBlindSpot: 'Welcome to BlindSpot System',",
  "    createAdminAccountDesc: 'Create your administrator account to get started',",
  "    createAdminAccount: 'Create Admin Account',",
  "    emergencyAdminReset: 'Emergency Admin Reset',",
  "    bootstrapResetToken: 'Bootstrap Reset Token',",
  "    enterBootstrapToken: 'Enter your bootstrap reset token',",
  "    adminUsername: 'Admin Username',",
  "    enterAdminUsername: 'Enter admin username',",
  "    importantNotes: 'Important Notes:',",
];

// Languages to fix with their approximate choosePassword line numbers
const languagesToFix = [
  { name: 'Hindi', startLine: 6037 },
  { name: 'Urdu', startLine: 7193 },
  { name: 'Spanish', startLine: 10368 },
  { name: 'Tagalog', startLine: 11461 }
];

let totalInserted = 0;

for (const lang of languagesToFix) {
  console.log(`\nProcessing ${lang.name} starting around line ${lang.startLine}...`);
  
  // Find choosePassword line within range
  for (let i = lang.startLine - 10; i < lang.startLine + 10; i++) {
    if (lines[i] && lines[i].includes('choosePassword:')) {
      console.log(`Found choosePassword at line ${i + 1}`);
      
      // Check if emailAddress already exists on next line
      if (lines[i + 1] && lines[i + 1].includes('emailAddress:')) {
        console.log(`${lang.name} already has the missing keys - skipping`);
        break;
      }
      
      // Insert missing keys after choosePassword line
      lines.splice(i + 1, 0, ...missingKeys);
      totalInserted += missingKeys.length;
      console.log(`✓ Inserted ${missingKeys.length} missing keys into ${lang.name}`);
      
      // Adjust subsequent language start lines
      for (let j = languagesToFix.indexOf(lang) + 1; j < languagesToFix.length; j++) {
        languagesToFix[j].startLine += missingKeys.length;
      }
      break;
    }
  }
}

if (totalInserted > 0) {
  fs.writeFileSync('client/src/i18n/translations.ts', lines.join('\n'), 'utf-8');
  console.log(`\n✓ Successfully inserted ${totalInserted} keys into ${totalInserted / missingKeys.length} languages`);
} else {
  console.log('\n✓ No changes needed');
}
