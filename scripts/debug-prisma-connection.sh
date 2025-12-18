#!/bin/bash

echo "🔍 Debugging Prisma connection issue..."
echo ""

POSTGRES_IP=$(docker inspect nardist_postgres_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
POSTGRES_PASSWORD=$(grep POSTGRES_PASSWORD .env | cut -d '=' -f2)

echo "Postgres IP: $POSTGRES_IP"
echo ""

# 1. Проверяем DATABASE_URL в контейнере
echo "1️⃣ Checking DATABASE_URL in backend container..."
docker exec nardist_backend_prod sh -c 'echo $DATABASE_URL' | sed 's/:[^:]*@/:****@/g'

# 2. Пробуем подключиться с разными вариантами DATABASE_URL
echo ""
echo "2️⃣ Testing with different DATABASE_URL formats..."

echo ""
echo "   Test 1: Direct IP without SSL..."
docker exec nardist_backend_prod sh -c "cd /app && DATABASE_URL='postgresql://nardist:${POSTGRES_PASSWORD}@${POSTGRES_IP}:5432/nardist_db?sslmode=disable' npx prisma db execute --stdin" <<< "SELECT 1;" 2>&1 | head -5

echo ""
echo "   Test 2: With hostname 'postgres'..."
docker exec nardist_backend_prod sh -c 'cd /app && npx prisma db execute --stdin' <<< "SELECT 1;" 2>&1 | head -5

echo ""
echo "   Test 3: With explicit connection parameters..."
docker exec nardist_backend_prod sh -c "cd /app && DATABASE_URL='postgresql://nardist:${POSTGRES_PASSWORD}@${POSTGRES_IP}:5432/nardist_db?connect_timeout=10' npx prisma db execute --stdin" <<< "SELECT 1;" 2>&1 | head -5

# 3. Проверяем, может ли psql подключиться (если есть)
echo ""
echo "3️⃣ Testing with psql (if available)..."
docker exec nardist_backend_prod sh -c "which psql && psql -h $POSTGRES_IP -U nardist -d nardist_db -c 'SELECT 1;' 2>&1" || echo "psql not available"

# 4. Проверяем логи PostgreSQL в реальном времени
echo ""
echo "4️⃣ Monitoring PostgreSQL logs while Prisma tries to connect..."
timeout 5 docker logs -f nardist_postgres_prod 2>&1 &
LOG_PID=$!

sleep 1
docker exec nardist_backend_prod sh -c "cd /app && timeout 3 npx prisma db execute --stdin" <<< "SELECT 1;" 2>&1 >/dev/null

sleep 2
kill $LOG_PID 2>/dev/null || true

echo ""
echo "✅ Debug completed!"

