# BlindSpot System - AWS Deployment Guide
## Complete Step-by-Step Instructions for kinbss.com

---

## 📋 Overview

This guide will help you deploy BSS to AWS with:
- **EC2 Instance**: Ubuntu server running your Node.js application
- **RDS PostgreSQL**: Managed database (automatic backups, high availability)
- **Route 53**: DNS management for kinbss.com
- **SSL Certificate**: Free HTTPS via Let's Encrypt
- **Estimated Monthly Cost**: ~$98 USD

---

## STEP 1: AWS Prerequisites & SSH Key Setup

### 1.1 Sign into AWS Console
1. Go to https://console.aws.amazon.com
2. Sign in with your account
3. Make sure you're in your preferred region (e.g., `us-east-1` or `eu-west-1`)

### 1.2 Create SSH Key Pair (For Server Access)

**What is SSH?** Think of it like a secure key to access your server remotely from your computer.

1. In AWS Console, search for **EC2** in the top search bar
2. Click on **EC2** to open the EC2 Dashboard
3. In the left sidebar, scroll down and click **Key Pairs** (under "Network & Security")
4. Click orange **Create key pair** button
5. Fill in the form:
   - **Name**: `bss-production-key`
   - **Key pair type**: Select **RSA**
   - **Private key file format**: 
     - If you're on **Windows**, select **.ppk** (for PuTTY)
     - If you're on **Mac/Linux**, select **.pem**
6. Click **Create key pair**
7. **IMPORTANT**: The file will download automatically. Save it somewhere safe:
   - **Mac/Linux**: Save to `~/Downloads/bss-production-key.pem`
   - **Windows**: Save to `C:\Users\YourName\Downloads\bss-production-key.ppk`
   - ⚠️ **You cannot download this file again!** Keep it safe.

### 1.3 Set Up Billing Alerts (Important!)

1. In AWS Console, click your account name (top right) → **Billing Dashboard**
2. Click **Budgets** in left sidebar
3. Click **Create budget**
4. Select **Zero spend budget** or set a monthly limit (e.g., $200)
5. Enter your email to receive alerts
6. Click **Create budget**

---

## STEP 2: Create EC2 Instance (Your Server)

### 2.1 Launch EC2 Instance

1. Go back to **EC2 Dashboard**
2. Click orange **Launch instance** button
3. Configure as follows:

**Name and tags:**
- Name: `bss-production`

**Application and OS Images (AMI):**
- Click **Quick Start** tab
- Select **Ubuntu**
- Choose **Ubuntu Server 22.04 LTS (HVM), SSD Volume Type**
- Architecture: **64-bit (x86)**

**Instance type:**
- Select **t2.medium** (2 vCPU, 4GB RAM - $0.0464/hour = ~$34/month)
- Or **t3.medium** if available (slightly cheaper with better performance)

**Key pair:**
- Select the key pair you created: **bss-production-key**

**Network settings:**
- Click **Edit** button
- Keep Auto-assign public IP: **Enable**
- Firewall (security groups): **Create security group**
- Security group name: `bss-production-sg`
- Description: `Security group for BSS production server`
- Add these rules by clicking **Add security group rule**:

| Type | Protocol | Port Range | Source Type | Source | Description |
|------|----------|------------|-------------|--------|-------------|
| SSH | TCP | 22 | My IP | (auto-filled) | SSH access from your IP |
| HTTP | TCP | 80 | Anywhere IPv4 | 0.0.0.0/0 | Web traffic |
| HTTPS | TCP | 443 | Anywhere IPv4 | 0.0.0.0/0 | Secure web traffic |

**Configure storage:**
- Size: **40 GB**
- Volume type: **gp3** (General Purpose SSD)

**Advanced details:**
- Leave as default

4. Click **Launch instance** (orange button on right)
5. Wait 2-3 minutes for instance to start
6. Click **View all instances**

### 2.2 Get Your Server's IP Address

1. Click on your instance (check the checkbox next to `bss-production`)
2. Look at the details panel at the bottom
3. Find and **copy** the **Public IPv4 address** (e.g., `18.123.45.67`)
4. **Save this IP** - you'll need it for:
   - Connecting to your server
   - Configuring your domain (kinbss.com)

