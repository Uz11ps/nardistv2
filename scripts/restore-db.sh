#!/bin/bash

set -e

if [ -z "$1" ]; then
    echo "Usage: ./scripts/restore-db.sh <backup-file.sql>"
    exit 1
fi

BACKUP_FILE=$1

if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Error: Backup file not found: ${BACKUP_FILE}"
    exit 1
fi

echo "⚠️  WARNING: This will replace the current database!"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Restore cancelled"
    exit 1
fi

echo "🔄 Restoring database from ${BACKUP_FILE}..."

docker-compose -f docker-compose.prod.yml exec -T postgres psql \
    -U ${POSTGRES_USER:-nardist} \
    -d ${POSTGRES_DB:-nardist_db} < ${BACKUP_FILE}

echo "✅ Database restored successfully!"

