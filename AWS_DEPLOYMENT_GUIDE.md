# RestoPOS - AWS Deployment Guide

## Overview

RestoPOS is a multi-tenant SaaS restaurant management platform designed for deployment on AWS Cloud. This guide covers the complete deployment process for 750+ restaurant clients in Saudi Arabia.

## Architecture Overview

**Stack:**
- **Frontend**: React + TypeScript (Vite build)
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (AWS RDS recommended)
- **Session Store**: PostgreSQL-backed sessions
- **File Storage**: Local filesystem (can be migrated to S3)

**Target AWS Services:**
- **Compute**: EC2, ECS (Fargate), or Elastic Beanstalk
- **Database**: RDS PostgreSQL (Multi-AZ for high availability)
- **Load Balancer**: Application Load Balancer (ALB)
- **Domain**: Route 53 for DNS management
- **SSL/TLS**: AWS Certificate Manager (ACM)
- **Monitoring**: CloudWatch Logs & Metrics

---

## Prerequisites

### 1. AWS Account Setup
- AWS account with appropriate permissions
- AWS CLI installed and configured
- IAM user/role with permissions for EC2, RDS, ALB, Route 53, ACM

### 2. Third-Party Service Accounts
- **Moyasar**: Payment gateway (SAMA-licensed for Saudi Arabia)
  - Register at https://moyasar.com
  - Obtain API keys (Test & Live)
- **Twilio**: WhatsApp OTP verification
  - Register at https://www.twilio.com
  - Set up WhatsApp Business API
  - Obtain Account SID, Auth Token, and WhatsApp-enabled phone number

---

## Environment Variables

### Required Production Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Node Environment
NODE_ENV=production
PORT=5000

# Database (AWS RDS PostgreSQL)
DATABASE_URL=postgresql://username:password@rds-endpoint.region.rds.amazonaws.com:5432/restopos

# Session Secret (Generate a strong random secret)
SESSION_SECRET=<generate-strong-random-secret-here>

# Moyasar Payment Gateway (Production Keys)
MOYASAR_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxx
VITE_MOYASAR_PUBLIC_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxxx

# Twilio WhatsApp API
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+14155238886

# Optional: Email Notifications (if SendGrid integrated)
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_USER=apikey
# SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxx
# EMAIL_FROM=noreply@restopos.com
# IT_EMAIL=support@restopos.com
```

### How to Generate SESSION_SECRET

```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

---

## Database Setup (AWS RDS)

### 1. Create RDS PostgreSQL Instance

```bash
# Using AWS CLI
aws rds create-db-instance \
  --db-instance-identifier restopos-db \
  --db-instance-class db.t3.medium \
  --engine postgres \
  --engine-version 15.4 \
  --master-username restopos_admin \
  --master-user-password <strong-password> \
  --allocated-storage 100 \
  --storage-type gp3 \
  --vpc-security-group-ids sg-xxxxxxxxx \
  --db-subnet-group-name restopos-subnet-group \
  --backup-retention-period 7 \
  --multi-az \
  --publicly-accessible false \
  --tags Key=Name,Value=RestoPOS-Production
```

**Recommended Configuration:**
- **Instance Class**: db.t3.medium or db.m5.large (for production)
- **Storage**: 100 GB GP3 SSD (auto-scaling enabled)
- **Multi-AZ**: Yes (for high availability)
- **Backup**: 7-day retention
- **PostgreSQL Version**: 15.4+
- **Encryption**: At-rest encryption enabled

### 2. Initialize Database Schema

After RDS instance is created, run schema migration:

```bash
# Install dependencies
npm install

# Push database schema to RDS
npm run db:push
```

### 3. Seed Default Restaurant (Optional)

If you need to create a default admin restaurant:

```bash
# Run seed script
tsx server/scripts/seedDefaultRestaurant.ts
```

**Default Admin Credentials:**
- Username: `admin`
- Password: `admin123`
- **Important**: Change these immediately after first login!

---

## Application Deployment

### Option 1: EC2 Deployment

#### 1. Launch EC2 Instance

```bash
# Launch Ubuntu 22.04 LTS instance
aws ec2 run-instances \
  --image-id ami-xxxxxxxxx \
  --instance-type t3.medium \
  --key-name restopos-key \
  --security-group-ids sg-xxxxxxxxx \
  --subnet-id subnet-xxxxxxxxx \
  --user-data file://user-data.sh \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=RestoPOS-App}]'
```

#### 2. User Data Script (`user-data.sh`)

