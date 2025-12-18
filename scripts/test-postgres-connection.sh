#!/bin/bash

echo "🔍 Testing PostgreSQL connection from backend container..."
echo ""

echo "0️⃣ Checking container status..."
if ! docker ps | grep -q nardist_backend_prod; then
  echo "⚠️  Backend container is not running, starting it..."
  docker compose -f docker-compose.prod.yml up -d backend
  echo "⏳ Waiting for backend to start..."
  sleep 5
fi

if ! docker ps | grep -q nardist_postgres_prod; then
  echo "⚠️  Postgres container is not running, starting it..."
  docker compose -f docker-compose.prod.yml up -d postgres
  echo "⏳ Waiting for postgres to start..."
  sleep 5
fi

echo "✅ Containers status:"
docker ps --filter "name=nardist_" --format "table {{.Names}}\t{{.Status}}"
echo ""

echo "1️⃣ Testing ping to postgres IP (172.18.0.4)..."
docker exec nardist_backend_prod ping -c 2 172.18.0.4 2>&1 | head -5

echo ""
echo "2️⃣ Testing ping to postgres hostname..."
docker exec nardist_backend_prod ping -c 2 postgres 2>&1 | head -5

echo ""
echo "3️⃣ Testing port 5432 with Alpine nc (correct syntax)..."
docker exec nardist_backend_prod sh -c 'echo "" | nc -w 2 postgres 5432 && echo "✅ Port 5432 is open" || echo "❌ Port 5432 connection failed"' 2>&1

echo ""
echo "4️⃣ Testing port 5432 to IP directly..."
docker exec nardist_backend_prod sh -c 'echo "" | nc -w 2 172.18.0.4 5432 && echo "✅ Port 5432 to IP is open" || echo "❌ Port 5432 to IP failed"' 2>&1

echo ""
echo "5️⃣ Testing with Prisma (real connection test)..."
docker exec nardist_backend_prod sh -c 'cd /app && echo "SELECT 1;" | npx prisma db execute --stdin 2>&1' | head -10

echo ""
echo "6️⃣ Testing Prisma migrate status..."
docker exec nardist_backend_prod sh -c 'cd /app && npx prisma migrate status 2>&1' | head -10

echo ""
echo "✅ Tests completed!"

