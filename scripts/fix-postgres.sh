#!/bin/bash

set -e

echo "🔧 Fixing PostgreSQL connection issue..."
echo ""

# 0. Полностью очищаем все контейнеры проекта
echo "0️⃣ Cleaning up all containers..."
docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
sleep 2
docker ps -a --filter "name=nardist_" --format "{{.Names}}" | xargs -r docker rm -f 2>/dev/null || true
docker ps -a --filter "name=_old_" --format "{{.Names}}" | xargs -r docker rm -f 2>/dev/null || true
docker ps -a --filter "name=_backup_" --format "{{.Names}}" | xargs -r docker rm -f 2>/dev/null || true
echo "✅ All containers cleaned"

# 1. Запускаем контейнеры заново
echo ""
echo "1️⃣ Starting containers..."
docker compose -f docker-compose.prod.yml up -d postgres redis backend
echo "⏳ Waiting for containers to be ready..."
sleep 10

# Проверяем pg_hba.conf
echo ""
echo "2️⃣ Checking pg_hba.conf..."

PG_HBA="/var/lib/postgresql/data/pg_hba.conf"
HBA_CONTENT=$(docker exec nardist_postgres_prod cat $PG_HBA 2>/dev/null || echo "")

if [ -z "$HBA_CONTENT" ]; then
  echo "❌ Cannot read pg_hba.conf"
  exit 1
fi

echo "Current pg_hba.conf rules:"
echo "$HBA_CONTENT" | grep -v "^#" | grep -v "^$"

# 3. Проверяем подключение напрямую
echo ""
echo "3️⃣ Testing direct connection with psql from postgres container..."
docker exec nardist_postgres_prod psql -U nardist -d nardist_db -h 172.18.0.2 -c "SELECT 1;" 2>&1 || echo "❌ Direct connection failed"

# 4. Проверяем подключение через Prisma
echo ""
echo "4️⃣ Testing connection via Prisma..."

RESULT=$(docker exec nardist_backend_prod sh -c 'cd /app && npx prisma db execute --stdin' <<< "SELECT 1;" 2>&1)
echo "$RESULT"

if echo "$RESULT" | grep -q "1 row\|PGRES_TUPLES_OK"; then
  echo "✅ Connection works!"
  exit 0
else
  echo "❌ Connection failed"
  echo ""
  echo "5️⃣ Checking PostgreSQL logs for errors..."
  docker logs nardist_postgres_prod --tail 30 | grep -i "error\|fatal\|connection" || echo "No errors in logs"
  exit 1
fi

