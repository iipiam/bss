# BlindSpot System - Disaster Recovery Plan

## Overview
This document outlines the disaster recovery procedures for the BlindSpot System deployed on cloud infrastructure. It covers various failure scenarios and provides step-by-step recovery instructions.

## Recovery Time Objectives (RTO) & Recovery Point Objectives (RPO)

| Scenario | RTO | RPO | Priority |
|----------|-----|-----|----------|
| Application Crash | 5 minutes | 0 minutes | Critical |
| Database Corruption | 30 minutes | 24 hours | Critical |
| Server Failure | 2 hours | 24 hours | High |
| Complete Data Loss | 4 hours | 24 hours | High |
| Security Breach | Immediate | N/A | Critical |

## Backup Strategy

### Automated Backups
- **Database**: Daily at 2:00 AM (retained for 30 days)
- **Application**: Weekly on Sunday at 3:00 AM (retained for 7 days)
- **Files**: Daily at 2:30 AM (retained for 7 days)
- **Location**: Local `/home/backups` + object storage

### Manual Backup (Before Major Changes)
```bash
cd /home/bss-app/deployment/scripts
sudo ./backup.sh
```

## Disaster Recovery Procedures

### 1. Application Crash Recovery

**Symptoms:**
- PM2 shows app as "errored" or "stopped"
- Health check endpoint returns error
- Users cannot access the application

**Recovery Steps:**
```bash
# Check PM2 status
pm2 status bss-production

# View recent logs
pm2 logs bss-production --lines 100

# Restart application
pm2 restart bss-production

# If restart fails, reload from codebase
cd /home/bss-app
git stash
git pull origin main
npm install
npm run build
pm2 restart bss-production

# Verify recovery
curl http://localhost:5000/api/health
```

**Verification:**
- Application shows "online" in PM2
- Health endpoint returns 200 OK
- Users can log in successfully

---

### 2. Database Corruption or Failure

**Symptoms:**
- Database connection errors
- SQL query failures
- Data inconsistencies

**Recovery Steps:**

**A. Minor Corruption (Recent Data Loss Acceptable)**
```bash
# Stop application
pm2 stop bss-production

# Attempt database repair
sudo -u postgres psql bss_production -c "REINDEX DATABASE bss_production;"

# Restart application
pm2 restart bss-production
```

**B. Major Corruption (Full Restore Required)**
```bash
# 1. Stop application
pm2 stop bss-production

# 2. Identify latest backup
ls -lh /home/backups/db/
# Choose: bss_db_YYYYMMDD.sql.gz

# 3. Drop existing database (DESTRUCTIVE!)
sudo -u postgres psql -c "DROP DATABASE bss_production;"
sudo -u postgres psql -c "CREATE DATABASE bss_production;"

# 4. Restore from backup
gunzip < /home/backups/db/bss_db_20250118.sql.gz | sudo -u postgres psql bss_production

# 5. Verify restoration
sudo -u postgres psql bss_production -c "SELECT COUNT(*) FROM users;"

# 6. Restart application
pm2 restart bss-production
```

**Verification:**
- Database queries work correctly
- User data is accessible
- No connection errors in logs

---

### 3. Server Failure (Cloud Instance Down)

**Symptoms:**
- Cannot SSH to server
- Application completely unreachable
- Cloud provider console shows instance stopped

**Recovery Steps:**

**A. Instance Restart**
```bash
# Via Cloud Provider Console:
1. Navigate to Instance/Server Console
2. Select the failed instance
3. Click "Restart"
4. Wait for instance to be "Running"
5. SSH into server
6. Verify all services: pm2 status, systemctl status nginx
```

**B. Instance Replacement (if hardware failure)**
```bash
# 1. Launch new cloud instance (same specs)
# 2. Attach existing data disk (if separate)
# 3. Install dependencies:
sudo apt update && sudo apt upgrade -y
curl -sL https://deb.nodesource.com/setup_18.x | sudo bash -
sudo apt install -y nodejs nginx postgresql-client
npm install -g pm2

# 4. Clone repository
git clone https://github.com/your-org/bss.git /home/bss-app
cd /home/bss-app

# 5. Restore application from backup
tar -xzf /home/backups/app/bss_app_latest.tar.gz -C /home/bss-app

# 6. Restore database (if not using managed database)
# Follow database restoration steps above

# 7. Configure environment
cp deployment/configs/.env.production .env
# Update .env with correct values

# 8. Start services
pm2 start ecosystem.config.js
sudo systemctl start nginx

# 9. Update DNS to point to new IP address
```

**Verification:**
- Application accessible from new IP
- All data intact
- All features functional

---

### 4. Complete Data Loss (Multiple Failures)

**Symptoms:**
- Both primary and local backups lost
- Only object storage backups remain

**Recovery Steps:**