```bash
#!/bin/bash
# Update system
apt-get update
apt-get upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Create application directory
mkdir -p /opt/restopos
cd /opt/restopos

# Clone your repository (or use deployment pipeline)
# git clone https://github.com/yourorg/restopos.git .

# Install dependencies
npm install

# Build frontend
npm run build

# Set environment variables (or use AWS Secrets Manager)
cat > .env.production << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://...
SESSION_SECRET=...
MOYASAR_SECRET_KEY=...
VITE_MOYASAR_PUBLIC_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=...
EOF

# Start application with PM2
pm2 start npm --name restopos -- start
pm2 startup systemd
pm2 save
```

#### 3. Configure Security Group

Allow inbound traffic:
- **Port 5000**: Application (from ALB only)
- **Port 22**: SSH (from your IP only)

#### 4. Set Up Application Load Balancer (ALB)

```bash
# Create target group
aws elbv2 create-target-group \
  --name restopos-tg \
  --protocol HTTP \
  --port 5000 \
  --vpc-id vpc-xxxxxxxxx \
  --health-check-path /api/health

# Register EC2 instances
aws elbv2 register-targets \
  --target-group-arn arn:aws:elasticloadbalancing:... \
  --targets Id=i-xxxxxxxxx

# Create ALB
aws elbv2 create-load-balancer \
  --name restopos-alb \
  --subnets subnet-xxxxxxxx subnet-yyyyyyyy \
  --security-groups sg-xxxxxxxxx \
  --scheme internet-facing \
  --type application

# Create HTTPS listener (after ACM certificate)
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTPS \
  --port 443 \
  --certificates CertificateArn=arn:aws:acm:... \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

### Option 2: ECS (Fargate) Deployment

#### 1. Create Dockerfile

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build frontend (Vite build)
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install ALL dependencies (including tsx for TypeScript runtime)
COPY package*.json ./
RUN npm ci

# Copy built application and TypeScript source
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server
COPY --from=builder /app/shared ./shared

# Expose port
EXPOSE 5000

# Start application using tsx (TypeScript runtime)
CMD ["npx", "tsx", "server/index.ts"]
```

**Note**: This Dockerfile uses `tsx` to run TypeScript directly in production. For maximum performance, you can compile TypeScript to JavaScript:

**Alternative Dockerfile (Compiled JavaScript):**
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Build frontend
RUN npm run build

# Compile TypeScript to JavaScript
RUN npx tsc --project tsconfig.json

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --production

# Copy compiled JavaScript and built frontend
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/build ./build

EXPOSE 5000

CMD ["node", "build/server/index.js"]
```

For this alternative, add a `tsconfig.json` build configuration:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "outDir": "./build",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["server/**/*", "shared/**/*"],
  "exclude": ["node_modules", "dist", "client"]
}
```

#### 2. Build and Push to ECR

```bash
# Create ECR repository
aws ecr create-repository --repository-name restopos

# Build Docker image
docker build -t restopos:latest .

# Tag and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag restopos:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/restopos:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/restopos:latest
```

#### 3. Create ECS Task Definition

See `ecs-task-definition.json` (create separately)

#### 4. Create ECS Service

```bash
aws ecs create-service \
  --cluster restopos-cluster \
  --service-name restopos-service \
  --task-definition restopos:1 \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=restopos,containerPort=5000"
```

---

## SSL/TLS Configuration

### 1. Request ACM Certificate

```bash
aws acm request-certificate \
  --domain-name restopos.com \
  --subject-alternative-names "*.restopos.com" \
  --validation-method DNS
```

### 2. Validate Certificate

Add CNAME records to Route 53 as shown in ACM console.

### 3. Configure Route 53

```bash
# Create hosted zone (if not exists)
aws route53 create-hosted-zone --name restopos.com --caller-reference $(date +%s)

# Create A record pointing to ALB
aws route53 change-resource-record-sets \
  --hosted-zone-id Z1234567890ABC \
  --change-batch file://dns-record.json
```

**dns-record.json:**
```json
{
  "Changes": [{
    "Action": "CREATE",
    "ResourceRecordSet": {
      "Name": "restopos.com",
      "Type": "A",
      "AliasTarget": {
        "HostedZoneId": "Z35SXDOTRQ7X7K",
        "DNSName": "restopos-alb-xxxxxxxxx.us-east-1.elb.amazonaws.com",
        "EvaluateTargetHealth": false
      }
    }
  }]
}
```

---

## Monitoring & Logging

### 1. CloudWatch Logs

Configure application to send logs to CloudWatch:

