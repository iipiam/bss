# 🔓 Quick Fix: Can't Login to Production

If you can't log in to your **published** application, use this simple 2-step solution:

---

## ✅ Solution 1: Quick Password Reset Script (EASIEST)

### Step 1: Open Shell in Your Replit

1. Click on the **Shell** tab in your Replit project
2. Make sure you're connected to your production environment

### Step 2: Run the Reset Script

```bash
node reset-admin-password.cjs admin YourNewPassword123
```

Replace `YourNewPassword123` with your desired password (minimum 6 characters).

### Example Output:

```
🔐 Admin Password Reset Tool

================================

Username: admin
New Password: *******************

⏳ Processing...

✅ SUCCESS! Password has been reset

================================

You can now log in to your application with:

  Username: admin
  Password: YourNewPassword123

🔒 Keep your password secure and change it after logging in!
```

### Step 3: Login to Your App

Go to your published app URL and log in with:
- **Username**: `admin`
- **Password**: `YourNewPassword123` (or whatever you set)

**Done! ✅**

---

## 🆘 Solution 2: Emergency Bootstrap Reset (Advanced)

If the quick script doesn't work, use the advanced emergency reset system:

📖 See full documentation: [EMERGENCY_ADMIN_RESET.md](./EMERGENCY_ADMIN_RESET.md)

---

## 🔍 Troubleshooting

### "User 'admin' not found"

The script will show you all available usernames. Use one of those:

```bash
node reset-admin-password.cjs your-username-here NewPassword123
```

### "DATABASE_URL not set"

Make sure you're running the command in your Replit Shell, not on your local computer.

### "Password must be at least 6 characters"

Choose a longer password:

```bash
node reset-admin-password.cjs admin MySecurePassword2024
```

---

## 📋 Common Login Credentials

After using the reset script, your login will be:

| Username | Password | Role |
|----------|----------|------|
| admin | (what you just set) | Administrator |

---

## 🔐 Best Practices

1. **Change Password After Login**: Once you're back in, go to your account settings and change your password
2. **Use Strong Passwords**: Minimum 8 characters with mix of letters, numbers, and symbols
3. **Keep Credentials Safe**: Don't share your admin password

---

## 🚀 Quick Reference

**Reset admin password:**
```bash
node reset-admin-password.cjs admin NewPassword123
```

**Reset any user:**
```bash
node reset-admin-password.cjs username NewPassword123
```

**List all users:**
```bash
node reset-admin-password.cjs nonexistent password
```
(It will fail but show you all available usernames)

---

**Need more help?** Check the [Emergency Admin Reset Guide](./EMERGENCY_ADMIN_RESET.md) for advanced options.
