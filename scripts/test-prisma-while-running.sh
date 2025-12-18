#!/bin/bash

echo "🔍 Testing Prisma while backend is running..."
echo ""

# Убеждаемся что backend работает
if ! docker ps | grep -q nardist_backend_prod; then
  echo "❌ Backend is not running!"
  exit 1
fi

POSTGRES_IP=$(docker inspect nardist_postgres_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
POSTGRES_PASSWORD=$(grep POSTGRES_PASSWORD .env | cut -d '=' -f2)

echo "Postgres IP: $POSTGRES_IP"
echo ""

# 1. Проверяем что backend видит postgres
echo "1️⃣ Checking DNS resolution..."
docker exec nardist_backend_prod getent hosts postgres
docker exec nardist_backend_prod ping -c 1 $POSTGRES_IP >/dev/null 2>&1 && echo "✅ Ping works" || echo "❌ Ping failed"

# 2. Проверяем порт
echo ""
echo "2️⃣ Checking port 5432..."
docker exec nardist_backend_prod sh -c "echo '' | timeout 2 nc -w 1 $POSTGRES_IP 5432" 2>&1 | head -1 && echo "✅ Port reachable" || echo "❌ Port NOT reachable"

# 3. Тестируем Prisma с разными вариантами
echo ""
echo "3️⃣ Testing Prisma with direct IP..."
docker exec nardist_backend_prod sh -c "cd /app && DATABASE_URL='postgresql://nardist:${POSTGRES_PASSWORD}@${POSTGRES_IP}:5432/nardist_db?sslmode=disable&connect_timeout=10' timeout 10 npx prisma db execute --stdin" <<< "SELECT 1;" 2>&1

echo ""
echo "4️⃣ Testing Prisma with hostname..."
docker exec nardist_backend_prod sh -c "cd /app && timeout 10 npx prisma db execute --stdin" <<< "SELECT 1;" 2>&1

# 5. Проверяем логи PostgreSQL
echo ""
echo "5️⃣ Checking PostgreSQL logs for connection attempts..."
docker logs nardist_postgres_prod --tail 20 | grep -i "connection\|authentication\|error\|fatal" || echo "No connection attempts in logs"

echo ""
echo "✅ Test completed!"