```bash
# 1. Set up new server (follow Server Failure steps 1-3)

# 2. Download backups from object storage
# Replace with your cloud provider's CLI tool
# aws s3 cp s3://bss-backups/db/bss_db_latest.sql.gz /home/backups/db/
# gsutil cp gs://bss-backups/app/bss_app_latest.tar.gz /home/backups/app/

# 3. Restore database
gunzip < /home/backups/db/bss_db_latest.sql.gz | sudo -u postgres psql bss_production

# 4. Restore application
tar -xzf /home/backups/app/bss_app_latest.tar.gz -C /home/bss-app

# 5. Restore files
# Replace with your cloud provider's CLI tool
# aws s3 cp s3://bss-backups/files/ /var/bss/ --recursive
# gsutil -m cp -r gs://bss-backups/files/* /var/bss/

# 6. Configure and start
cd /home/bss-app
npm install
npm run build
pm2 start ecosystem.config.js
sudo systemctl start nginx
```

---

### 5. Security Breach

**Immediate Actions:**
```bash
# 1. ISOLATE - Block all incoming traffic
sudo ufw deny 80/tcp
sudo ufw deny 443/tcp

# 2. STOP APPLICATION
pm2 stop all
sudo systemctl stop nginx

# 3. PRESERVE EVIDENCE
sudo tar -czf /home/forensics_$(date +%Y%m%d_%H%M%S).tar.gz \
    /var/log/nginx/ \
    /var/log/bss/ \
    ~/.bash_history

# 4. ASSESS DAMAGE
# Check recent logins
last -n 50
# Check modified files
find /home/bss-app -type f -mtime -1

# 5. NOTIFY STAKEHOLDERS
# Contact security team
# Notify affected customers
```

**Recovery Steps:**
```bash
# 1. Change all passwords
tsx scripts/reset-password.ts admin NewSecurePass123!
# Repeat for all accounts

# 2. Rotate all API keys
# Update MOYASAR_API_KEY, RESEND_API_KEY, etc.

# 3. Review and patch vulnerabilities
sudo apt update && sudo apt upgrade -y
npm audit fix

# 4. Restore from clean backup (pre-breach)
# Follow database and application restore procedures

# 5. Re-enable firewall with stricter rules
sudo ufw allow from KNOWN_IP to any port 22
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# 6. Start services
pm2 restart all
sudo systemctl start nginx

# 7. Monitor closely
tail -f /var/log/nginx/access.log /var/log/bss/*.log
```

---

### 6. Nginx Failure

**Symptoms:**
- 502 Bad Gateway errors
- Cannot reach application

**Recovery Steps:**
```bash
# Check Nginx status
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# If config is corrupted, restore from backup
sudo cp deployment/configs/nginx-bss.conf /etc/nginx/sites-available/bss
sudo nginx -t
sudo systemctl restart nginx
```

---

## Recovery Testing Schedule

### Monthly (1st Sunday)
- Test database restoration from backup
- Verify backup integrity
- Document recovery time

### Quarterly
- Full disaster recovery drill
- Test complete server rebuild
- Update documentation

### Annually
- Review and update disaster recovery plan
- Conduct tabletop exercises
- Update RTO/RPO targets

## Emergency Contacts

| Role | Name | Contact | Available |
|------|------|---------|-----------|
| System Admin | [Name] | [Phone/Email] | 24/7 |
| Database Admin | [Name] | [Phone/Email] | Business Hours |
| Security Lead | [Name] | [Phone/Email] | 24/7 |
| DevOps Lead | [Name] | [Phone/Email] | 24/7 |

## Incident Log Template

```
Incident ID: BSS-[YYYYMMDD]-[###]
Date/Time: [YYYY-MM-DD HH:MM]
Severity: [Critical/High/Medium/Low]
Reported By: [Name]
Issue: [Brief description]

Timeline:
- [HH:MM] Issue detected
- [HH:MM] Response initiated
- [HH:MM] Issue resolved

Actions Taken:
1. [Action 1]
2. [Action 2]

Root Cause: [Description]
Prevention: [Steps to prevent recurrence]
Lessons Learned: [Key takeaways]
```

## Post-Recovery Checklist

After any recovery procedure:

- [ ] Verify all services are running
- [ ] Test user login functionality
- [ ] Verify data integrity
- [ ] Check all API endpoints
- [ ] Monitor logs for 24 hours
- [ ] Document incident
- [ ] Update recovery procedures if needed
- [ ] Notify stakeholders of resolution
- [ ] Schedule post-mortem meeting
- [ ] Implement preventive measures

## Automated Recovery

Some issues are handled automatically by monitoring scripts:

- Application crashes → Auto-restart by PM2
- Health check failures → Auto-restart by monitor.sh
- Nginx down → Auto-restart by monitor.sh
- Disk space warnings → Auto-cleanup + alerts

## Backup Validation

Regular backup validation is critical:

```bash
# Weekly backup validation
cd /home/backups/db
LATEST=$(ls -t bss_db_*.sql.gz | head -1)

# Test database backup integrity
gunzip -c $LATEST | head -100

# Verify backup size (should be > 1MB)
du -h $LATEST
```

## Important Notes

1. **Always backup before any major change**
2. **Test recoveries in staging first**
3. **Document all recovery actions**
4. **Keep this document updated**
5. **Have multiple communication channels**

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-01-18 | Initial disaster recovery plan | BSS Team |