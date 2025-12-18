#!/bin/bash

echo "🔍 Testing PostgreSQL connection..."
echo ""

# Удаляем старый контейнер миграций
docker rm -f nardist-migrations-run-bcacc8aedeb8 2>/dev/null || true

echo "1️⃣ Testing with nc (Alpine syntax)..."
docker exec nardist_backend_prod sh -c 'printf "SELECT 1;\n" | nc -w 3 172.18.0.2 5432' 2>&1 | head -5

echo ""
echo "2️⃣ Testing with Prisma and direct IP..."
POSTGRES_PASSWORD=$(grep POSTGRES_PASSWORD .env | cut -d '=' -f2)
docker exec nardist_backend_prod sh -c "cd /app && DATABASE_URL='postgresql://nardist:${POSTGRES_PASSWORD}@172.18.0.2:5432/nardist_db' npx prisma db execute --stdin" <<< "SELECT 1;" 2>&1

echo ""
echo "3️⃣ Testing with Prisma and hostname..."
docker exec nardist_backend_prod sh -c 'cd /app && npx prisma db execute --stdin' <<< "SELECT 1;" 2>&1

echo ""
echo "4️⃣ Checking PostgreSQL logs for connection attempts..."
docker logs nardist_postgres_prod --tail 10

echo ""
echo "✅ Test completed!"

