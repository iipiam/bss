#!/bin/bash
# BlindSpot System - Automated Backup Script
# Run daily via cron: 0 2 * * * /home/bss-app/deployment/scripts/backup.sh

set -e

# Configuration
BACKUP_DIR="/home/backups"
DB_BACKUP_DIR="$BACKUP_DIR/db"
APP_BACKUP_DIR="$BACKUP_DIR/app"
APP_DIR="/home/bss-app"
LOG_FILE="/var/log/bss/backup.log"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DATE=$(date +%Y%m%d)

# Retention (days)
DB_RETENTION=30
APP_RETENTION=7

# Alibaba OSS configuration (optional)
OSS_ENABLED=false
OSS_BUCKET="bss-backups"
OSS_REGION="oss-cn-hangzhou"

# Email alerts
ALERT_EMAIL="admin@yourdomain.com"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging function
log() {
    echo -e "${2:-$GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_FILE
}

# Error handling
handle_error() {
    log "ERROR: Backup failed at line $1" $RED
    echo "Backup failed at $(date)" | mail -s "BSS Backup Failed" $ALERT_EMAIL || true
    exit 1
}

trap 'handle_error $LINENO' ERR

# Create backup directories
setup_directories() {
    log "Setting up backup directories..." $YELLOW
    mkdir -p $DB_BACKUP_DIR $APP_BACKUP_DIR
}

# Backup PostgreSQL database
backup_database() {
    log "Starting database backup..." $YELLOW
    
    # Source environment variables
    if [ -f "$APP_DIR/.env" ]; then
        source $APP_DIR/.env
    fi
    
    BACKUP_FILE="$DB_BACKUP_DIR/bss_db_$DATE.sql.gz"
    
    # Extract database credentials from DATABASE_URL
    # Format: postgresql://user:pass@host:port/dbname
    DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\(.*\)/\1/p')
    
    # Create backup
    PGPASSWORD=$DB_PASS pg_dump \
        -h $DB_HOST \
        -p $DB_PORT \
        -U $DB_USER \
        -d $DB_NAME \
        --verbose \
        --no-owner \
        --no-acl \
        | gzip > $BACKUP_FILE
    
    # Verify backup
    if [ -f "$BACKUP_FILE" ]; then
        SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log "Database backup completed: $BACKUP_FILE ($SIZE)" $GREEN
    else
        log "Database backup failed!" $RED
        exit 1
    fi
}

# Backup application files
backup_application() {
    log "Starting application backup..." $YELLOW
    
    BACKUP_FILE="$APP_BACKUP_DIR/bss_app_$DATE.tar.gz"
    
    # Create backup excluding node_modules and build artifacts
    tar -czf $BACKUP_FILE \
        --exclude='node_modules' \
        --exclude='dist' \
        --exclude='.git' \
        --exclude='public/invoices' \
        --exclude='*.log' \
        -C $APP_DIR .
    
    # Verify backup
    if [ -f "$BACKUP_FILE" ]; then
        SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        log "Application backup completed: $BACKUP_FILE ($SIZE)" $GREEN
    else
        log "Application backup failed!" $RED
        exit 1
    fi
}

# Backup uploaded files
backup_uploads() {
    log "Starting uploads backup..." $YELLOW
    
    UPLOADS_DIR="/var/bss/uploads"
    INVOICES_DIR="/var/bss/invoices"
    BACKUP_FILE="$BACKUP_DIR/files/bss_files_$DATE.tar.gz"
    
    mkdir -p "$BACKUP_DIR/files"
    
    if [ -d "$UPLOADS_DIR" ] || [ -d "$INVOICES_DIR" ]; then
        tar -czf $BACKUP_FILE \
            -C /var/bss \
            uploads \
            invoices 2>/dev/null || true
        
        if [ -f "$BACKUP_FILE" ]; then
            SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
            log "Files backup completed: $BACKUP_FILE ($SIZE)" $GREEN
        fi
    else
        log "No uploads/invoices directories found, skipping..." $YELLOW
    fi
}