```bash
# Install CloudWatch agent on EC2
sudo wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i amazon-cloudwatch-agent.deb

# Configure log groups
aws logs create-log-group --log-group-name /aws/restopos/application
aws logs create-log-group --log-group-name /aws/restopos/cron
```

### 2. CloudWatch Alarms

```bash
# CPU Utilization alarm
aws cloudwatch put-metric-alarm \
  --alarm-name restopos-high-cpu \
  --alarm-description "Alert when CPU exceeds 80%" \
  --metric-name CPUUtilization \
  --namespace AWS/EC2 \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2

# Database connections alarm
aws cloudwatch put-metric-alarm \
  --alarm-name restopos-db-connections \
  --alarm-description "Alert when DB connections exceed 80%" \
  --metric-name DatabaseConnections \
  --namespace AWS/RDS \
  --statistic Average \
  --period 300 \
  --threshold 80 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 2
```

---

## Production Checklist

### Before Deployment

- [ ] Update all environment variables (no test/development keys)
- [ ] Generate strong SESSION_SECRET
- [ ] Verify Moyasar production API keys
- [ ] Verify Twilio production credentials
- [ ] Configure AWS RDS with Multi-AZ
- [ ] Enable RDS encryption at rest
- [ ] Set up automated RDS backups
- [ ] Configure ALB security groups (HTTPS only)
- [ ] Request and validate ACM SSL certificate
- [ ] Configure Route 53 DNS records
- [ ] Set up CloudWatch logging
- [ ] Configure CloudWatch alarms
- [ ] Test database connectivity from EC2/ECS
- [ ] Change default admin credentials

### After Deployment

- [ ] Verify application is accessible via HTTPS
- [ ] Test restaurant signup flow end-to-end
- [ ] Verify Moyasar payment integration (small test payment)
- [ ] Verify Twilio WhatsApp OTP delivery
- [ ] Monitor CloudWatch logs for errors
- [ ] Set up monitoring dashboards
- [ ] Configure auto-scaling (if using ECS/EC2 Auto Scaling)
- [ ] Document incident response procedures
- [ ] Set up backup restoration testing schedule

---

## Scaling Recommendations

### For 750+ Restaurant Clients

**Compute:**
- **EC2**: Minimum 2x t3.large instances (for redundancy)
- **ECS Fargate**: 4-8 tasks (2 vCPU, 4 GB memory each)
- **Auto-scaling**: Scale based on CPU (target 60-70%)

**Database:**
- **RDS Instance**: db.m5.xlarge or larger
- **Storage**: Start with 200 GB, enable auto-scaling
- **Read Replicas**: Add 1-2 read replicas for analytics queries
- **Connection Pooling**: Configure max connections appropriately

**Caching** (Optional Future Enhancement):
- **ElastiCache Redis**: For session caching and frequently accessed data

---

## Security Best Practices

1. **Network Security:**
   - Use private subnets for EC2/ECS and RDS
   - Only ALB should be in public subnet
   - Configure security groups with least privilege

2. **Secrets Management:**
   - Use AWS Secrets Manager for sensitive credentials
   - Rotate secrets regularly (Moyasar, Twilio, database)

3. **Database Security:**
   - Disable public accessibility for RDS
   - Use VPC peering or VPN for admin access
   - Enable automated backups and point-in-time recovery

4. **Application Security:**
   - Keep dependencies updated (run `npm audit`)
   - Enable AWS WAF on ALB for DDoS protection
   - Implement rate limiting for signup/login endpoints

5. **Monitoring:**
   - Enable VPC Flow Logs
   - Configure AWS GuardDuty for threat detection
   - Set up AWS Config for compliance monitoring

---

## Cost Optimization

**Estimated Monthly Costs (for 750 restaurants):**

**Compute & Database:**
- **RDS PostgreSQL** (db.m5.xlarge, Multi-AZ, On-Demand): ~$500/month
- **RDS Read Replica** (db.m5.xlarge for analytics): ~$250/month
- **EC2 Instances** (4x t3.large, On-Demand): ~$240/month
  - Alternative: **ECS Fargate** (4 tasks, 2 vCPU, 4GB each): ~$280/month
- **EBS Storage** (4x 50GB GP3 for EC2): ~$40/month

**Networking & Security:**
- **Application Load Balancer**: ~$30/month
- **NAT Gateway** (2 AZs for high availability): ~$90/month
- **Data Transfer** (estimate): ~$150/month
- **Route 53** (hosted zone + queries): ~$5/month

