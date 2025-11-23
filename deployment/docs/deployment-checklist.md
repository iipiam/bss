# BlindSpot System - Deployment Checklist & Cost Optimization Guide

## Pre-Deployment Checklist

### 1. Infrastructure Preparation

#### Cloud Provider Account Setup
- [ ] Create cloud provider account
- [ ] Set up billing alerts
- [ ] Enable MFA (Multi-Factor Authentication)
- [ ] Create IAM users for team members
- [ ] Configure billing budget ($200/month recommended)

#### Network Configuration
- [ ] Create VPC with CIDR 172.16.0.0/16
- [ ] Create public subnet (172.16.1.0/24)
- [ ] Create private subnet (172.16.2.0/24)
- [ ] Allocate Elastic IP address
- [ ] Configure security groups:
  - [ ] SSH (22) from your IP
  - [ ] HTTP (80) from anywhere
  - [ ] HTTPS (443) from anywhere
  - [ ] PostgreSQL (5432) from VPC only

#### Cloud Server Instance
- [ ] Launch cloud server instance (2 vCPU, 4GB RAM recommended)
- [ ] Select Ubuntu 20.04 LTS
- [ ] Attach Elastic IP
- [ ] Create 40GB system disk
- [ ] (Optional) Add 100GB data disk for files
- [ ] Set instance name: `bss-production`
- [ ] Add tags: `Environment=Production`, `Project=BSS`

#### Database Setup
**Option A: Managed Database (Recommended)**
- [ ] Create managed PostgreSQL 14 instance
- [ ] Instance type: 2 vCPU, 4GB RAM
- [ ] Enable multi-zone deployment
- [ ] Configure 100GB SSD storage
- [ ] Set up automatic backups (30-day retention)
- [ ] Whitelist server security group
- [ ] Enable SSL connection
- [ ] Note down connection endpoint

**Option B: Self-Managed PostgreSQL**
- [ ] Skip managed database setup
- [ ] Will install PostgreSQL on cloud server during setup

#### Object Storage
- [ ] Create object storage bucket: `bss-production`
- [ ] Set bucket to private access
- [ ] Configure lifecycle rules:
  - [ ] Move to IA storage after 30 days
  - [ ] Delete backups older than 90 days
- [ ] Enable versioning for critical folders

#### Domain & DNS
- [ ] Purchase domain or use existing
- [ ] Create DNS A record pointing to Elastic IP
- [ ] (Optional) Create www subdomain
- [ ] (Optional) Create api subdomain
- [ ] Verify DNS propagation

---

### 2. Server Setup

#### Initial Access
```bash
# Generate SSH key pair in cloud provider console
# Download private key file (e.g., bss-key.pem)

# Set correct permissions
chmod 400 bss-key.pem

# SSH into server
ssh -i bss-key.pem root@YOUR_SERVER_IP
```

#### System Update
```bash
sudo apt update && sudo apt upgrade -y
sudo reboot
```

#### Install Node.js
```bash
curl -sL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt install -y nodejs
node -v  # Should show v18.x
npm -v
```

#### Install PM2
```bash
sudo npm install -g pm2
pm2 --version
```

#### Install Nginx
```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx
sudo systemctl status nginx
```

#### Install PostgreSQL Client (if using managed database)
```bash
sudo apt install -y postgresql-client
```

#### Install PostgreSQL Server (if self-managed)
```bash
sudo apt install -y postgresql-14 postgresql-client-14
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql
CREATE DATABASE bss_production;
CREATE USER bss_user WITH ENCRYPTED PASSWORD 'YourStrongPassword';
GRANT ALL PRIVILEGES ON DATABASE bss_production TO bss_user;
\q
```

#### Create Application User
```bash
sudo useradd -m -s /bin/bash bss-user
sudo usermod -aG sudo bss-user
```

#### Create Directory Structure
```bash
sudo mkdir -p /home/bss-app
sudo mkdir -p /var/bss/{invoices,uploads,temp}
sudo mkdir -p /var/log/bss
sudo mkdir -p /home/backups/{db,app,files}

sudo chown -R bss-user:bss-user /home/bss-app
sudo chown -R bss-user:bss-user /var/bss
sudo chown -R bss-user:bss-user /var/log/bss
sudo chown -R bss-user:bss-user /home/backups
```

---

### 3. Application Deployment

#### Clone Repository
```bash
# Switch to bss-user
su - bss-user

# Clone repository
git clone https://github.com/your-org/bss.git /home/bss-app
cd /home/bss-app
```

