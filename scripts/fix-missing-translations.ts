import fs from 'fs';

const content = fs.readFileSync('client/src/i18n/translations.ts', 'utf-8');
const lines = content.split('\n');

// The missing translations (using English as placeholder)
const missingKeys = `    emailAddress: 'Email Address',
    enterYourEmail: 'Enter your email',
    sendResetLink: 'Send Reset Link',
    sending: 'Sending...',
    resetting: 'Resetting...',
    redirectingToLogin: 'Redirecting to login page...',
    goToLogin: 'Go to Login',
    backToLogin: 'Back to Login',
    confirmNewPassword: 'Confirm New Password',
    enterNewPasswordPlaceholder: 'Enter new password',
    enterConfirmPasswordPlaceholder: 'Confirm new password',
    accountInformation: 'Account Information',
    companyInformation: 'Company Information',
    welcomeToBlindSpot: 'Welcome to BlindSpot System',
    createAdminAccountDesc: 'Create your administrator account to get started',
    createAdminAccount: 'Create Admin Account',
    emergencyAdminReset: 'Emergency Admin Reset',
    bootstrapResetToken: 'Bootstrap Reset Token',
    enterBootstrapToken: 'Enter your bootstrap reset token',
    adminUsername: 'Admin Username',
    enterAdminUsername: 'Enter admin username',
    importantNotes: 'Important Notes:',
    noInvoicesFound: 'No invoices found',
    noPDF: 'No PDF',`;

// Find where to insert for each language
// Insert after "choosePassword" line
const languagesToFix = [
  { name: 'Arabic', insertAfter: 'choosePassword: \'اختر كلمة مرور\',' },
  { name: 'Hindi', insertAfter: 'choosePassword: \'एक पासवर्ड चुनें\',' },
  { name: 'Urdu', insertAfter: 'choosePassword: \'ایک پاس ورڈ منتخب کریں\',' },
  { name: 'Spanish', insertAfter: 'choosePassword: "Elige una contraseña",' },
  { name: 'Tagalog', insertAfter: 'choosePassword: "Pumili ng password",' }
];

let modified = false;

for (const lang of languagesToFix) {
  console.log(`\nProcessing ${lang.name}...`);
  
  // Find the line with choosePassword in this language section
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(lang.insertAfter)) {
      console.log(`Found insertion point at line ${i + 1}`);
      
      // Check if the next line already has emailAddress (already fixed)
      if (lines[i + 1] && lines[i + 1].includes('emailAddress:')) {
        console.log(`${lang.name} already has missing keys - skipping`);
        break;
      }
      
      // Insert the missing keys after this line
      lines.splice(i + 1, 0, missingKeys);
      modified = true;
      console.log(`Added missing keys to ${lang.name}`);
      break;
    }
  }
}

if (modified) {
  fs.writeFileSync('client/src/i18n/translations.ts', lines.join('\n'), 'utf-8');
  console.log('\n✓ File updated successfully');
} else {
  console.log('\n✓ No changes needed - all translations already present');
}
