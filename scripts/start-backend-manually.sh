#!/bin/bash

set -e

echo "🔧 Starting backend manually to debug..."
echo ""

# 1. Полностью очищаем
echo "1️⃣ Cleaning up..."
docker compose -f docker-compose.prod.yml down --remove-orphans
docker ps -a --filter "name=nardist_" --format "{{.Names}}" | xargs -r docker rm -f 2>/dev/null || true
sleep 2

# 2. Запускаем только postgres и redis
echo "2️⃣ Starting postgres and redis..."
docker compose -f docker-compose.prod.yml up -d postgres redis
echo "⏳ Waiting for postgres and redis to be ready..."
sleep 15

# 3. Проверяем что они работают
if ! docker ps | grep -q nardist_postgres_prod; then
  echo "❌ Postgres not running!"
  exit 1
fi

if ! docker ps | grep -q nardist_redis_prod; then
  echo "❌ Redis not running!"
  exit 1
fi

echo "✅ Postgres and Redis are running"

# 4. Запускаем backend БЕЗ depends_on (вручную)
echo ""
echo "3️⃣ Starting backend manually..."
docker run -d \
  --name nardist_backend_prod \
  --network nardist_network \
  -e DATABASE_URL="postgresql://nardist:$(grep POSTGRES_PASSWORD .env | cut -d '=' -f2)@postgres:5432/nardist_db" \
  -e REDIS_URL="redis://redis:6379" \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e JWT_SECRET="$(grep JWT_SECRET .env | cut -d '=' -f2)" \
  -e TELEGRAM_BOT_TOKEN="$(grep TELEGRAM_BOT_TOKEN .env | cut -d '=' -f2)" \
  ghcr.io/uz11ps/nardist-backend:latest

sleep 5

# 5. Проверяем статус
if docker ps | grep -q nardist_backend_prod; then
  echo "✅ Backend is running"
  
  # 6. Тестируем подключение
  echo ""
  echo "4️⃣ Testing connections..."
  POSTGRES_IP=$(docker inspect nardist_postgres_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
  
  docker exec nardist_backend_prod ping -c 1 $POSTGRES_IP >/dev/null 2>&1 && echo "✅ Ping works" || echo "❌ Ping failed"
  
  echo ""
  echo "5️⃣ Testing Prisma..."
  POSTGRES_PASSWORD=$(grep POSTGRES_PASSWORD .env | cut -d '=' -f2)
  docker exec nardist_backend_prod sh -c "cd /app && DATABASE_URL='postgresql://nardist:${POSTGRES_PASSWORD}@${POSTGRES_IP}:5432/nardist_db?sslmode=disable' npx prisma db execute --stdin" <<< "SELECT 1;" 2>&1 | head -5
  
else
  echo "❌ Backend failed to start"
  echo "Checking logs..."
  docker logs nardist_backend_prod --tail 50
  exit 1
fi

echo ""
echo "✅ Manual start completed!"

