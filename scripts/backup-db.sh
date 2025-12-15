#!/bin/bash

set -e

# Определяем команду docker compose
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "❌ Error: docker compose or docker-compose not found!"
    exit 1
fi

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/nardist_db_${TIMESTAMP}.sql"

mkdir -p ${BACKUP_DIR}

echo "💾 Creating database backup..."

$DOCKER_COMPOSE -f docker-compose.prod.yml exec -T postgres pg_dump \
    -U ${POSTGRES_USER:-nardist} \
    ${POSTGRES_DB:-nardist_db} > ${BACKUP_FILE}

echo "✅ Backup created: ${BACKUP_FILE}"

# Keep only last 7 backups
ls -t ${BACKUP_DIR}/*.sql | tail -n +8 | xargs rm -f

echo "🧹 Old backups cleaned"

