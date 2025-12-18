#!/bin/bash

set -e

echo "🔧 Fixing PostgreSQL connection issue..."
echo ""

# 1. Проверяем pg_hba.conf
echo "1️⃣ Checking pg_hba.conf..."
PG_HBA="/var/lib/postgresql/data/pg_hba.conf"
HBA_CONTENT=$(docker exec nardist_postgres_prod cat $PG_HBA 2>/dev/null || echo "")

if [ -z "$HBA_CONTENT" ]; then
  echo "❌ Cannot read pg_hba.conf"
  exit 1
fi

echo "Current pg_hba.conf rules:"
echo "$HBA_CONTENT" | grep -v "^#" | grep -v "^$"

# 2. Проверяем, есть ли правило для Docker сети
if echo "$HBA_CONTENT" | grep -q "172.18.0.0/16\|0.0.0.0/0\|host.*all.*all.*md5"; then
  echo ""
  echo "✅ pg_hba.conf seems OK"
else
  echo ""
  echo "⚠️  Need to add rule for Docker network"
  echo "Adding rule: host all all 172.18.0.0/16 md5"
  
  docker exec nardist_postgres_prod sh -c "echo 'host all all 172.18.0.0/16 md5' >> $PG_HBA"
  
  echo "Reloading PostgreSQL config..."
  docker exec nardist_postgres_prod sh -c "psql -U nardist -d nardist_db -c 'SELECT pg_reload_conf();'" 2>/dev/null || {
    echo "⚠️  Cannot reload, restarting PostgreSQL..."
    docker restart nardist_postgres_prod
    sleep 5
  }
fi

# 3. Проверяем подключение
echo ""
echo "2️⃣ Testing connection..."
sleep 2

if docker exec nardist_backend_prod sh -c 'cd /app && npx prisma db execute --stdin' <<< "SELECT 1;" 2>&1 | grep -q "1 row"; then
  echo "✅ Connection works!"
  exit 0
else
  echo "❌ Connection still fails"
  echo ""
  echo "3️⃣ Trying to fix by recreating network..."
  docker compose -f docker-compose.prod.yml down
  sleep 2
  docker network rm nardist_network 2>/dev/null || true
  sleep 2
  docker compose -f docker-compose.prod.yml up -d
  sleep 10
  
  echo ""
  echo "4️⃣ Testing again..."
  if docker exec nardist_backend_prod sh -c 'cd /app && npx prisma db execute --stdin' <<< "SELECT 1;" 2>&1 | grep -q "1 row"; then
    echo "✅ Connection works after network recreation!"
    exit 0
  else
    echo "❌ Still failing. Check logs:"
    docker logs nardist_postgres_prod --tail 20
    exit 1
  fi
fi

