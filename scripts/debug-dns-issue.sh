#!/bin/bash

echo "🔍 Debugging DNS issue - postgres resolves to wrong IP!"
echo ""

echo "1️⃣ Checking what 'postgres' resolves to from backend..."
docker exec nardist_backend_prod getent hosts postgres
docker exec nardist_backend_prod nslookup postgres 2>/dev/null || echo "nslookup not available"

echo ""
echo "2️⃣ Checking what 'nardist_postgres_prod' resolves to..."
docker exec nardist_backend_prod getent hosts nardist_postgres_prod
docker exec nardist_backend_prod nslookup nardist_postgres_prod 2>/dev/null || echo "nslookup not available"

echo ""
echo "3️⃣ Checking /etc/hosts in backend container..."
docker exec nardist_backend_prod cat /etc/hosts | grep -E "postgres|172.18"

echo ""
echo "4️⃣ Checking actual container IPs..."
echo "Postgres container IP:"
docker inspect nardist_postgres_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'
echo ""
echo "Backend container IP:"
docker inspect nardist_backend_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'

echo ""
echo "5️⃣ Checking network DNS configuration..."
docker network inspect nardist_network --format '{{range .Containers}}{{.Name}} -> {{.IPv4Address}}{{"\n"}}{{end}}'

echo ""
echo "6️⃣ Testing connection to postgres by container name..."
docker exec nardist_backend_prod ping -c 1 nardist_postgres_prod 2>&1 | head -3

echo ""
echo "7️⃣ Testing Prisma with container name instead of service name..."
docker exec nardist_backend_prod sh -c 'cd /app && DATABASE_URL="postgresql://nardist:${POSTGRES_PASSWORD}@nardist_postgres_prod:5432/nardist_db" npx prisma db execute --stdin <<< "SELECT 1;" 2>&1' | head -5

echo ""
echo "✅ Debug completed!"

