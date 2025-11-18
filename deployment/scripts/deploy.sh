#!/bin/bash
# BlindSpot System - Main Deployment Script
# This script handles the full deployment process on Alibaba Cloud ECS

set -e

# Configuration
APP_NAME="bss-production"
APP_DIR="/home/bss-app"
BACKUP_DIR="/home/backups"
LOG_DIR="/var/log/bss"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    echo -e "${2:-$GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a $LOG_DIR/deploy_$TIMESTAMP.log
}

# Error handling
handle_error() {
    log "ERROR: Deployment failed at line $1" $RED
    log "Rolling back to previous version..." $YELLOW
    rollback
    exit 1
}

trap 'handle_error $LINENO' ERR

# Check if running as appropriate user
check_user() {
    if [ "$EUID" -eq 0 ]; then 
        log "Please don't run this script as root!" $RED
        exit 1
    fi
}

# Create necessary directories
setup_directories() {
    log "Setting up directories..." $YELLOW
    sudo mkdir -p $LOG_DIR $BACKUP_DIR/app $BACKUP_DIR/db
    sudo chown -R $USER:$USER $LOG_DIR $BACKUP_DIR
}

# Backup current deployment
create_backup() {
    log "Creating backup of current deployment..." $YELLOW
    
    if [ -d "$APP_DIR" ]; then
        tar -czf $BACKUP_DIR/app/bss_backup_$TIMESTAMP.tar.gz \
            --exclude='node_modules' \
            --exclude='dist' \
            --exclude='.git' \
            -C $APP_DIR . 2>/dev/null || true
        
        log "Backup created: bss_backup_$TIMESTAMP.tar.gz" $GREEN
    else
        log "No existing deployment to backup" $YELLOW
    fi
}

# Pull latest code
update_code() {
    log "Pulling latest code from repository..." $YELLOW
    
    cd $APP_DIR
    
    # Stash any local changes
    git stash
    
    # Pull latest code
    git pull origin main
    
    # Apply stashed changes if needed
    # git stash pop || true
    
    log "Code updated successfully" $GREEN
}

# Install dependencies
install_dependencies() {
    log "Installing Node.js dependencies..." $YELLOW
    
    cd $APP_DIR
    
    # Clean install to avoid conflicts
    rm -rf node_modules package-lock.json
    npm install --production
    
    log "Dependencies installed successfully" $GREEN
}

# Build application
build_application() {
    log "Building application..." $YELLOW
    
    cd $APP_DIR
    
    # Build frontend
    npm run build
    
    # Check if build was successful
    if [ ! -d "$APP_DIR/dist" ]; then
        log "Build failed - dist directory not found!" $RED
        exit 1
    fi
    
    log "Application built successfully" $GREEN
}

# Run database migrations
run_migrations() {
    log "Running database migrations..." $YELLOW
    
    cd $APP_DIR
    
    # Check if database is accessible
    npm run db:push || {
        log "Database migration failed!" $RED
        exit 1
    }
    
    log "Database migrations completed" $GREEN
}

# Update environment variables
update_env() {
    log "Updating environment variables..." $YELLOW
    
    # Check if .env exists
    if [ ! -f "$APP_DIR/.env" ]; then
        log ".env file not found! Please create it from .env.production template" $RED
        exit 1
    fi
    
    # Validate critical environment variables
    source $APP_DIR/.env
    
    if [ -z "$DATABASE_URL" ]; then
        log "DATABASE_URL not set in .env!" $RED
        exit 1
    fi
    
    log "Environment variables updated" $GREEN
}

# Configure PM2
setup_pm2() {
    log "Configuring PM2..." $YELLOW
    
    # Check if PM2 is installed
    if ! command -v pm2 &> /dev/null; then
        log "Installing PM2 globally..." $YELLOW
        sudo npm install -g pm2
    fi
    
    # Stop existing PM2 processes
    pm2 stop $APP_NAME 2>/dev/null || true
    pm2 delete $APP_NAME 2>/dev/null || true
    
    # Start application with PM2
    cd $APP_DIR
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup script
    pm2 startup systemd -u $USER --hp /home/$USER || true
    
    log "PM2 configured successfully" $GREEN
}

# Reload Nginx
reload_nginx() {
    log "Reloading Nginx..." $YELLOW
    
    # Test Nginx configuration
    sudo nginx -t || {
        log "Nginx configuration test failed!" $RED
        exit 1
    }
    
    # Reload Nginx
    sudo systemctl reload nginx
    
    log "Nginx reloaded successfully" $GREEN
}

# Clean up old files
cleanup() {
    log "Cleaning up old files..." $YELLOW
    
    # Remove old backups (keep last 10)
    cd $BACKUP_DIR/app
    ls -t | tail -n +11 | xargs -r rm
    
    # Clean npm cache
    npm cache clean --force 2>/dev/null || true
    
    log "Cleanup completed" $GREEN
}

# Health check
health_check() {
    log "Running health check..." $YELLOW
    
    # Wait for application to start
    sleep 5
    
    # Check if application is responding
    HEALTH_CHECK=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/health || echo "000")
    
    if [ "$HEALTH_CHECK" == "200" ]; then
        log "Health check passed!" $GREEN
    else
        log "Health check failed! HTTP Status: $HEALTH_CHECK" $RED
        log "Rolling back deployment..." $YELLOW
        rollback
        exit 1
    fi
}

# Rollback function
rollback() {
    log "Starting rollback..." $YELLOW
    
    # Find latest backup
    LATEST_BACKUP=$(ls -t $BACKUP_DIR/app/bss_backup_*.tar.gz 2>/dev/null | head -1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        log "No backup found for rollback!" $RED
        exit 1
    fi
    
    # Restore from backup
    cd $APP_DIR
    tar -xzf $LATEST_BACKUP
    
    # Restart application
    pm2 restart $APP_NAME
    
    log "Rollback completed" $GREEN
}

# Send notification
send_notification() {
    local status=$1
    local message=$2
    
    # You can integrate with Alibaba Cloud SMS or Email service here
    # For now, just log the notification
    log "NOTIFICATION: $status - $message" $BLUE
    
    # Optional: Send to CloudMonitor custom event
    # aliyun cms PutCustomEvent --EventInfo "[{\"name\":\"deployment\",\"status\":\"$status\",\"message\":\"$message\"}]"
}

# Main deployment process
main() {
    log "==================================" $BLUE
    log "BSS Deployment Started" $BLUE
    log "==================================" $BLUE
    
    check_user
    setup_directories
    create_backup
    update_code
    install_dependencies
    update_env
    build_application
    run_migrations
    setup_pm2
    reload_nginx
    cleanup
    health_check
    
    log "==================================" $BLUE
    log "BSS Deployment Completed Successfully!" $GREEN
    log "==================================" $BLUE
    
    send_notification "SUCCESS" "BSS deployment completed at $(date)"
}

# Parse command line arguments
case "${1:-deploy}" in
    deploy)
        main
        ;;
    rollback)
        rollback
        ;;
    health)
        health_check
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health}"
        exit 1
        ;;
esac