**Monitoring & Logging:**
- **CloudWatch Logs** (30-day retention): ~$30/month
- **CloudWatch Metrics & Alarms**: ~$20/month

**Storage (Optional Future):**
- **S3** (for invoice archives, if migrated): ~$20/month

**Total On-Demand**: ~$1,355 - $1,500/month (before optimization)

**Cost Savings Strategies:**

1. **Reserved Instances (1-year commitment):**
   - RDS Reserved Instances: Save 30-40% (~$300/month savings)
   - EC2 Reserved Instances: Save 30-40% (~$100/month savings)
   - **Optimized Total**: ~$950 - $1,100/month

2. **Savings Plans (Compute):**
   - 1-year Compute Savings Plan: Save up to 42%
   - 3-year commitment: Save up to 66%

3. **Right-Sizing:**
   - Start with db.t3.xlarge for RDS if traffic is lower initially (~$150/month)
   - Scale up to db.m5.xlarge as client base grows
   - Use Auto Scaling to reduce idle instances during low-traffic hours

4. **Storage Optimization:**
   - Enable RDS storage auto-scaling (only pay for what you use)
   - Use S3 Glacier Deep Archive for invoices >1 year old (~$1/TB/month)
   - Implement CloudWatch Logs retention policies (30-90 days max)

5. **Network Optimization:**
   - Use CloudFront CDN for static assets (reduce data transfer costs)
   - Optimize database queries to reduce read replica usage

**Recommended Approach:**
- **Month 1-3**: On-Demand (~$1,400/month) - Test and optimize
- **Month 4+**: Purchase 1-year Reserved Instances (~$1,000/month)
- **At scale (750+ clients)**: 3-year commitment with auto-scaling (~$700-900/month)

---

## Rollback Strategy

### Database Rollback
1. Use RDS automated snapshots (point-in-time recovery)
2. Create manual snapshot before major schema changes
3. Test restoration procedure monthly

### Application Rollback
1. **EC2**: Use AMI snapshots, restore to previous version
2. **ECS**: Update service to previous task definition revision
3. **Blue-Green Deployment**: Maintain two ALB target groups

---

## Support & Maintenance

### Cron Jobs
- Signup draft cleanup runs every hour (automatic)
- Monitor CloudWatch Logs: `/aws/restopos/cron`

### Database Maintenance
- Weekly: Monitor slow queries via RDS Performance Insights
- Monthly: Review and optimize indexes
- Quarterly: Review table sizes and archival strategy

### Application Updates
1. Test in staging environment first
2. Deploy during low-traffic hours (2-4 AM Saudi time)
3. Monitor error rates in CloudWatch for 24 hours post-deployment

---

## Contact Information

**Technical Support:**
- Email: support@restopos.com
- Emergency: Configure PagerDuty/OpsGenie for critical alerts

**Vendor Support:**
- **Moyasar**: support@moyasar.com
- **Twilio**: https://support.twilio.com
- **AWS**: AWS Support (Premium recommended for production)

---

## Appendix

### Environment Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | Yes | development | Node environment (production/development) |
| `PORT` | No | 5000 | Application port (must be 5000 for AWS) |
| `DATABASE_URL` | Yes | - | PostgreSQL connection string |
| `SESSION_SECRET` | Yes | - | Strong random secret for sessions |
| `MOYASAR_SECRET_KEY` | Yes | - | Moyasar API secret key (sk_live_xxx) |
| `VITE_MOYASAR_PUBLIC_KEY` | Yes | - | Moyasar public key (pk_live_xxx) |
| `TWILIO_ACCOUNT_SID` | Yes | - | Twilio Account SID (ACxxx) |
| `TWILIO_AUTH_TOKEN` | Yes | - | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | Yes | - | WhatsApp-enabled Twilio number |
| `SMTP_HOST` | No | - | SMTP server for emails (future) |
| `SMTP_PORT` | No | 587 | SMTP port |
| `SMTP_USER` | No | - | SMTP username |
| `SMTP_PASSWORD` | No | - | SMTP password |
| `EMAIL_FROM` | No | - | Sender email address |
| `IT_EMAIL` | No | - | IT support email for tickets |

### Useful Commands

```bash
# Check application logs
pm2 logs restopos

# Restart application
pm2 restart restopos

# Database backup
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Restore database
psql $DATABASE_URL < backup-20241110.sql

# Monitor database connections
psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

# Clear expired sessions (if needed)
psql $DATABASE_URL -c "DELETE FROM session WHERE expire < NOW();"
```

---

**Last Updated**: November 10, 2024
**Version**: 1.0.0
