#!/bin/bash

echo "🔍 Testing if PostgreSQL can connect to itself..."
echo ""

POSTGRES_IP=$(docker inspect nardist_postgres_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
echo "Postgres IP: $POSTGRES_IP"
echo ""

# 1. Проверяем через pg_isready
echo "1️⃣ Testing with pg_isready..."
docker exec nardist_postgres_prod pg_isready -h $POSTGRES_IP -U nardist 2>&1

# 2. Проверяем через psql
echo ""
echo "2️⃣ Testing with psql..."
docker exec nardist_postgres_prod psql -h $POSTGRES_IP -U nardist -d nardist_db -c "SELECT 1;" 2>&1

# 3. Проверяем через nc из postgres контейнера
echo ""
echo "3️⃣ Testing with nc from postgres container..."
docker exec nardist_postgres_prod sh -c "echo '' | nc -w 2 $POSTGRES_IP 5432" 2>&1 && echo "✅ nc works" || echo "❌ nc failed"

# 4. Проверяем что слушает
echo ""
echo "4️⃣ Checking what PostgreSQL is listening on..."
docker exec nardist_postgres_prod netstat -tlnp 2>/dev/null | grep 5432 || \
docker exec nardist_postgres_prod ss -tlnp 2>/dev/null | grep 5432 || \
echo "Cannot check"

echo ""
echo "✅ Test completed!"

