#!/bin/bash

echo "🔍 Checking PostgreSQL port 5432..."
echo ""

echo "1️⃣ Checking if PostgreSQL is listening inside postgres container..."
docker exec nardist_postgres_prod netstat -tlnp 2>/dev/null | grep 5432 || \
docker exec nardist_postgres_prod ss -tlnp 2>/dev/null | grep 5432 || \
echo "  ⚠️  Cannot check listening ports"

echo ""
echo "2️⃣ Checking PostgreSQL config (listen_addresses)..."
docker exec nardist_postgres_prod sh -c 'psql -U nardist -d nardist_db -c "SHOW listen_addresses;" 2>&1' || echo "  ⚠️  Cannot check config"

echo ""
echo "3️⃣ Testing connection from postgres container to itself..."
docker exec nardist_postgres_prod sh -c 'pg_isready -h localhost -U nardist' || echo "  ❌ Not ready on localhost"
docker exec nardist_postgres_prod sh -c 'pg_isready -h 0.0.0.0 -U nardist' || echo "  ❌ Not ready on 0.0.0.0"
docker exec nardist_postgres_prod sh -c 'pg_isready -h 172.18.0.2 -U nardist' || echo "  ❌ Not ready on 172.18.0.2"

echo ""
echo "4️⃣ Testing connection from backend to postgres IP with different methods..."
echo "  Method 1: nc with timeout..."
docker exec nardist_backend_prod sh -c 'echo "test" | timeout 2 nc 172.18.0.2 5432 && echo "✅ Connected" || echo "❌ Failed"' 2>&1

echo ""
echo "  Method 2: telnet (if available)..."
docker exec nardist_backend_prod sh -c 'timeout 2 telnet 172.18.0.2 5432 2>&1' | head -5 || echo "  telnet not available"

echo ""
echo "5️⃣ Checking PostgreSQL logs for connection attempts..."
docker logs nardist_postgres_prod --tail 20 2>&1 | grep -i "listen\|accept\|connection\|error" || echo "  No relevant logs"

echo ""
echo "6️⃣ Testing with psql from backend (if psql is installed)..."
docker exec nardist_backend_prod sh -c 'which psql && psql -h 172.18.0.2 -U nardist -d nardist_db -c "SELECT 1;" 2>&1' || echo "  psql not available in backend"

echo ""
echo "✅ Port check completed!"

