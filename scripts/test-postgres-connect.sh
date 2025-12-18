#!/bin/bash

echo "🔍 Testing PostgreSQL connection..."
echo ""

# Убеждаемся что контейнеры запущены
echo "0️⃣ Ensuring containers are running..."
docker compose -f docker-compose.prod.yml up -d postgres backend
sleep 5

# Проверяем статус
if ! docker ps | grep -q nardist_postgres_prod; then
  echo "❌ Postgres container is not running!"
  exit 1
fi

if ! docker ps | grep -q nardist_backend_prod; then
  echo "❌ Backend container is not running!"
  exit 1
fi

echo "✅ Containers are running"
echo ""

# Получаем IP postgres
POSTGRES_IP=$(docker inspect nardist_postgres_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null)
echo "Postgres IP: $POSTGRES_IP"
echo ""

echo "1️⃣ Testing with nc (Alpine syntax)..."
docker exec nardist_backend_prod sh -c "printf 'SELECT 1;\n' | nc -w 3 $POSTGRES_IP 5432" 2>&1 | head -5 || echo "nc test failed"

echo ""
echo "2️⃣ Testing with Prisma and direct IP..."
POSTGRES_PASSWORD=$(grep POSTGRES_PASSWORD .env | cut -d '=' -f2)
docker exec nardist_backend_prod sh -c "cd /app && DATABASE_URL='postgresql://nardist:${POSTGRES_PASSWORD}@${POSTGRES_IP}:5432/nardist_db' npx prisma db execute --stdin" <<< "SELECT 1;" 2>&1

echo ""
echo "3️⃣ Testing with Prisma and hostname..."
docker exec nardist_backend_prod sh -c 'cd /app && npx prisma db execute --stdin' <<< "SELECT 1;" 2>&1

echo ""
echo "4️⃣ Checking PostgreSQL logs for connection attempts..."
docker logs nardist_postgres_prod --tail 10

echo ""
echo "✅ Test completed!"

