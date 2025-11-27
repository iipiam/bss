#!/usr/bin/env node
/**
 * Production Admin Password Reset Script
 * 
 * This script allows you to reset the admin password directly in the production database.
 * Run this in your Replit Shell when you're locked out of your production app.
 * 
 * Usage:
 *   node reset-admin-password.cjs <username> <new-password>
 * 
 * Example:
 *   node reset-admin-password.cjs admin MyNewPassword123
 */

const { neon } = require('@neondatabase/serverless');
const bcrypt = require('bcrypt');

async function resetAdminPassword() {
  // Get command line arguments
  const [,, username, newPassword] = process.argv;

  // Validation
  if (!username || !newPassword) {
    console.error('\n❌ Error: Missing required arguments\n');
    console.log('Usage: node reset-admin-password.cjs <username> <new-password>\n');
    console.log('Example:');
    console.log('  node reset-admin-password.cjs admin MyNewPassword123\n');
    process.exit(1);
  }

  if (newPassword.length < 6) {
    console.error('\n❌ Error: Password must be at least 6 characters long\n');
    process.exit(1);
  }

  // Check for DATABASE_URL
  const DATABASE_URL = process.env.DATABASE_URL;
  if (!DATABASE_URL) {
    console.error('\n❌ Error: DATABASE_URL environment variable is not set\n');
    console.log('Make sure you are running this in your Replit environment.\n');
    process.exit(1);
  }

  try {
    console.log('\n🔐 Admin Password Reset Tool\n');
    console.log('================================\n');
    console.log(`Username: ${username}`);
    console.log(`New Password: ${'*'.repeat(newPassword.length)}`);
    console.log('\n⏳ Processing...\n');

    // Connect to database
    const sql = neon(DATABASE_URL);

    // Check if user exists
    const users = await sql`SELECT id, username, role, active FROM users WHERE username = ${username}`;
    
    if (users.length === 0) {
      console.error(`❌ Error: User "${username}" not found in database\n`);
      console.log('Available users:');
      const allUsers = await sql`SELECT username, role FROM users ORDER BY username`;
      allUsers.forEach(u => console.log(`  - ${u.username} (${u.role})`));
      console.log('');
      process.exit(1);
    }

    const user = users[0];

    if (user.role !== 'admin') {
      console.error(`❌ Error: User "${username}" is not an admin (role: ${user.role})\n`);
      console.log('Only admin accounts can be reset using this script.\n');
      process.exit(1);
    }

    if (!user.active) {
      console.warn(`⚠️  Warning: User "${username}" is currently inactive\n`);
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password
    await sql`
      UPDATE users 
      SET password = ${hashedPassword},
          active = true
      WHERE username = ${username}
    `;

    console.log('✅ SUCCESS! Password has been reset\n');
    console.log('================================\n');
    console.log('You can now log in to your application with:\n');
    console.log(`  Username: ${username}`);
    console.log(`  Password: ${newPassword}\n`);
    console.log('🔒 Keep your password secure and change it after logging in!\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message, '\n');
    console.error('Full error:', error);
    process.exit(1);
  }
}

// Run the script
resetAdminPassword();
