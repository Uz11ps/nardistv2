#!/bin/bash

echo "🔍 Testing direct connection to PostgreSQL..."
echo ""

# Убеждаемся что контейнеры запущены
echo "0️⃣ Starting containers if needed..."
docker compose -f docker-compose.prod.yml up -d postgres backend
sleep 5

echo ""
echo "1️⃣ PostgreSQL is listening on 0.0.0.0:5432 ✅"
echo "   listen_addresses = * ✅"
echo ""

echo "2️⃣ Testing connection from backend using different methods..."
echo ""

echo "   Method 1: Using nc with echo (Alpine syntax)..."
docker exec nardist_backend_prod sh -c 'echo "test" | nc -w 2 172.18.0.2 5432 && echo "✅ Connection successful" || echo "❌ Connection failed"' 2>&1

echo ""
echo "   Method 2: Using nc without echo..."
docker exec nardist_backend_prod sh -c 'printf "" | nc -w 2 172.18.0.2 5432 && echo "✅ Connection successful" || echo "❌ Connection failed"' 2>&1

echo ""
echo "   Method 3: Using Prisma with direct IP..."
docker exec nardist_backend_prod sh -c 'cd /app && DATABASE_URL="postgresql://nardist:${POSTGRES_PASSWORD}@172.18.0.2:5432/nardist_db" npx prisma db execute --stdin <<EOF
SELECT 1;
EOF
' 2>&1 | head -10

echo ""
echo "   Method 4: Using Prisma with hostname 'postgres'..."
docker exec nardist_backend_prod sh -c 'cd /app && npx prisma db execute --stdin <<EOF
SELECT 1;
EOF
' 2>&1 | head -10

echo ""
echo "3️⃣ Checking if there's a firewall or iptables rule blocking..."
docker exec nardist_postgres_prod iptables -L -n 2>/dev/null | head -10 || echo "  iptables not available or no rules"

echo ""
echo "4️⃣ Testing from postgres container to itself on network IP..."
docker exec nardist_postgres_prod sh -c 'pg_isready -h 172.18.0.2 -U nardist' && echo "✅ Postgres can connect to itself" || echo "❌ Postgres cannot connect to itself"

echo ""
echo "✅ Connection test completed!"