#### Environment Configuration
```bash
# Copy production environment template
cp deployment/configs/.env.production .env

# Edit with actual values
nano .env

# Required updates:
# - DATABASE_URL=postgresql://user:pass@host:5432/bss_production
# - SESSION_SECRET=<generate with: openssl rand -base64 32>
# - MOYASAR_API_KEY=<your_key>
# - RESEND_API_KEY=<your_key>
# - FRONTEND_URL=https://yourdomain.com
```

#### Install Dependencies
```bash
npm install --production
```

#### Build Application
```bash
npm run build

# Verify dist folder exists
ls -lh dist/
```

#### Database Migration
```bash
# Run database migrations
npm run db:push

# Verify tables created
psql $DATABASE_URL -c "\dt"
```

#### Configure PM2
```bash
# Copy PM2 config
cp deployment/configs/ecosystem.config.js .

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup systemd -u bss-user --hp /home/bss-user
# Run the command it outputs

# Verify application is running
pm2 status
pm2 logs bss-production --lines 50
```

---

### 4. Nginx Configuration

#### Configure Nginx
```bash
# Copy Nginx configuration
sudo cp /home/bss-app/deployment/configs/nginx-bss.conf /etc/nginx/sites-available/bss

# Update domain name in config
sudo nano /etc/nginx/sites-available/bss
# Change: yourdomain.com to your actual domain

# Enable site
sudo ln -s /etc/nginx/sites-available/bss /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### Generate SSL Certificate
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

---

### 5. Security Hardening

#### Run Security Setup Script
```bash
cd /home/bss-app/deployment/scripts
sudo chmod +x security-setup.sh
sudo ./security-setup.sh
```

#### Configure Firewall
```bash
sudo ufw status
# Verify ports 22, 80, 443 are allowed
```

#### Set Up fail2ban
```bash
sudo systemctl status fail2ban
sudo fail2ban-client status sshd
```

---

### 6. Backup Configuration

#### Make Scripts Executable
```bash
cd /home/bss-app/deployment/scripts
chmod +x backup.sh monitor.sh
```

#### Configure Cron Jobs
```bash
crontab -e

# Add these lines:
# Database backup (daily at 2 AM)
0 2 * * * /home/bss-app/deployment/scripts/backup.sh >> /var/log/bss/backup.log 2>&1

# System monitoring (every 5 minutes)
*/5 * * * * /home/bss-app/deployment/scripts/monitor.sh >> /var/log/bss/monitor.log 2>&1

# SSL renewal (weekly)
0 3 * * 0 sudo certbot renew --quiet
```

#### Test Backup
```bash
# Run manual backup
./backup.sh

# Verify backups created
ls -lh /home/backups/db/
ls -lh /home/backups/app/
```

---

### 7. Monitoring Setup

#### Configure Cloud Monitoring
- [ ] Enable monitoring service for cloud server instance
- [ ] Set up CPU usage alert (> 80%)
- [ ] Set up memory usage alert (> 90%)
- [ ] Set up disk usage alert (> 85%)
- [ ] Configure alert contacts

#### Test Monitoring
```bash
# Run monitor script
./monitor.sh

# Check logs
tail -f /var/log/bss/monitor.log
```

---

### 8. Final Verification

#### Application Health Checks
- [ ] Access https://yourdomain.com
- [ ] Verify SSL certificate is valid
- [ ] Test user login functionality
- [ ] Create a test order/transaction
- [ ] Verify PDF invoice generation
- [ ] Test WebSocket connections
- [ ] Check database connectivity
- [ ] Verify file uploads work

#### Performance Checks
```bash
# Check response time
curl -w "@-" -o /dev/null -s https://yourdomain.com << 'EOF'
time_namelookup:  %{time_namelookup}\n
time_connect:  %{time_connect}\n
time_total:  %{time_total}\n
EOF

