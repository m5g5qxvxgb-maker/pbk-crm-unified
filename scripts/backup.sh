#!/bin/bash

# PBK CRM Automated Backup Script
# Автоматическое резервное копирование системы PBK CRM

set -e

# Configuration
PROJECT_DIR="/root/pbk-crm-unified"
BACKUP_BASE_DIR="/root/backups"
TIMESTAMP=$(date +"%Y-%m-%d-%H-%M-%S")
BACKUP_DIR="${BACKUP_BASE_DIR}/pbk-crm-backup-${TIMESTAMP}"
RETENTION_DAYS=7
LOG_FILE="${BACKUP_BASE_DIR}/backup.log"

# Telegram notification settings
TELEGRAM_BOT_TOKEN="8365789419:AAHniu_6LfMsdZ9T067gqTav6jEN8Ee92rc"
TELEGRAM_CHAT_ID="443876287"

# Function to send Telegram notification
send_telegram() {
    local message="$1"
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -H "Content-Type: application/json" \
        -d "{\"chat_id\": \"${TELEGRAM_CHAT_ID}\", \"text\": \"${message}\", \"parse_mode\": \"HTML\"}" > /dev/null 2>&1 || true
}

# Function to log messages
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Start backup
log "=== Starting PBK CRM Backup ==="
log "Backup directory: ${BACKUP_DIR}"

# Create backup directory
mkdir -p "${BACKUP_DIR}"

# Backup source code
log "Backing up source code..."
rsync -a --exclude='node_modules' \
         --exclude='.next' \
         --exclude='dist' \
         --exclude='build' \
         --exclude='coverage' \
         --exclude='.git' \
         "${PROJECT_DIR}/" "${BACKUP_DIR}/code/"

# Backup .env file
log "Backing up .env file..."
cp "${PROJECT_DIR}/.env" "${BACKUP_DIR}/.env.backup"

# Backup JWT secret
if [ -f "${PROJECT_DIR}/.jwt_secret" ]; then
    log "Backing up JWT secret..."
    cp "${PROJECT_DIR}/.jwt_secret" "${BACKUP_DIR}/.jwt_secret.backup"
fi

# Backup PostgreSQL database
log "Backing up PostgreSQL database..."
docker exec pbk-postgres pg_dumpall -U postgres > "${BACKUP_DIR}/postgres_dump.sql" 2>/dev/null || {
    log "WARNING: PostgreSQL backup failed (container may not be running)"
}

# Backup Redis data (if Redis container exists)
if docker ps -a --format '{{.Names}}' | grep -q 'pbk-redis'; then
    log "Backing up Redis data..."
    docker exec pbk-redis redis-cli SAVE > /dev/null 2>&1 || true
    docker cp pbk-redis:/data/dump.rdb "${BACKUP_DIR}/redis_dump.rdb" 2>/dev/null || {
        log "WARNING: Redis backup failed"
    }
fi

# Create compressed archive
log "Creating compressed archive..."
cd "${BACKUP_BASE_DIR}"
tar -czf "pbk-crm-backup-${TIMESTAMP}.tar.gz" "pbk-crm-backup-${TIMESTAMP}" 2>/dev/null || {
    log "ERROR: Failed to create archive"
    send_telegram "❌ <b>PBK CRM Backup FAILED</b>%0A%0AВремя: ${TIMESTAMP}%0AОшибка: Failed to create archive"
    exit 1
}

# Calculate backup size
BACKUP_SIZE=$(du -sh "pbk-crm-backup-${TIMESTAMP}.tar.gz" | cut -f1)
log "Backup archive created: pbk-crm-backup-${TIMESTAMP}.tar.gz (${BACKUP_SIZE})"

# Remove uncompressed directory
rm -rf "pbk-crm-backup-${TIMESTAMP}"

# Clean old backups (keep only last RETENTION_DAYS)
log "Cleaning old backups (keeping last ${RETENTION_DAYS} days)..."
find "${BACKUP_BASE_DIR}" -name "pbk-crm-backup-*.tar.gz" -type f -mtime +${RETENTION_DAYS} -delete 2>/dev/null || true

# Count remaining backups
BACKUP_COUNT=$(find "${BACKUP_BASE_DIR}" -name "pbk-crm-backup-*.tar.gz" -type f | wc -l)
log "Total backups: ${BACKUP_COUNT}"

# Send success notification
log "=== Backup completed successfully ==="
send_telegram "✅ <b>PBK CRM Backup SUCCESS</b>%0A%0A📅 Время: ${TIMESTAMP}%0A📦 Размер: ${BACKUP_SIZE}%0A📊 Всего бэкапов: ${BACKUP_COUNT}%0A🔄 Retention: ${RETENTION_DAYS} дней"

exit 0