---

## STEP 3: Create RDS PostgreSQL Database

### 3.1 Create Database Subnet Group

1. In AWS Console, search for **RDS**
2. Click on **RDS** to open RDS Dashboard
3. In left sidebar, click **Subnet groups**
4. Click **Create DB subnet group**
5. Fill in:
   - **Name**: `bss-db-subnet-group`
   - **Description**: `Subnet group for BSS database`
   - **VPC**: Select your default VPC
   - **Availability Zones**: Select at least 2 zones
   - **Subnets**: Select subnets from the zones you chose
6. Click **Create**

### 3.2 Create RDS PostgreSQL Instance

1. Go back to **RDS Dashboard**
2. Click **Create database**
3. Configure as follows:

**Engine options:**
- Engine type: **PostgreSQL**
- Version: **PostgreSQL 14.x** (latest 14 version)

**Templates:**
- Select **Free tier** (if eligible) OR **Production** for better performance

**Settings:**
- DB instance identifier: `bss-production-db`
- Master username: `bssadmin`
- Master password: **Create a strong password** (save it somewhere safe!)
  - Example: `BSS_Prod_2024_SecurePass!`
  - ⚠️ **Write this down! You'll need it later.**

**Instance configuration:**
- DB instance class: **db.t3.micro** (Free tier) or **db.t3.small** (Production)

**Storage:**
- Storage type: **General Purpose SSD (gp3)**
- Allocated storage: **20 GB**
- Enable storage autoscaling: **Yes**
- Maximum storage threshold: **100 GB**

**Connectivity:**
- VPC: Select your default VPC
- Subnet group: `bss-db-subnet-group`
- Public access: **No**
- VPC security group: **Create new**
- New VPC security group name: `bss-db-sg`

**Database authentication:**
- Password authentication: **Checked**

**Additional configuration:**
- Initial database name: `bss_production`
- Backup retention period: **7 days**
- Enable encryption: **Yes** (recommended)

4. Click **Create database**
5. Wait 5-10 minutes for database to be created

### 3.3 Configure Database Security Group

**Allow EC2 to connect to RDS:**

1. Go to **EC2 Dashboard** → **Security Groups**
2. Find and click on `bss-db-sg`
3. Click **Inbound rules** tab → **Edit inbound rules**
4. Click **Add rule**:
   - Type: **PostgreSQL**
   - Port: **5432**
   - Source: **Custom**
   - In the search box, type `bss-production-sg` and select it
   - Description: `Allow EC2 to connect`
5. Click **Save rules**

### 3.4 Get Database Connection Details

1. Go to **RDS Dashboard** → **Databases**
2. Click on `bss-production-db`
3. In **Connectivity & security** section, copy the **Endpoint** (looks like: `bss-production-db.xxxxxx.us-east-1.rds.amazonaws.com`)
4. **Save this endpoint** - you'll need it for the connection string

---

## STEP 4: Connect to Your EC2 Server via SSH

### For Mac/Linux Users:

1. Open **Terminal** application
2. Navigate to where you saved the key:
```bash
cd ~/Downloads
```

3. Set correct permissions on your key:
```bash
chmod 400 bss-production-key.pem
```

4. Connect to your server (replace `18.123.45.67` with your actual IP):
```bash
ssh -i bss-production-key.pem ubuntu@18.123.45.67
```

5. Type `yes` when asked about authenticity
6. You should now see a prompt like: `ubuntu@ip-xxx:~$`

### For Windows Users:

**Option A: Using PuTTY (Recommended for Windows)**

1. Download PuTTY: https://www.putty.org/
2. Open **PuTTY**
3. In the left sidebar, click **Connection** → **SSH** → **Auth**
4. Click **Browse** next to "Private key file"
5. Select your `bss-production-key.ppk` file
6. In the left sidebar, click **Session**
7. Host Name: `ubuntu@18.123.45.67` (use your IP)
8. Port: `22`
9. Connection type: **SSH**
10. Click **Open**
11. Click **Yes** if you get a security alert
12. You should now see a terminal window

**Option B: Using Windows PowerShell (Windows 10/11)**

