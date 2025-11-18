#!/bin/bash
# BlindSpot System - Security Hardening Script
# Run this script once after initial server setup

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${2:-$GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then 
        log "Please run as root (use sudo)" $RED
        exit 1
    fi
}

# Configure firewall with UFW
setup_firewall() {
    log "Setting up firewall..." $YELLOW
    
    # Install UFW if not installed
    apt-get install -y ufw
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow 22/tcp
    
    # Allow HTTP/HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Allow PostgreSQL from localhost only
    ufw allow from 127.0.0.1 to any port 5432
    
    # Enable firewall
    echo "y" | ufw enable
    
    log "Firewall configured" $GREEN
}

# Configure fail2ban for SSH protection
setup_fail2ban() {
    log "Setting up fail2ban..." $YELLOW
    
    # Install fail2ban
    apt-get install -y fail2ban
    
    # Create jail configuration
    cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = 22
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
port = http,https
logpath = /var/log/nginx/error.log
EOF
    
    # Restart fail2ban
    systemctl enable fail2ban
    systemctl restart fail2ban
    
    log "fail2ban configured" $GREEN
}

# Secure SSH configuration
secure_ssh() {
    log "Securing SSH..." $YELLOW
    
    # Backup original config
    cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup
    
    # Update SSH config
    sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    sed -i 's/#PasswordAuthentication yes/PasswordAuthentication yes/' /etc/ssh/sshd_config
    sed -i 's/X11Forwarding yes/X11Forwarding no/' /etc/ssh/sshd_config
    
    # Add security settings if not present
    if ! grep -q "Protocol 2" /etc/ssh/sshd_config; then
        echo "Protocol 2" >> /etc/ssh/sshd_config
    fi
    
    # Restart SSH
    systemctl restart sshd
    
    log "SSH secured" $GREEN
}

# Install and configure SSL
setup_ssl() {
    log "Installing SSL tools..." $YELLOW
    
    # Install certbot
    apt-get install -y certbot python3-certbot-nginx
    
    log "SSL tools installed" $GREEN
    log "To generate certificate, run: sudo certbot --nginx -d yourdomain.com" $YELLOW
}

# Set up automatic security updates
setup_auto_updates() {
    log "Setting up automatic security updates..." $YELLOW
    
    apt-get install -y unattended-upgrades
    
    # Configure automatic updates
    cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Kernel-Packages "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF
    
    # Enable auto-updates
    cat > /etc/apt/apt.conf.d/20auto-upgrades << 'EOF'
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
APT::Periodic::AutocleanInterval "7";
EOF
    
    log "Automatic security updates enabled" $GREEN
}

# Secure file permissions
secure_file_permissions() {
    log "Setting secure file permissions..." $YELLOW
    
    # Create bss user if not exists
    if ! id "bss-user" &>/dev/null; then
        useradd -m -s /bin/bash bss-user
        log "Created bss-user" $GREEN
    fi
    
    # Set ownership
    chown -R bss-user:bss-user /home/bss-app 2>/dev/null || true
    chown -R bss-user:bss-user /var/bss 2>/dev/null || true
    chown -R bss-user:bss-user /var/log/bss 2>/dev/null || true
    
    # Set permissions
    chmod 750 /home/bss-app 2>/dev/null || true
    chmod 700 /home/bss-app/.env 2>/dev/null || true
    
    log "File permissions secured" $GREEN
}

# Install security tools
install_security_tools() {
    log "Installing security tools..." $YELLOW
    
    apt-get update
    apt-get install -y \
        ufw \
        fail2ban \
        rkhunter \
        aide \
        lynis \
        unattended-upgrades
    
    log "Security tools installed" $GREEN
}

# Configure kernel security
configure_kernel_security() {
    log "Configuring kernel security..." $YELLOW
    
    cat > /etc/sysctl.d/99-bss-security.conf << 'EOF'
# IP Forwarding
net.ipv4.ip_forward = 0
net.ipv6.conf.all.forwarding = 0

# SYN Cookies
net.ipv4.tcp_syncookies = 1

# Ignore ICMP redirects
net.ipv4.conf.all.accept_redirects = 0
net.ipv6.conf.all.accept_redirects = 0

# Ignore send redirects
net.ipv4.conf.all.send_redirects = 0

# Disable source packet routing
net.ipv4.conf.all.accept_source_route = 0
net.ipv6.conf.all.accept_source_route = 0

# Log martians
net.ipv4.conf.all.log_martians = 1

# Ignore ICMP ping requests
net.ipv4.icmp_echo_ignore_all = 0

# Ignore Directed pings
net.ipv4.icmp_echo_ignore_broadcasts = 1

# Disable IPv6 (if not needed)
# net.ipv6.conf.all.disable_ipv6 = 1
EOF
    
    # Apply settings
    sysctl -p /etc/sysctl.d/99-bss-security.conf
    
    log "Kernel security configured" $GREEN
}

# Main security setup
main() {
    log "===================================" $YELLOW
    log "BSS Security Hardening Started" $YELLOW
    log "===================================" $YELLOW
    
    check_root
    install_security_tools
    setup_firewall
    setup_fail2ban
    secure_ssh
    setup_ssl
    setup_auto_updates
    secure_file_permissions
    configure_kernel_security
    
    log "===================================" $GREEN
    log "Security Hardening Complete!" $GREEN
    log "===================================" $GREEN
    log "Important next steps:" $YELLOW
    log "1. Generate SSL certificate: sudo certbot --nginx -d yourdomain.com" $YELLOW
    log "2. Review firewall rules: sudo ufw status" $YELLOW
    log "3. Check fail2ban: sudo fail2ban-client status" $YELLOW
    log "4. Test SSH from non-root user before logging out!" $RED
}

main