# Check PM2 metrics
pm2 monit
```

#### Security Checks
- [ ] Verify HTTPS redirect works
- [ ] Check security headers
- [ ] Test rate limiting
- [ ] Verify file permissions
- [ ] Check fail2ban logs

---

## Cost Optimization Guide

### 1. Right-Sizing Resources

#### Cloud Server Instance Optimization
**Current:** 2 vCPU, 4GB RAM - ~$50/month

**Optimization Options:**
- **Light Traffic (<100 users/day):** Use 1 vCPU, 2GB - Save $25/month
- **Heavy Traffic (>1000 users/day):** Use Reserved Instance - Save 30-50%
- **Variable Traffic:** Use auto-scaling + pay-as-you-go

#### Database Optimization
**Current:** Managed database (2 vCPU, 4GB RAM) - ~$30/month

**Optimization Options:**
- **Small Scale:** Self-managed PostgreSQL on cloud server - Save $30/month
- **Predictable Load:** Purchase Reserved Instance - Save 30%
- **Read-Heavy Workload:** Add read replicas instead of larger instance

### 2. Storage Optimization

#### Object Storage Best Practices
- Enable lifecycle rules to move old backups to infrequent access storage
- Delete unnecessary logs after 30 days
- Compress backups before uploading
- Use storage query services for querying data without downloading

**Estimated Savings:** $5-10/month

### 3. Bandwidth Optimization

#### Current Cost:** ~$10/month for 100GB

**Optimization Options:**
- Enable CDN for static assets - Reduce origin bandwidth
- Optimize images (compression, WebP format)
- Enable Gzip/Brotli compression in Nginx
- Implement client-side caching

**Estimated Savings:** $3-5/month

### 4. Monitoring & Alerts

**Free Tier Usage:**
- Use monitoring service free tier (sufficient for single instance)
- Implement custom monitoring with cron scripts
- Use open-source tools (Grafana + Prometheus)

**Estimated Savings:** $10-15/month

### 5. Backup Optimization

#### Current Strategy
- Local backups: Free (using server storage)
- Object storage backups: ~$3/month

**Optimization:**
- Keep only last 7 days locally
- Use infrequent access storage for older backups
- Delete backups older than 90 days

**Estimated Savings:** $2-3/month

### 6. Reserved Instances

For predictable workloads, purchase Reserved Instances:

| Period | Discount | Monthly Savings (2 vCPU, 4GB RAM) |
|--------|----------|-----------------------------------|
| 1 Year | 30% | $15/month |
| 3 Years | 50% | $25/month |

### 7. Development vs Production

**Run separate dev/staging on smaller instances:**
- Dev: 1 vCPU, 1GB RAM - $12/month
- Only run during business hours - Save 60%
- Use snapshots instead of running instance

### 8. Cost Monitoring

Set up budget alerts:
```bash
# Monthly budget: $100
- Alert at 50% ($50)
- Alert at 80% ($80)
- Alert at 100% ($100)
```

### Optimized Cost Breakdown

| Component | Standard | Optimized | Savings |
|-----------|----------|-----------|---------|
| Cloud Server | $50 | $35 (Reserved) | $15 |
| Managed Database | $30 | $20 (Reserved) | $10 |
| Object Storage | $3 | $2 (IA + cleanup) | $1 |
| Bandwidth | $10 | $7 (CDN + optimization) | $3 |
| Monitoring | $15 | $0 (Free tier) | $15 |
| **Total** | **$108** | **$64** | **$44/month** |

**Annual Savings: $528**

---

## Post-Deployment Tasks

### Week 1
- [ ] Monitor application logs daily
- [ ] Check backup success
- [ ] Review CloudMonitor alerts
- [ ] Document any issues

### Week 2
- [ ] Performance tuning based on real traffic
- [ ] Optimize database queries
- [ ] Review and adjust auto-scaling rules
- [ ] Update documentation

### Month 1
- [ ] Conduct disaster recovery drill
- [ ] Review cost optimization opportunities
- [ ] Plan capacity for growth
- [ ] Update team documentation

---

## Rollback Plan

If deployment fails:

```bash
# 1. Stop new deployment
pm2 stop bss-production

# 2. Restore previous version
cd /home/bss-app
git reset --hard HEAD~1

# 3. Restore database from backup
gunzip < /home/backups/db/bss_db_YYYYMMDD.sql.gz | psql $DATABASE_URL

# 4. Restart application
pm2 restart bss-production

# 5. Verify
curl http://localhost:5000/api/health
```

---

## Support & Maintenance

### Regular Maintenance Schedule
- **Daily:** Monitor logs and alerts
- **Weekly:** Review performance metrics
- **Monthly:** Security updates, backup tests
- **Quarterly:** Disaster recovery drill, cost review
- **Annually:** Infrastructure audit, capacity planning

### Getting Help
- Cloud Provider Support: Contact your cloud provider's support
- BSS Documentation: /home/bss-app/deployment/docs/
- Emergency Contacts: See disaster-recovery.md

---

## Deployment Completion

When all items are checked:
- [ ] Application is accessible and functional
- [ ] SSL certificate is active
- [ ] Backups are running automatically
- [ ] Monitoring is configured
- [ ] Security hardening is complete
- [ ] Team has been trained
- [ ] Documentation is updated
- [ ] Go-live communication sent

**Congratulations! BlindSpot System is now deployed on your cloud infrastructure! 🎉**