1. Open **PowerShell** (search for it in Start menu)
2. Navigate to your key location:
```powershell
cd C:\Users\YourName\Downloads
```

3. Convert .ppk to .pem if needed (or download .pem format initially)
4. Connect:
```powershell
ssh -i bss-production-key.pem ubuntu@18.123.45.67
```

---

## STEP 5: Initial Server Setup

Now that you're connected to your server, run these commands one by one:

### 5.1 Update System

```bash
sudo apt update && sudo apt upgrade -y
```

Wait for this to complete (may take 5-10 minutes).

### 5.2 Install Node.js 18

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify installation:
```bash
node -v    # Should show v18.x.x
npm -v     # Should show 9.x.x or higher
```

### 5.3 Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
pm2 --version
```

### 5.4 Install Nginx (Web Server)

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

Verify it's running:
```bash
sudo systemctl status nginx
```

Press `q` to exit the status view.

### 5.5 Install PostgreSQL Client

```bash
sudo apt install -y postgresql-client
```

### 5.6 Install Git

```bash
sudo apt install -y git
git --version
```

---

## STEP 6: Clone and Configure Your Application

### 6.1 Create Application Directory

```bash
sudo mkdir -p /home/bss-app
sudo chown -R ubuntu:ubuntu /home/bss-app
cd /home/bss-app
```

### 6.2 Clone Your Repository

You have two options here:

**Option A: If your code is on GitHub (private repo):**

First, create a personal access token on GitHub:
1. Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` access
3. Copy the token

Then clone:
```bash
git clone https://<YOUR_GITHUB_TOKEN>@github.com/yourusername/bss.git .
```

**Option B: Upload from Replit (simpler for now):**

We'll download the code from Replit and upload it. For now, let's install dependencies first.

### 6.3 Create Environment File

Create the `.env` file with your production settings:

```bash
nano .env
```

Paste this content (update the values marked with `<...>`):

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database Configuration
DATABASE_URL=postgresql://bssadmin:<YOUR_RDS_PASSWORD>@<YOUR_RDS_ENDPOINT>:5432/bss_production
# Example: postgresql://bssadmin:BSS_Prod_2024_SecurePass!@bss-production-db.xxxxxx.us-east-1.rds.amazonaws.com:5432/bss_production

# Session Secret (generate a random string)
SESSION_SECRET=<GENERATE_WITH_COMMAND_BELOW>

# Application URLs
FRONTEND_URL=https://kinbss.com

# Payment Gateway (Moyasar)
MOYASAR_API_KEY=<YOUR_MOYASAR_KEY>

# Email Service (Resend)
RESEND_API_KEY=<YOUR_RESEND_KEY>

# File Storage
INVOICE_STORAGE_PATH=/var/bss/invoices
UPLOAD_STORAGE_PATH=/var/bss/uploads

