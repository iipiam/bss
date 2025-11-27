# BlindSpot System - Test Account Credentials

## Client Accounts (Restaurant/Factory Accounts)

### Test Admin Account
- **Username**: `test_admin`
- **Password**: `Test123456`
- **Account Type**: Client Account (select "Client Account" radio button)
- **Role**: Admin
- **Use Case**: Full admin access to test all features

### MWCDT Account
- **Username**: `mwcdt`
- **Password**: `admin123`
- **Account Type**: Client Account (select "Client Account" radio button)
- **Role**: Admin
- **Use Case**: Alternative admin account for testing

### Admin Account
- **Username**: `admin`
- **Password**: `admin123`
- **Account Type**: Client Account (select "Client Account" radio button)
- **Role**: Admin
- **Use Case**: Default admin account

## IT Support Accounts

### IT Support Account
- **Username**: `it_support`
- **Password**: `IT@Support2024!`
- **Account Type**: **IT Account** (select "IT Account" radio button)
- **Role**: IT Staff
- **Use Case**: Access IT Dashboard with cross-tenant visibility

### IT Administrator Account
- **Username**: `it@saudikinzhal.org`
- **Password**: `IT@Admin2024!`
- **Account Type**: **IT Account** (select "IT Account" radio button)
- **Role**: IT Staff
- **Use Case**: Alternative IT account with admin privileges

## Important Notes

1. **Account Type Selection**: 
   - For client accounts (test_admin, mwcdt, admin): Select **"Client Account"** radio button on login
   - For IT account (it_support): Select **"IT Account"** radio button on login

2. **Password Reset**:
   - If you need to reset any account password, run:
     ```bash
     tsx scripts/reset-password.ts <username> <new-password>
     ```
   - Example: `tsx scripts/reset-password.ts test_admin MyNewPassword123`

3. **Permissions**:
   - All admin accounts have full permissions to all features
   - IT account has restricted access to IT Dashboard only

## Testing Scenarios

### Login Test Steps
1. Open the application
2. Select the correct "Account Type" radio button
3. Enter username and password
4. Click "Login"
5. Verify successful redirect to dashboard

### Common Login Issues
- **Wrong Account Type**: Make sure you select "Client Account" for business accounts and "IT Account" for IT support
- **Password Mismatch**: Passwords are case-sensitive
- **Account Inactive**: Contact admin if account is deactivated

## Security Notes

- All passwords are hashed using bcrypt with 10 salt rounds
- Session-based authentication with secure cookies
- Multi-tenant isolation via restaurantId
- These are TEST credentials - change them in production!