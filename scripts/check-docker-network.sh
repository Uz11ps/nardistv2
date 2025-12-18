#!/bin/bash

echo "🔍 Checking Docker network on server..."
echo ""

# 1. Проверяем существование сети
echo "1️⃣ Checking if nardist_network exists..."
docker network ls | grep nardist_network || echo "❌ Network not found!"

echo ""
echo "2️⃣ Inspecting network details..."
docker network inspect nardist_network 2>/dev/null || echo "❌ Cannot inspect network"

echo ""
echo "3️⃣ Checking containers in network..."
docker network inspect nardist_network --format '{{range .Containers}}{{.Name}} ({{.IPv4Address}}){{"\n"}}{{end}}' 2>/dev/null || echo "❌ No containers in network"

echo ""
echo "4️⃣ Testing DNS resolution from backend container..."
if docker ps | grep -q nardist_backend_prod; then
  echo "  Testing 'postgres' hostname:"
  docker exec nardist_backend_prod getent hosts postgres 2>/dev/null || \
  docker exec nardist_backend_prod nslookup postgres 2>/dev/null || \
  echo "  ❌ Cannot resolve 'postgres'"
  
  echo "  Testing 'nardist_postgres_prod' hostname:"
  docker exec nardist_backend_prod getent hosts nardist_postgres_prod 2>/dev/null || \
  docker exec nardist_backend_prod nslookup nardist_postgres_prod 2>/dev/null || \
  echo "  ❌ Cannot resolve 'nardist_postgres_prod'"
else
  echo "  ⚠️  Backend container not running"
fi

echo ""
echo "5️⃣ Testing network connectivity..."
if docker ps | grep -q nardist_backend_prod && docker ps | grep -q nardist_postgres_prod; then
  echo "  Testing connection from backend to postgres:5432"
  docker exec nardist_backend_prod nc -zv postgres 5432 2>&1 || \
  docker exec nardist_backend_prod sh -c 'timeout 2 sh -c "</dev/tcp/postgres/5432"' 2>&1 || \
  echo "  ❌ Cannot connect to postgres:5432"
else
  echo "  ⚠️  Containers not running"
fi

echo ""
echo "6️⃣ Checking container IPs..."
echo "  Postgres container:"
docker inspect nardist_postgres_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null || echo "  Not found"
echo "  Backend container:"
docker inspect nardist_backend_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null || echo "  Not found"

echo ""
echo "7️⃣ Testing direct connection to postgres IP..."
POSTGRES_IP=$(docker inspect nardist_postgres_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null)
if [ -n "$POSTGRES_IP" ]; then
  echo "  Postgres IP: $POSTGRES_IP"
  if docker ps | grep -q nardist_backend_prod; then
    docker exec nardist_backend_prod nc -zv $POSTGRES_IP 5432 2>&1 || echo "  ❌ Cannot connect to $POSTGRES_IP:5432"
  fi
else
  echo "  ⚠️  Cannot get postgres IP"
fi

echo ""
echo "✅ Network check completed!"

