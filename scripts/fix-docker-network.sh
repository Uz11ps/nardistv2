#!/bin/bash

set -e

echo "🔧 Fixing Docker network issue..."
echo ""

# 1. Полностью останавливаем все
echo "1️⃣ Stopping all containers..."
docker compose -f docker-compose.prod.yml down --remove-orphans
sleep 2

# 2. Удаляем старые контейнеры
echo "2️⃣ Removing old containers..."
docker ps -a --filter "name=nardist_" --format "{{.Names}}" | xargs -r docker rm -f 2>/dev/null || true
sleep 2

# 3. Удаляем и пересоздаем сеть
echo "3️⃣ Recreating network..."
docker network rm nardist_network 2>/dev/null || true
sleep 2
docker network create nardist_network --driver bridge --subnet 172.18.0.0/16 2>/dev/null || true
sleep 2

# 4. Запускаем только postgres и redis сначала
echo "4️⃣ Starting postgres and redis..."
docker compose -f docker-compose.prod.yml up -d postgres redis
sleep 10

# 5. Проверяем что они в сети
echo "5️⃣ Checking network..."
docker network inspect nardist_network --format '{{range .Containers}}{{.Name}} -> {{.IPv4Address}}{{"\n"}}{{end}}'

# 6. Тестируем подключение между redis и postgres
echo ""
echo "6️⃣ Testing connection between redis and postgres..."
POSTGRES_IP=$(docker inspect nardist_postgres_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
echo "Postgres IP: $POSTGRES_IP"

if docker exec nardist_redis_prod ping -c 1 $POSTGRES_IP >/dev/null 2>&1; then
  echo "✅ Ping works"
  
  # Пробуем подключиться к порту
  if docker exec nardist_redis_prod sh -c "echo '' | timeout 2 nc -w 1 $POSTGRES_IP 5432" 2>&1 | head -1; then
    echo "✅ Port 5432 is reachable"
  else
    echo "❌ Port 5432 is NOT reachable"
    echo "Checking PostgreSQL logs..."
    docker logs nardist_postgres_prod --tail 10
  fi
else
  echo "❌ Ping failed - network issue!"
fi

echo ""
echo "✅ Network fix completed!"

