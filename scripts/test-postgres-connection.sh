#!/bin/bash

echo "🔍 Testing PostgreSQL connection from backend container..."
echo ""

echo "1️⃣ Testing with timeout and TCP redirection..."
docker exec nardist_backend_prod sh -c 'timeout 3 sh -c "</dev/tcp/172.18.0.4/5432" && echo "✅ Connection to IP successful" || echo "❌ Connection to IP failed"' 2>&1

echo ""
echo "2️⃣ Testing with hostname..."
docker exec nardist_backend_prod sh -c 'timeout 3 sh -c "</dev/tcp/postgres/5432" && echo "✅ Connection to hostname successful" || echo "❌ Connection to hostname failed"' 2>&1

echo ""
echo "3️⃣ Testing with psql (if available)..."
docker exec nardist_backend_prod sh -c 'timeout 3 psql -h postgres -U nardist -d nardist_db -c "SELECT 1;" 2>&1' || echo "  ⚠️  psql not available or connection failed"

echo ""
echo "4️⃣ Testing with Prisma directly..."
docker exec nardist_backend_prod sh -c 'cd /app && timeout 10 npx prisma db execute --stdin <<< "SELECT 1;" 2>&1' || echo "  ⚠️  Prisma connection test failed"

echo ""
echo "5️⃣ Checking if nc command exists and works..."
docker exec nardist_backend_prod which nc || echo "  ⚠️  nc not found"
docker exec nardist_backend_prod nc --version 2>&1 || echo "  ⚠️  nc version check failed"

echo ""
echo "✅ Tests completed!"

