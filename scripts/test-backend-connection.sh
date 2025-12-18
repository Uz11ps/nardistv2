#!/bin/bash

echo "🔍 Testing backend connection to PostgreSQL..."
echo ""

# Запускаем backend
echo "1️⃣ Starting backend..."
docker compose -f docker-compose.prod.yml up -d backend
sleep 10

# Получаем IP postgres
POSTGRES_IP=$(docker inspect nardist_postgres_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
echo "Postgres IP: $POSTGRES_IP"
echo ""

# Проверяем ping
echo "2️⃣ Testing ping from backend to postgres..."
if docker exec nardist_backend_prod ping -c 1 $POSTGRES_IP >/dev/null 2>&1; then
  echo "✅ Ping works"
else
  echo "❌ Ping failed"
  exit 1
fi

# Проверяем порт
echo ""
echo "3️⃣ Testing port 5432 from backend..."
if docker exec nardist_backend_prod sh -c "echo '' | timeout 2 nc -w 1 $POSTGRES_IP 5432" 2>&1 | head -1; then
  echo "✅ Port 5432 is reachable"
else
  echo "❌ Port 5432 is NOT reachable"
  exit 1
fi

# Проверяем через Prisma
echo ""
echo "4️⃣ Testing with Prisma..."
POSTGRES_PASSWORD=$(grep POSTGRES_PASSWORD .env | cut -d '=' -f2)
RESULT=$(docker exec nardist_backend_prod sh -c "cd /app && DATABASE_URL='postgresql://nardist:${POSTGRES_PASSWORD}@${POSTGRES_IP}:5432/nardist_db' npx prisma db execute --stdin" <<< "SELECT 1;" 2>&1)

echo "$RESULT"

if echo "$RESULT" | grep -q "1 row\|PGRES_TUPLES_OK"; then
  echo ""
  echo "✅✅✅ Prisma connection works!"
  exit 0
else
  echo ""
  echo "❌ Prisma connection failed"
  echo "Checking PostgreSQL logs..."
  docker logs nardist_postgres_prod --tail 10
  exit 1
fi

