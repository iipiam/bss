#!/bin/bash
# BlindSpot System - Database Migration Script
# Migrates from Neon PostgreSQL to Alibaba Cloud PostgreSQL

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}BSS Database Migration Tool${NC}"
echo -e "${GREEN}==================================${NC}"

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
LOG_FILE="$BACKUP_DIR/migration_$TIMESTAMP.log"

# Create backup directory if not exists
mkdir -p $BACKUP_DIR

# Function to log messages
log() {
    echo -e "$1" | tee -a $LOG_FILE
}

# Function to check prerequisites
check_prerequisites() {
    log "${YELLOW}Checking prerequisites...${NC}"
    
    # Check if pg_dump is installed
    if ! command -v pg_dump &> /dev/null; then
        log "${RED}ERROR: pg_dump not found. Please install PostgreSQL client tools.${NC}"
        exit 1
    fi
    
    # Check if psql is installed
    if ! command -v psql &> /dev/null; then
        log "${RED}ERROR: psql not found. Please install PostgreSQL client tools.${NC}"
        exit 1
    fi
    
    log "${GREEN}Prerequisites check passed!${NC}"
}

# Function to validate connection
validate_connection() {
    local host=$1
    local port=$2
    local database=$3
    local username=$4
    
    log "${YELLOW}Validating connection to $host:$port...${NC}"
    
    if PGPASSWORD=$PGPASSWORD psql -h $host -p $port -U $username -d $database -c "SELECT 1;" > /dev/null 2>&1; then
        log "${GREEN}Connection successful!${NC}"
        return 0
    else
        log "${RED}Connection failed!${NC}"
        return 1
    fi
}

# Get source database credentials (Neon)
get_source_credentials() {
    log "${YELLOW}Enter SOURCE database credentials (Neon):${NC}"
    read -p "Host: " SOURCE_HOST
    read -p "Port [5432]: " SOURCE_PORT
    SOURCE_PORT=${SOURCE_PORT:-5432}
    read -p "Database: " SOURCE_DB
    read -p "Username: " SOURCE_USER
    read -s -p "Password: " SOURCE_PASS
    echo
    export PGPASSWORD=$SOURCE_PASS
    
    # Validate source connection
    if ! validate_connection "$SOURCE_HOST" "$SOURCE_PORT" "$SOURCE_DB" "$SOURCE_USER"; then
        log "${RED}Failed to connect to source database!${NC}"
        exit 1
    fi
}

# Get target database credentials (Alibaba)
get_target_credentials() {
    log "${YELLOW}Enter TARGET database credentials (Alibaba Cloud):${NC}"
    read -p "Host: " TARGET_HOST
    read -p "Port [5432]: " TARGET_PORT
    TARGET_PORT=${TARGET_PORT:-5432}
    read -p "Database: " TARGET_DB
    read -p "Username: " TARGET_USER
    read -s -p "Password: " TARGET_PASS
    echo
    export PGPASSWORD=$TARGET_PASS
    
    # Validate target connection
    if ! validate_connection "$TARGET_HOST" "$TARGET_PORT" "$TARGET_DB" "$TARGET_USER"; then
        log "${RED}Failed to connect to target database!${NC}"
        exit 1
    fi
}

# Export database schema and data
export_database() {
    log "${YELLOW}Starting database export from Neon...${NC}"
    
    DUMP_FILE="$BACKUP_DIR/bss_dump_$TIMESTAMP.sql"
    
    export PGPASSWORD=$SOURCE_PASS
    pg_dump \
        -h "$SOURCE_HOST" \
        -p "$SOURCE_PORT" \
        -U "$SOURCE_USER" \
        -d "$SOURCE_DB" \
        --verbose \
        --no-owner \
        --no-acl \
        --if-exists \
        --clean \
        -f "$DUMP_FILE" 2>&1 | tee -a $LOG_FILE
    
    if [ $? -eq 0 ]; then
        log "${GREEN}Export completed successfully!${NC}"
        log "Dump file: $DUMP_FILE"
        
        # Get file size
        SIZE=$(du -h "$DUMP_FILE" | cut -f1)
        log "Dump file size: $SIZE"
    else
        log "${RED}Export failed!${NC}"
        exit 1
    fi
}

# Import database to Alibaba Cloud
import_database() {
    log "${YELLOW}Starting database import to Alibaba Cloud...${NC}"
    
    # Ask for confirmation
    echo -e "${YELLOW}WARNING: This will replace all data in the target database!${NC}"
    read -p "Are you sure you want to continue? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" != "yes" ]; then
        log "Migration cancelled by user."
        exit 0
    fi
    
    export PGPASSWORD=$TARGET_PASS
    psql \
        -h "$TARGET_HOST" \
        -p "$TARGET_PORT" \
        -U "$TARGET_USER" \
        -d "$TARGET_DB" \
        -f "$DUMP_FILE" 2>&1 | tee -a $LOG_FILE
    
    if [ $? -eq 0 ]; then
        log "${GREEN}Import completed successfully!${NC}"
    else
        log "${RED}Import failed! Check the log file for details.${NC}"
        exit 1
    fi
}

# Verify migration
verify_migration() {
    log "${YELLOW}Verifying migration...${NC}"
    
    export PGPASSWORD=$TARGET_PASS
    
    # Count tables
    TABLE_COUNT=$(psql -h "$TARGET_HOST" -p "$TARGET_PORT" -U "$TARGET_USER" -d "$TARGET_DB" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';")
    log "Tables migrated: $TABLE_COUNT"
    
    # Get row counts for main tables
    for table in restaurants users menu_items inventory customers orders; do
        if psql -h "$TARGET_HOST" -p "$TARGET_PORT" -U "$TARGET_USER" -d "$TARGET_DB" -c "SELECT 1 FROM $table LIMIT 1;" > /dev/null 2>&1; then
            COUNT=$(psql -h "$TARGET_HOST" -p "$TARGET_PORT" -U "$TARGET_USER" -d "$TARGET_DB" -t -c "SELECT COUNT(*) FROM $table;")
            log "  $table: $COUNT rows"
        fi
    done
    
    log "${GREEN}Migration verification complete!${NC}"
}

# Generate connection string
generate_connection_string() {
    log "${YELLOW}New database connection string:${NC}"
    echo "postgresql://$TARGET_USER:$TARGET_PASS@$TARGET_HOST:$TARGET_PORT/$TARGET_DB"
    echo
    log "${YELLOW}Add this to your .env file as DATABASE_URL${NC}"
}

# Main execution
main() {
    echo
    check_prerequisites
    echo
    get_source_credentials
    echo
    get_target_credentials
    echo
    export_database
    echo
    import_database
    echo
    verify_migration
    echo
    generate_connection_string
    echo
    log "${GREEN}==================================${NC}"
    log "${GREEN}Migration completed successfully!${NC}"
    log "${GREEN}Log file: $LOG_FILE${NC}"
    log "${GREEN}==================================${NC}"
}

# Run main function
main