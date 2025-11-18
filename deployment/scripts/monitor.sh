#!/bin/bash
# BlindSpot System - Health Monitoring Script
# Run this via cron every 5 minutes: */5 * * * * /home/bss-app/deployment/scripts/monitor.sh

set -e

# Configuration
APP_NAME="bss-production"
ALERT_EMAIL="admin@yourdomain.com"
LOG_FILE="/var/log/bss/monitor.log"
ALERT_FILE="/tmp/bss_alerts.txt"

# Thresholds
DISK_THRESHOLD=85
MEMORY_THRESHOLD=90
CPU_THRESHOLD=85

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging function
log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

# Alert function
send_alert() {
    local subject=$1
    local message=$2
    
    echo "$message" >> $ALERT_FILE
    
    # Send email if configured
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "BSS Alert: $subject" $ALERT_EMAIL
    fi
    
    log "ALERT: $subject - $message"
}

# Check if PM2 app is running
check_app_status() {
    log "Checking application status..."
    
    if ! pm2 status $APP_NAME | grep -q "online"; then
        send_alert "Application Down" "BSS application is not running. Attempting to restart..."
        pm2 restart $APP_NAME
        sleep 5
        
        if pm2 status $APP_NAME | grep -q "online"; then
            log "✓ Application restarted successfully"
        else
            send_alert "Restart Failed" "Failed to restart BSS application. Manual intervention required."
        fi
    else
        log "✓ Application is running"
    fi
}

# Check disk space
check_disk_space() {
    log "Checking disk space..."
    
    DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ "$DISK_USAGE" -gt "$DISK_THRESHOLD" ]; then
        send_alert "Disk Space Critical" "Disk usage is at ${DISK_USAGE}% (threshold: ${DISK_THRESHOLD}%)"
        log "⚠ Disk usage: ${DISK_USAGE}%"
    else
        log "✓ Disk usage: ${DISK_USAGE}%"
    fi
}

# Check memory usage
check_memory() {
    log "Checking memory usage..."
    
    MEMORY_USAGE=$(free | grep Mem | awk '{print int($3/$2 * 100)}')
    
    if [ "$MEMORY_USAGE" -gt "$MEMORY_THRESHOLD" ]; then
        send_alert "Memory Critical" "Memory usage is at ${MEMORY_USAGE}% (threshold: ${MEMORY_THRESHOLD}%)"
        log "⚠ Memory usage: ${MEMORY_USAGE}%"
    else
        log "✓ Memory usage: ${MEMORY_USAGE}%"
    fi
}

# Check CPU usage
check_cpu() {
    log "Checking CPU usage..."
    
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print int(100 - $1)}')
    
    if [ "$CPU_USAGE" -gt "$CPU_THRESHOLD" ]; then
        send_alert "CPU Critical" "CPU usage is at ${CPU_USAGE}% (threshold: ${CPU_THRESHOLD}%)"
        log "⚠ CPU usage: ${CPU_USAGE}%"
    else
        log "✓ CPU usage: ${CPU_USAGE}%"
    fi
}

# Check application response
check_app_response() {
    log "Checking application response..."
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health || echo "000")
    
    if [ "$HTTP_CODE" != "200" ]; then
        send_alert "Health Check Failed" "Application health check returned HTTP $HTTP_CODE"
        log "⚠ Health check failed: HTTP $HTTP_CODE"
    else
        log "✓ Application responding: HTTP $HTTP_CODE"
    fi
}

# Check Nginx status
check_nginx() {
    log "Checking Nginx status..."
    
    if ! systemctl is-active --quiet nginx; then
        send_alert "Nginx Down" "Nginx service is not running. Attempting to start..."
        sudo systemctl start nginx
        sleep 3
        
        if systemctl is-active --quiet nginx; then
            log "✓ Nginx started successfully"
        else
            send_alert "Nginx Start Failed" "Failed to start Nginx. Manual intervention required."
        fi
    else
        log "✓ Nginx is running"
    fi
}

# Check database connection
check_database() {
    log "Checking database connection..."
    
    if pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
        log "✓ Database is accessible"
    else
        send_alert "Database Connection Failed" "Cannot connect to PostgreSQL database"
        log "⚠ Database connection failed"
    fi
}

# Check SSL certificate expiry
check_ssl_expiry() {
    log "Checking SSL certificate expiry..."
    
    if [ -f "/etc/letsencrypt/live/yourdomain.com/cert.pem" ]; then
        EXPIRY_DATE=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/yourdomain.com/cert.pem | cut -d= -f2)
        EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
        CURRENT_EPOCH=$(date +%s)
        DAYS_LEFT=$(( ($EXPIRY_EPOCH - $CURRENT_EPOCH) / 86400 ))
        
        if [ "$DAYS_LEFT" -lt 30 ]; then
            send_alert "SSL Certificate Expiring" "SSL certificate expires in $DAYS_LEFT days"
            log "⚠ SSL expires in $DAYS_LEFT days"
        else
            log "✓ SSL valid for $DAYS_LEFT days"
        fi
    fi
}

# Check log file sizes
check_log_sizes() {
    log "Checking log file sizes..."
    
    LOG_DIR="/var/log/bss"
    if [ -d "$LOG_DIR" ]; then
        LARGE_LOGS=$(find $LOG_DIR -type f -size +100M 2>/dev/null)
        
        if [ -n "$LARGE_LOGS" ]; then
            send_alert "Large Log Files" "Some log files exceed 100MB: $LARGE_LOGS"
            log "⚠ Large log files detected"
        else
            log "✓ Log file sizes OK"
        fi
    fi
}

# Main monitoring routine
main() {
    log "==================================="
    log "BSS Health Monitoring Started"
    log "==================================="
    
    # Clear previous alerts
    > $ALERT_FILE
    
    # Run all checks
    check_app_status
    check_disk_space
    check_memory
    check_cpu
    check_app_response
    check_nginx
    check_database
    check_ssl_expiry
    check_log_sizes
    
    log "==================================="
    log "Monitoring Complete"
    log "==================================="
    
    # Send summary if there were alerts
    if [ -s $ALERT_FILE ]; then
        log "Alerts detected. Check $ALERT_FILE for details."
    fi
}

# Run main function
main