#!/bin/bash

echo "🔍 Checking iptables rules for PostgreSQL port 5432..."
echo ""

echo "1️⃣ Checking INPUT chain..."
iptables -L INPUT -n -v | grep -E "5432|172.18" || echo "No specific rules for 5432"

echo ""
echo "2️⃣ Checking FORWARD chain (Docker uses this)..."
iptables -L FORWARD -n -v | grep -E "5432|172.18" || echo "No specific rules for 5432"

echo ""
echo "3️⃣ Checking DOCKER chain..."
iptables -L DOCKER -n -v 2>/dev/null | grep -E "5432|172.18" || echo "No DOCKER chain or no rules"

echo ""
echo "4️⃣ Testing if we can connect from host to postgres container..."
POSTGRES_IP=$(docker inspect nardist_postgres_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
echo "Postgres IP: $POSTGRES_IP"
timeout 2 nc -zv $POSTGRES_IP 5432 2>&1 || echo "❌ Cannot connect from host"

echo ""
echo "5️⃣ Testing connection from another container (redis) to postgres..."
docker exec nardist_redis_prod sh -c "echo '' | nc -w 2 $POSTGRES_IP 5432" 2>&1 && echo "✅ Connection works from redis" || echo "❌ Connection failed from redis"

echo ""
echo "6️⃣ Checking if postgres accepts connections on all interfaces..."
docker exec nardist_postgres_prod netstat -tlnp 2>/dev/null | grep 5432 || \
docker exec nardist_postgres_prod ss -tlnp 2>/dev/null | grep 5432 || \
echo "Cannot check listening ports"

echo ""
echo "✅ Check completed!"