# AWS Configuration (if using S3 for backups)
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_REGION=us-east-1
# AWS_S3_BUCKET=bss-production
```

**To generate SESSION_SECRET:**
Press `Ctrl+X` to exit nano (don't save yet), then run:
```bash
openssl rand -base64 32
```

Copy the output, then edit the file again:
```bash
nano .env
```

Paste the generated string as the SESSION_SECRET value.

**Save the file:**
- Press `Ctrl+X`
- Press `Y` to confirm
- Press `Enter` to save

### 6.4 Create Required Directories

```bash
sudo mkdir -p /var/bss/{invoices,uploads,temp}
sudo mkdir -p /var/log/bss
sudo chown -R ubuntu:ubuntu /var/bss
sudo chown -R ubuntu:ubuntu /var/log/bss
```

---

## STEP 7: Upload Your Application Code

Since your code is currently on Replit, we need to get it to your AWS server.

### Method 1: Direct Git Clone from Replit (Easiest)

1. In Replit, click the **Git** icon in the left sidebar (Version Control)
2. If not already a Git repo, initialize it
3. Commit all your files
4. Push to GitHub (connect your GitHub account if needed)
5. Then on your server, clone it as shown in Step 6.2

### Method 2: Download and Upload via SCP

**On your local computer:**

1. Download the entire project from Replit as a ZIP
2. Extract it to a folder
3. Upload to server:

**Mac/Linux:**
```bash
cd /path/to/your/extracted/bss/folder
scp -i ~/Downloads/bss-production-key.pem -r * ubuntu@18.123.45.67:/home/bss-app/
```

**Windows (PowerShell):**
```powershell
cd C:\path\to\your\extracted\bss\folder
scp -i C:\Users\YourName\Downloads\bss-production-key.pem -r * ubuntu@18.123.45.67:/home/bss-app/
```

---

## STEP 8: Build and Deploy Application

Back on your server (SSH session):

### 8.1 Install Dependencies

```bash
cd /home/bss-app
npm install
```

This will take 5-10 minutes.

### 8.2 Build the Application

```bash
npm run build
```

Verify the build completed:
```bash
ls -lh dist/
```

You should see `public/` folder and server files.

### 8.3 Run Database Migrations

```bash
npm run db:push
```

This creates all the tables in your RDS database.

Verify tables were created:
```bash
psql $DATABASE_URL -c "\dt"
```

You should see a list of tables like `users`, `restaurants`, `menu_items`, etc.

### 8.4 Start Application with PM2

Copy the PM2 config:
```bash
cp deployment/configs/ecosystem.config.js .
```

Start the application:
```bash
pm2 start ecosystem.config.js
```

Check status:
```bash
pm2 status
```

You should see `bss-production` with status `online`.

View logs:
```bash
pm2 logs bss-production --lines 50
```

**Save PM2 configuration:**
```bash
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu
```

Copy and run the command it outputs (it will look like `sudo env PATH=...`).

---

## STEP 9: Configure Nginx Reverse Proxy

### 9.1 Copy Nginx Configuration

```bash
sudo cp /home/bss-app/deployment/configs/nginx-bss.conf /etc/nginx/sites-available/bss
```

### 9.2 Edit the Configuration

```bash
sudo nano /etc/nginx/sites-available/bss
```

Find and replace `yourdomain.com` with `kinbss.com` (there are several places).

Use `Ctrl+W` to search, `Ctrl+X` to exit, `Y` to save.

### 9.3 Enable the Site

```bash
sudo ln -s /etc/nginx/sites-available/bss /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
```

### 9.4 Test and Reload Nginx

```bash
sudo nginx -t
```

Should say "syntax is ok" and "test is successful".

```bash
sudo systemctl reload nginx
```

---

## STEP 10: Configure Domain (kinbss.com)

### 10.1 Point Domain to Your Server

You need to update your domain's DNS settings to point to your EC2 server's IP.

**Where is your domain registered?** (GoDaddy, Namecheap, AWS Route 53, etc.)

**For most domain registrars:**

1. Log in to your domain registrar (where you bought kinbss.com)
2. Find DNS settings / DNS management for kinbss.com
3. Update the A record:
   - **Type**: A
   - **Name**: @ (or leave blank)
   - **Value**: Your EC2 IP address (e.g., `18.123.45.67`)
   - **TTL**: 3600 (or 1 hour)
4. Add www subdomain (optional):
   - **Type**: CNAME
   - **Name**: www
   - **Value**: kinbss.com
   - **TTL**: 3600

5. Save changes

**Wait 5-60 minutes** for DNS to propagate.

### 10.2 Verify DNS

On your local computer:

**Mac/Linux:**
```bash
dig kinbss.com
```

**Windows:**
```powershell
nslookup kinbss.com
```

Look for your EC2 IP address in the results.

---

## STEP 11: Install SSL Certificate (HTTPS)

Once your domain is pointing to your server:

### 11.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 11.2 Generate SSL Certificate

```bash
sudo certbot --nginx -d kinbss.com -d www.kinbss.com
```

Follow the prompts:
- Enter your email address
- Agree to terms (Y)
- Share email with EFF (your choice)
- It will automatically configure SSL

### 11.3 Test Auto-Renewal

```bash
sudo certbot renew --dry-run
```

Should say "Congratulations, all simulated renewals succeeded".

---

## STEP 12: Security Hardening

### 12.1 Configure Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Type `y` to confirm.

Check status:
```bash
sudo ufw status
```

### 12.2 Install fail2ban (Protects Against Brute Force)

```bash
sudo apt install -y fail2ban
sudo systemctl start fail2ban
sudo systemctl enable fail2ban
```

---

## STEP 13: Set Up Automated Backups

### 13.1 Make Backup Script Executable

```bash
cd /home/bss-app/deployment/scripts
chmod +x backup.sh monitor.sh
```

### 13.2 Test Backup

```bash
./backup.sh
```

Check if backup was created:
```bash
ls -lh /home/backups/db/
```

### 13.3 Schedule Automated Backups

```bash
crontab -e
```

Choose nano editor (usually option 1).

Add these lines at the end:

```cron
# Database backup daily at 2 AM
0 2 * * * /home/bss-app/deployment/scripts/backup.sh >> /var/log/bss/backup.log 2>&1

