# BlindSpot System - Deployment Package for Alibaba Cloud

This directory contains all the necessary scripts, configurations, and documentation needed to deploy the BlindSpot System (BSS) on Alibaba Cloud ECS infrastructure.

## 📁 Directory Structure

```
deployment/
├── configs/                    # Configuration files
│   ├── .env.production        # Production environment variables template
│   ├── ecosystem.config.js    # PM2 process manager configuration
│   └── nginx-bss.conf         # Nginx reverse proxy configuration
├── scripts/                    # Deployment and maintenance scripts
│   ├── deploy.sh              # Main deployment script
│   ├── migrate-database.sh    # Database migration from Neon to Alibaba
│   ├── backup.sh              # Automated backup script
│   ├── monitor.sh             # Health monitoring script
│   └── security-setup.sh      # Security hardening script
├── docs/                       # Documentation
│   ├── infrastructure-setup.md    # ECS and infrastructure guide
│   ├── disaster-recovery.md       # Disaster recovery procedures
│   └── deployment-checklist.md    # Step-by-step deployment guide
└── README.md                   # This file
```

## 🚀 Quick Start

### 1. Prerequisites

Before starting, ensure you have:
- Alibaba Cloud account with billing enabled
- Domain name (optional but recommended)
- Access to current Neon database (for migration)
- SSH access to Alibaba Cloud ECS instance

### 2. Infrastructure Setup

Follow the comprehensive guide:
```bash
cat docs/infrastructure-setup.md
```

Key steps:
1. Create ECS instance (Ubuntu 20.04, 2GB RAM minimum)
2. Set up RDS PostgreSQL or install PostgreSQL locally
3. Configure security groups and firewall
4. Allocate Elastic IP and configure DNS

### 3. Database Migration

If migrating from Neon to Alibaba Cloud:

```bash
# Make script executable
chmod +x scripts/migrate-database.sh

# Run migration
./scripts/migrate-database.sh

# Follow the interactive prompts to:
# - Enter source database (Neon) credentials
# - Enter target database (Alibaba) credentials
# - Export and import data
# - Verify migration
```

### 4. Application Deployment

Use the main deployment script:

```bash
# Make deploy script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh
```

The script will:
- Create backups
- Pull latest code
- Install dependencies
- Build React frontend
- Run database migrations
- Configure PM2 process manager
- Reload Nginx
- Perform health checks

### 5. Security Hardening

Run the security setup script (requires root):

```bash
chmod +x scripts/security-setup.sh
sudo ./scripts/security-setup.sh
```

This configures:
- UFW firewall
- fail2ban for SSH protection
- SSL certificates (via Certbot)
- Automatic security updates
- Secure file permissions

### 6. Configure Automated Backups

Set up cron jobs for automated backups and monitoring:

```bash
# Edit crontab
crontab -e

# Add these lines:
0 2 * * * /home/bss-app/deployment/scripts/backup.sh >> /var/log/bss/backup.log 2>&1
*/5 * * * * /home/bss-app/deployment/scripts/monitor.sh >> /var/log/bss/monitor.log 2>&1
```

## 📋 Deployment Checklist

For a complete step-by-step checklist, see:
```bash
cat docs/deployment-checklist.md
```

This includes:
- ✅ Pre-deployment preparation
- ✅ Server setup and configuration
- ✅ Application deployment
- ✅ Security hardening
- ✅ Backup configuration
- ✅ Monitoring setup
- ✅ Final verification
- ✅ Cost optimization tips

## 🔧 Configuration Files

### Environment Variables (.env.production)

Copy and customize for your environment:

```bash
cp configs/.env.production /home/bss-app/.env
nano /home/bss-app/.env
```

