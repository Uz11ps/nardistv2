#!/bin/bash

echo "🔧 Fixing backend stability..."
echo ""

# 1. Останавливаем backend
echo "1️⃣ Stopping backend..."
docker compose -f docker-compose.prod.yml stop backend
sleep 2

# 2. Проверяем логи почему он падает
echo "2️⃣ Checking why backend crashes..."
docker logs nardist_backend_prod --tail 50 2>&1 | tail -20

# 3. Запускаем только postgres и redis
echo ""
echo "3️⃣ Ensuring postgres and redis are running..."
docker compose -f docker-compose.prod.yml up -d postgres redis
sleep 5

# 4. Проверяем что они работают
if ! docker ps | grep -q nardist_postgres_prod; then
  echo "❌ Postgres not running!"
  exit 1
fi

if ! docker ps | grep -q nardist_redis_prod; then
  echo "❌ Redis not running!"
  exit 1
fi

echo "✅ Postgres and Redis are running"

# 5. Запускаем backend без зависимостей (чтобы он не падал сразу)
echo ""
echo "4️⃣ Starting backend in detached mode..."
docker compose -f docker-compose.prod.yml up -d backend
sleep 10

# 6. Проверяем статус
if docker ps | grep -q nardist_backend_prod; then
  echo "✅ Backend is running"
  
  # 7. Тестируем подключение
  echo ""
  echo "5️⃣ Testing PostgreSQL connection..."
  POSTGRES_IP=$(docker inspect nardist_postgres_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
  POSTGRES_PASSWORD=$(grep POSTGRES_PASSWORD .env | cut -d '=' -f2)
  
  # Тест через Node.js
  echo "   Testing with Node.js TCP..."
  docker exec nardist_backend_prod sh -c "node -e \"
const net = require('net');
const client = net.createConnection({ host: '$POSTGRES_IP', port: 5432 }, () => {
  console.log('✅ TCP connection successful');
  client.end();
  process.exit(0);
});
client.on('error', (e) => {
  console.log('❌ TCP connection failed:', e.message);
  process.exit(1);
});
setTimeout(() => {
  console.log('❌ Connection timeout');
  process.exit(1);
}, 3000);
\"" 2>&1
  
  # Тест через Prisma
  echo ""
  echo "   Testing with Prisma..."
  docker exec nardist_backend_prod sh -c "cd /app && DATABASE_URL='postgresql://nardist:${POSTGRES_PASSWORD}@${POSTGRES_IP}:5432/nardist_db?sslmode=disable' npx prisma db execute --stdin" <<< "SELECT 1;" 2>&1 | head -5
  
else
  echo "❌ Backend failed to start"
  echo "Checking logs..."
  docker logs nardist_backend_prod --tail 30
  exit 1
fi

echo ""
echo "✅ Backend stability check completed!"