# Upload to Alibaba OSS
upload_to_oss() {
    if [ "$OSS_ENABLED" = true ]; then
        log "Uploading backups to Alibaba OSS..." $YELLOW
        
        # Install ossutil if not present
        if ! command -v ossutil &> /dev/null; then
            log "ossutil not installed, skipping OSS upload" $YELLOW
            return
        fi
        
        # Upload database backup
        ossutil cp $DB_BACKUP_DIR/bss_db_$DATE.sql.gz \
            oss://$OSS_BUCKET/db/ \
            --region $OSS_REGION
        
        # Upload application backup
        ossutil cp $APP_BACKUP_DIR/bss_app_$DATE.tar.gz \
            oss://$OSS_BUCKET/app/ \
            --region $OSS_REGION
        
        log "OSS upload completed" $GREEN
    fi
}

# Clean up old backups
cleanup_old_backups() {
    log "Cleaning up old backups..." $YELLOW
    
    # Clean old database backups
    find $DB_BACKUP_DIR -name "bss_db_*.sql.gz" -mtime +$DB_RETENTION -delete
    log "Removed database backups older than $DB_RETENTION days"
    
    # Clean old application backups
    find $APP_BACKUP_DIR -name "bss_app_*.tar.gz" -mtime +$APP_RETENTION -delete
    log "Removed application backups older than $APP_RETENTION days"
    
    # Clean old file backups
    find $BACKUP_DIR/files -name "bss_files_*.tar.gz" -mtime +$APP_RETENTION -delete 2>/dev/null || true
    log "Removed file backups older than $APP_RETENTION days"
}

# Verify backups
verify_backups() {
    log "Verifying backups..." $YELLOW
    
    # Check if today's backups exist
    DB_BACKUP="$DB_BACKUP_DIR/bss_db_$DATE.sql.gz"
    APP_BACKUP="$APP_BACKUP_DIR/bss_app_$DATE.tar.gz"
    
    if [ -f "$DB_BACKUP" ] && [ -f "$APP_BACKUP" ]; then
        log "All backups verified successfully" $GREEN
        
        # Test database backup integrity
        if gzip -t "$DB_BACKUP"; then
            log "Database backup integrity OK" $GREEN
        else
            log "Database backup corrupted!" $RED
            exit 1
        fi
        
        # Test application backup integrity
        if tar -tzf "$APP_BACKUP" > /dev/null; then
            log "Application backup integrity OK" $GREEN
        else
            log "Application backup corrupted!" $RED
            exit 1
        fi
    else
        log "Backup verification failed - files missing" $RED
        exit 1
    fi
}

# Send backup report
send_report() {
    log "Generating backup report..." $YELLOW
    
    DB_SIZE=$(du -h "$DB_BACKUP_DIR/bss_db_$DATE.sql.gz" 2>/dev/null | cut -f1 || echo "N/A")
    APP_SIZE=$(du -h "$APP_BACKUP_DIR/bss_app_$DATE.tar.gz" 2>/dev/null | cut -f1 || echo "N/A")
    TOTAL_SIZE=$(du -sh $BACKUP_DIR 2>/dev/null | cut -f1 || echo "N/A")
    
    REPORT="BSS Backup Report - $DATE\n\n"
    REPORT+="Database Backup: $DB_SIZE\n"
    REPORT+="Application Backup: $APP_SIZE\n"
    REPORT+="Total Backup Size: $TOTAL_SIZE\n\n"
    REPORT+="Backup Location: $BACKUP_DIR\n"
    REPORT+="Timestamp: $(date)\n"
    
    echo -e "$REPORT" | mail -s "BSS Backup Success - $DATE" $ALERT_EMAIL || true
    log "Backup report sent" $GREEN
}

# Main backup routine
main() {
    log "===================================" $YELLOW
    log "BSS Backup Started" $YELLOW
    log "===================================" $YELLOW
    
    setup_directories
    backup_database
    backup_application
    backup_uploads
    upload_to_oss
    cleanup_old_backups
    verify_backups
    send_report
    
    log "===================================" $GREEN
    log "BSS Backup Completed Successfully!" $GREEN
    log "===================================" $GREEN
}

# Run main function
main