Required updates:
- `DATABASE_URL` - Your Alibaba RDS or local PostgreSQL connection
- `SESSION_SECRET` - Generate with: `openssl rand -base64 32`
- `MOYASAR_API_KEY` - Your Moyasar payment gateway key
- `RESEND_API_KEY` - Your Resend email service key
- `FRONTEND_URL` - Your production domain (https://yourdomain.com)

### PM2 Configuration (ecosystem.config.js)

Manages Node.js application processes with:
- Cluster mode (2 instances by default)
- Auto-restart on crashes
- Log rotation
- Memory limits

### Nginx Configuration (nginx-bss.conf)

Reverse proxy configuration with:
- HTTP to HTTPS redirect
- SSL/TLS security
- Static file serving
- API proxying
- WebSocket support
- Security headers

## 🛠️ Maintenance Scripts

### Deploy New Version

```bash
cd /home/bss-app
./deployment/scripts/deploy.sh
```

### Manual Backup

```bash
./deployment/scripts/backup.sh
```

Backups are stored in:
- Local: `/home/backups/`
- Remote: Alibaba OSS bucket (if configured)

### Health Check

```bash
./deployment/scripts/monitor.sh
```

Checks:
- Application status (PM2)
- Disk space
- Memory usage
- CPU usage
- Database connectivity
- Nginx status
- SSL certificate expiry

### Rollback Deployment

```bash
./deployment/scripts/deploy.sh rollback
```

## 🚨 Disaster Recovery

For disaster recovery procedures, see:
```bash
cat docs/disaster-recovery.md
```

Covers:
- Application crash recovery
- Database restoration
- Server failure
- Complete data loss
- Security breach response

## 💰 Cost Optimization

### Estimated Monthly Costs

**Standard Setup:**
- ECS Instance (c6.large): $50
- RDS PostgreSQL: $30
- OSS Storage: $3
- Bandwidth: $10
- **Total: ~$93/month**

**Optimized Setup:**
- ECS Reserved Instance: $35 (save $15)
- RDS Reserved Instance: $20 (save $10)
- Optimized Storage: $2 (save $1)
- CDN + Compression: $7 (save $3)
- Free CloudMonitor: $0 (save $15)
- **Total: ~$64/month (Save $44/month = $528/year)**

See `docs/deployment-checklist.md` for detailed cost optimization strategies.

## 📊 Monitoring

### Application Logs

```bash
# PM2 logs
pm2 logs bss-production

# Application logs
tail -f /var/log/bss/pm2-combined.log

# Nginx access logs
tail -f /var/log/nginx/bss_access.log

# Nginx error logs
tail -f /var/log/nginx/bss_error.log
```

### System Monitoring

```bash
# PM2 dashboard
pm2 monit

# System resources
htop

# Disk usage
df -h

# Memory usage
free -m
```

### Alibaba CloudMonitor

Access via Alibaba Cloud Console:
1. Navigate to CloudMonitor
2. Select ECS instance
3. View CPU, Memory, Disk, Network metrics
4. Configure alerts for thresholds

## 🔒 Security Best Practices

1. **Keep secrets secure:**
   - Never commit `.env` to version control
   - Use Alibaba KMS for sensitive keys
   - Rotate API keys regularly

2. **Regular updates:**
   - System packages: `sudo apt update && sudo apt upgrade`
   - npm packages: `npm audit fix`
   - Security patches: Automatic via unattended-upgrades

3. **Access control:**
   - Use SSH keys (disable password auth)
   - Enable MFA for Alibaba Cloud console
   - Restrict firewall rules to known IPs

4. **Monitoring:**
   - Review logs daily
   - Set up alerts for anomalies
   - Use fail2ban for brute-force protection

## 📞 Support

### Documentation
- Infrastructure Setup: `docs/infrastructure-setup.md`
- Deployment Checklist: `docs/deployment-checklist.md`
- Disaster Recovery: `docs/disaster-recovery.md`

### Alibaba Cloud Resources
- Documentation: https://www.alibabacloud.com/help
- Support Portal: https://www.alibabacloud.com/support
- Community Forums: https://www.alibabacloud.com/community

### Emergency Procedures

For critical issues:
1. Check application status: `pm2 status`
2. Review recent logs: `pm2 logs --lines 100`
3. Run health check: `./scripts/monitor.sh`
4. Follow disaster recovery guide
5. Contact system administrator

## 📝 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-01-18 | Initial deployment package created |

## 📄 License

This deployment package is part of the BlindSpot System (BSS) project.

---

**Made with ❤️ by Kinzhal LTD Co.**