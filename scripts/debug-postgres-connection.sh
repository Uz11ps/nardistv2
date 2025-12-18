#!/bin/bash

echo "🔍 Debugging PostgreSQL connection..."
echo ""

echo "1️⃣ Checking if PostgreSQL is listening on port 5432..."
docker exec nardist_postgres_prod netstat -tlnp 2>/dev/null | grep 5432 || \
docker exec nardist_postgres_prod ss -tlnp 2>/dev/null | grep 5432 || \
echo "  ⚠️  Cannot check listening ports"

echo ""
echo "2️⃣ Testing PostgreSQL readiness from inside postgres container..."
docker exec nardist_postgres_prod pg_isready -U nardist || echo "  ❌ PostgreSQL not ready"

echo ""
echo "3️⃣ Testing connection from backend to postgres IP directly..."
docker exec nardist_backend_prod nc -zv 172.18.0.4 5432 2>&1 || echo "  ❌ Cannot connect to 172.18.0.4:5432"

echo ""
echo "4️⃣ Testing connection from backend to postgres hostname (with timeout)..."
timeout 5 docker exec nardist_backend_prod sh -c 'nc -zv postgres 5432' 2>&1 || echo "  ⚠️  Connection timeout or failed"

echo ""
echo "5️⃣ Checking PostgreSQL logs for connection attempts..."
docker logs nardist_postgres_prod --tail 20 2>&1 | grep -i "ready\|listen\|accept\|error" || echo "  No relevant logs"

echo ""
echo "6️⃣ Testing with telnet (if available)..."
docker exec nardist_backend_prod sh -c 'timeout 3 sh -c "</dev/tcp/postgres/5432" && echo "✅ TCP connection successful" || echo "❌ TCP connection failed"' 2>&1

echo ""
echo "✅ Debug completed!"

