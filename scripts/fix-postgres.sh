#!/bin/bash

set -e

echo "🔧 Fixing PostgreSQL connection issue..."
echo ""

# 0. Удаляем старые контейнеры
echo "0️⃣ Removing old containers..."
docker ps -a --filter "name=_old_" --format "{{.Names}}" | xargs -r docker rm -f 2>/dev/null || true
docker ps -a --filter "name=_backup_" --format "{{.Names}}" | xargs -r docker rm -f 2>/dev/null || true
echo "✅ Old containers removed"

# 1. Проверяем pg_hba.conf
echo ""
echo "1️⃣ Checking pg_hba.conf..."
if ! docker ps | grep -q nardist_postgres_prod; then
  echo "⚠️  Postgres not running, starting it..."
  docker compose -f docker-compose.prod.yml up -d postgres
  sleep 5
fi

PG_HBA="/var/lib/postgresql/data/pg_hba.conf"
HBA_CONTENT=$(docker exec nardist_postgres_prod cat $PG_HBA 2>/dev/null || echo "")

if [ -z "$HBA_CONTENT" ]; then
  echo "❌ Cannot read pg_hba.conf"
  exit 1
fi

echo "Current pg_hba.conf rules:"
echo "$HBA_CONTENT" | grep -v "^#" | grep -v "^$"

# 2. Проверяем подключение через Prisma
echo ""
echo "2️⃣ Testing connection via Prisma..."
if ! docker ps | grep -q nardist_backend_prod; then
  echo "⚠️  Backend not running, starting it..."
  docker compose -f docker-compose.prod.yml up -d backend
  sleep 5
fi

RESULT=$(docker exec nardist_backend_prod sh -c 'cd /app && npx prisma db execute --stdin' <<< "SELECT 1;" 2>&1)
echo "$RESULT"

if echo "$RESULT" | grep -q "1 row\|PGRES_TUPLES_OK"; then
  echo "✅ Connection works!"
  exit 0
else
  echo "❌ Connection failed"
  echo ""
  echo "3️⃣ Checking PostgreSQL logs for connection attempts..."
  echo "Last 30 lines of logs:"
  docker logs nardist_postgres_prod --tail 30
  echo ""
  echo "Filtered errors/connections:"
  docker logs nardist_postgres_prod --tail 100 | grep -iE "error|fatal|connection|authentication|listen" || echo "No relevant log entries"
  exit 1
fi

