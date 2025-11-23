# BlindSpot System - Cloud Infrastructure Setup

## Cloud Server Configuration

### Recommended Specifications

**Production Environment:**
- **Instance Type**: 2 vCPU, 4GB RAM
- **Operating System**: Ubuntu 20.04 LTS (64-bit)
- **System Disk**: 40GB SSD
- **Data Disk**: 100GB SSD (optional for large file storage)

**Staging/Development Environment:**
- **Instance Type**: 1 vCPU, 2GB RAM
- **Operating System**: Ubuntu 20.04 LTS (64-bit)
- **System Disk**: 20GB SSD

### Security Group Rules

| Protocol | Port Range | Source | Description |
|----------|------------|--------|-------------|
| SSH | 22 | Your IP | Admin access |
| HTTP | 80 | 0.0.0.0/0 | Web traffic |
| HTTPS | 443 | 0.0.0.0/0 | Secure web traffic |
| Custom | 5000 | VPC CIDR | Internal API |
| PostgreSQL | 5432 | VPC CIDR | Database (if on same VPC) |

### Network Configuration

1. **VPC Setup**
   - Create dedicated VPC for BSS
   - CIDR: 172.16.0.0/16
   - Create 2 subnets (public and private)

2. **Elastic IP**
   - Allocate elastic IP for production instance
   - Associate with server instance

3. **Domain Configuration**
   - Point A record to EIP
   - Configure subdomain for API if needed

## Database Configuration

### Option A: Managed PostgreSQL Database (Recommended)

**Specifications:**
- **Engine**: PostgreSQL 14
- **Instance Type**: 2 vCPU, 4GB RAM
- **Storage**: 100GB SSD
- **High Availability**: Multi-zone deployment
- **Backup**: Daily automatic backups (30-day retention)

**Connection Security:**
- Whitelist server security group
- Enable SSL connection
- Use strong password policy

### Option B: Self-Managed PostgreSQL on Cloud Server

**Installation:**
```bash
# Install PostgreSQL 14
sudo apt update
sudo apt install postgresql-14 postgresql-client-14

# Configure for production
sudo nano /etc/postgresql/14/main/postgresql.conf
# Set: max_connections = 200
# Set: shared_buffers = 1GB
# Set: effective_cache_size = 3GB
```

## Load Balancer Configuration (Optional)

**For High Availability:**
- **Type**: Application Load Balancer
- **Listeners**: HTTP (80) → HTTPS redirect, HTTPS (443)
- **Health Check**: /api/health endpoint
- **Backend Servers**: 2+ server instances

## CDN Configuration (Optional)

**For Static Assets:**
- **Service**: CDN service
- **Origin**: Your domain or object storage bucket
- **Cache Rules**: 
  - Images/CSS/JS: 1 year
  - HTML: 5 minutes
  - API responses: No cache

## Object Storage

**For Backups and Files:**
- **Bucket Name**: bss-production
- **Region**: Same as cloud server
- **Access Control**: Private
- **Lifecycle Rules**: 
  - Move to IA storage after 30 days
  - Delete old backups after 90 days

## Monitoring Setup

**Monitoring Configuration:**
- CPU Usage Alert: > 80%
- Memory Usage Alert: > 90%
- Disk Usage Alert: > 85%
- HTTP Status Alert: 5xx errors > 10/minute

## Cost Estimation

### Monthly Costs (USD)

**Basic Production Setup:**
- Cloud server instance (2 vCPU, 4GB RAM): $50
- Managed database PostgreSQL: $30
- Elastic IP: $5
- Object storage (100GB): $3
- Data Transfer (100GB): $10
- **Total**: ~$98/month

**High Availability Setup:**
- 2x Cloud server instances: $100
- Managed database with Multi-AZ: $60
- Load Balancer: $20
- CDN: $15
- Object storage & Backup: $10
- Data Transfer: $20
- **Total**: ~$225/month

## Initial Setup Checklist

- [ ] Create cloud provider account
- [ ] Set up billing alerts
- [ ] Create VPC and security groups
- [ ] Launch cloud server instance(s)
- [ ] Configure security group rules
- [ ] Allocate and bind elastic IP
- [ ] Set up managed database or install PostgreSQL
- [ ] Create object storage bucket for backups
- [ ] Configure monitoring alerts
- [ ] Set up domain DNS records
- [ ] Enable DDoS protection (free tier)