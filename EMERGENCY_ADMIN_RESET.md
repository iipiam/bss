# Emergency Admin Reset System

## Overview

The Emergency Admin Reset system allows you to recover admin access when you cannot log in to your published (production) application. This uses a secure, one-time bootstrap token system.

## ⚠️ When to Use This

Use this emergency reset system when:
- You've forgotten your admin password in the **published/production** environment
- The Password Manager tool is inaccessible (requires being logged in)
- Email-based password reset is not configured or not working

**Note**: For the development environment, you can reset passwords directly in the database.

---

## 🔧 Step 1: Generate a Bootstrap Reset Token

### Using Node.js (Recommended)

Run this command on your server to generate a secure token:

```bash
node -e "const crypto = require('crypto'); const token = crypto.randomBytes(32).toString('hex'); console.log('Your bootstrap token:', token); console.log('Save this token securely - it will only be shown once!');"
```

This will output something like:
```
Your bootstrap token: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

**⚠️ IMPORTANT**: Copy this token immediately! You'll need it for the next steps.

---

## 🗄️ Step 2: Add the Token to Your Database

You need to add the hashed version of this token to your production database.

### Option A: Using Replit Database Console (Easiest)

1. Open your Replit project
2. Click on the **Database** tab
3. Select your **Production** database (not Development!)
4. Click **SQL Console**
5. Generate the token hash and insert statement using this Node.js command:

```bash
node -e "const bcrypt = require('bcrypt'); const token = 'YOUR_TOKEN_HERE'; bcrypt.hash(token, 10, (err, hash) => { const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); console.log('INSERT INTO bootstrap_reset_tokens (token_hash, consumed, expires_at) VALUES (\\''+hash+'\\', false, \\''+expiry+'\\');'); });"
```

Replace `YOUR_TOKEN_HERE` with the token from Step 1.

6. Copy the generated `INSERT` statement
7. Paste and run it in the SQL Console

**⚠️ IMPORTANT**: Token expires in 15 minutes! Use it immediately after generating.

### Option B: Manual SQL (if you have database access)

```sql
INSERT INTO bootstrap_reset_tokens (id, token_hash, consumed, expires_at)
VALUES (
  gen_random_uuid(),
  '$2b$10$YOUR_BCRYPT_HASH_HERE',
  false,
  NOW() + INTERVAL '15 minutes'
);
```

Replace `$2b$10$YOUR_BCRYPT_HASH_HERE` with the bcrypt hash of your token (see Option A for how to generate it).

---

## 🔐 Step 3: Use the Emergency Reset Page

1. **Navigate to the emergency reset page**:
   ```
   https://your-app-domain.replit.app/emergency-reset
   ```

2. **Fill in the form**:
   - **Bootstrap Reset Token**: Paste the plain-text token from Step 1
   - **Admin Username**: Enter your admin username (e.g., `admin`)
   - **New Password**: Choose a secure password (min 6 characters)
   - **Confirm New Password**: Re-enter the new password

3. **Click "Reset Admin Password"**

4. **Success!** You'll be redirected to the login page where you can log in with your new password.

---

## 🔒 Security Features

- **One-Time Use**: Each bootstrap token can only be used once. After use, it's automatically marked as consumed.
- **Token Expiry**: Tokens expire after 15 minutes for security. Generate fresh tokens when needed.
- **Rate Limiting**: Each IP address is limited to 10 reset attempts per 15 minutes to prevent brute-force attacks.
- **Bcrypt Hashing**: Tokens are hashed using bcrypt for secure storage.
- **Admin Only**: Only admin accounts can be reset via this method.
- **IP Logging**: The system logs the IP address and username when a token is consumed.
- **Audit Trail**: All reset attempts are logged with timestamps.

---

## 📋 Complete Example Walkthrough

### Scenario: You're locked out of your production app

**1. Generate Token**:
```bash
node -e "const crypto = require('crypto'); console.log(crypto.randomBytes(32).toString('hex'));"
```
Output: `abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567`

**2. Hash the Token and Generate Insert Statement**:
```bash
node -e "const bcrypt = require('bcrypt'); const token = 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567'; bcrypt.hash(token, 10, (e,h) => { const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); console.log('INSERT INTO bootstrap_reset_tokens (token_hash, consumed, expires_at) VALUES (\\''+h+'\\', false, \\''+expiry+'\\');'); });"
```
Output: `INSERT INTO bootstrap_reset_tokens (token_hash, consumed, expires_at) VALUES ('$2b$10$XYZ123...', false, '2025-11-10T23:15:00.000Z');`

**3. Run the INSERT Statement in Production Database**:
```sql
INSERT INTO bootstrap_reset_tokens (token_hash, consumed, expires_at) 
VALUES ('$2b$10$XYZ123...', false, '2025-11-10T23:15:00.000Z');
```

**4. Visit Emergency Reset Page**:
```
https://myapp.replit.app/emergency-reset
```

**5. Enter**:
- Token: `abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567`
- Username: `admin`
- Password: `MyNewSecurePassword123!`
- Confirm: `MyNewSecurePassword123!`

**6. Click "Reset Admin Password"**

**7. Login** with `admin` / `MyNewSecurePassword123!`

---

## 🚨 Troubleshooting

### "Invalid or already used reset token"
- The token might have already been used (check `consumed` column in database)
- The token might be incorrect (make sure you're using the plain text version, not the hash)
- The token hash in the database doesn't match

### "User not found"
- Make sure you're entering the correct admin username
- Check that the admin account exists in the production database

### "Can only reset admin accounts via bootstrap"
- The account exists but is not an admin
- Only admin role accounts can be reset this way

### "Password must be at least 6 characters long"
- Your new password is too short

---

## 🔄 Rotating/Regenerating Tokens

After each use, tokens are automatically consumed. To create a new token:

1. Generate a new token (Step 1)
2. Hash it and insert it into the database (Step 2)
3. Delete old consumed tokens (optional cleanup):
   ```sql
   DELETE FROM bootstrap_reset_tokens WHERE consumed = true;
   ```

---

## 📞 Support

If you're still having trouble:
1. Check the server logs for `[BOOTSTRAP]` entries
2. Verify your database connection
3. Ensure the `bootstrap_reset_tokens` table exists
4. Contact system administrator

---

## 🛡️ Best Practices

1. **Generate Strong Tokens**: Always use the crypto.randomBytes method (32+ bytes)
2. **Secure Token Storage**: Never commit tokens to version control
3. **One-Time Use**: Generate a fresh token each time you need to reset
4. **Clean Up**: Periodically delete consumed tokens from the database
5. **Audit Logs**: Regularly review the `consumedBy` and `ipAddress` fields for suspicious activity

---

## 📊 Database Schema Reference

```sql
CREATE TABLE bootstrap_reset_tokens (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT NOT NULL,           -- Bcrypt hash of the token
  consumed BOOLEAN DEFAULT false,     -- One-time use flag
  consumed_at TIMESTAMP,              -- When it was used
  consumed_by TEXT,                   -- Which admin was reset
  ip_address TEXT,                    -- IP that used the token
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

**Last Updated**: November 2025  
**Version**: 1.0