# System monitoring every 5 minutes
*/5 * * * * /home/bss-app/deployment/scripts/monitor.sh >> /var/log/bss/monitor.log 2>&1

# SSL certificate renewal (weekly)
0 3 * * 0 sudo certbot renew --quiet
```

Save: `Ctrl+X`, `Y`, `Enter`

---

## STEP 14: Final Testing

### 14.1 Test HTTPS Access

On your local computer, open a web browser and go to:
```
https://kinbss.com
```

You should see the BSS login page with a green padlock (secure connection).

### 14.2 Test Login

Try logging in with a test account.

### 14.3 Check Server Health

On your server:

```bash
pm2 status              # Application should be online
sudo systemctl status nginx    # Should be active (running)
sudo systemctl status fail2ban # Should be active (running)
```

### 14.4 Monitor Logs

```bash
# Application logs
pm2 logs bss-production --lines 100

# Nginx access logs
sudo tail -f /var/log/nginx/bss_access.log

# Nginx error logs (in another terminal)
sudo tail -f /var/log/nginx/bss_error.log
```

---

## 🎉 DEPLOYMENT COMPLETE!

Your BlindSpot System is now live at **https://kinbss.com**!

---

## 📊 Monthly Cost Breakdown

| Service | Specification | Monthly Cost |
|---------|---------------|--------------|
| EC2 t2.medium | 2 vCPU, 4GB RAM | ~$34 |
| RDS PostgreSQL | db.t3.small | ~$30 |
| EBS Storage | 40GB | ~$4 |
| RDS Storage | 20GB | ~$2.30 |
| Data Transfer | ~100GB | ~$9 |
| **Total** | | **~$79/month** |

*Costs may vary based on usage and region*

---

## 🔧 Common Commands

### Application Management
```bash
pm2 restart bss-production   # Restart app
pm2 stop bss-production      # Stop app
pm2 logs bss-production      # View logs
pm2 monit                    # Real-time monitoring
```

### Deploy Updates
```bash
cd /home/bss-app
git pull                     # Get latest code
npm install                  # Install new dependencies
npm run build                # Build frontend
pm2 restart bss-production   # Restart app
```

### Database Backup (Manual)
```bash
/home/bss-app/deployment/scripts/backup.sh
```

### Check System Resources
```bash
htop                        # CPU, Memory usage
df -h                       # Disk usage
free -m                     # Memory usage
```

---

## 🆘 Troubleshooting

### Application Won't Start
```bash
pm2 logs bss-production --lines 100    # Check error logs
pm2 delete bss-production               # Delete process
pm2 start ecosystem.config.js           # Restart
```

### Can't Connect to Database
```bash
psql $DATABASE_URL -c "SELECT 1"        # Test connection
# Check security group allows EC2 to connect to RDS
```

### Nginx Errors
```bash
sudo nginx -t                           # Test config
sudo tail -f /var/log/nginx/error.log   # View errors
sudo systemctl restart nginx            # Restart
```

### SSL Certificate Issues
```bash
sudo certbot certificates               # Check status
sudo certbot renew                      # Renew manually
```

---

## 📞 Need Help?

- Check logs: `pm2 logs` and `/var/log/nginx/`
- Run health check: `/home/bss-app/deployment/scripts/monitor.sh`
- Review AWS CloudWatch for instance metrics
- Contact support: it@saudikinzhal.org

---

**Made with ❤️ by Kinzhal LTD Co.**
