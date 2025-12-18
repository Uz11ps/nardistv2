#!/bin/bash

echo "🔧 Fixing backend network configuration..."
echo ""

# 1. Полностью пересоздаем backend
echo "1️⃣ Recreating backend container..."
docker compose -f docker-compose.prod.yml stop backend
docker rm -f nardist_backend_prod 2>/dev/null || true
sleep 2

# 2. Проверяем сеть
echo "2️⃣ Checking network..."
docker network inspect nardist_network --format '{{range .Containers}}{{.Name}} -> {{.IPv4Address}}{{"\n"}}{{end}}'

# 3. Запускаем backend заново
echo ""
echo "3️⃣ Starting backend..."
docker compose -f docker-compose.prod.yml up -d backend
sleep 10

# 4. Проверяем сетевые настройки backend
echo ""
echo "4️⃣ Checking backend network configuration..."
BACKEND_IP=$(docker inspect nardist_backend_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
POSTGRES_IP=$(docker inspect nardist_postgres_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
REDIS_IP=$(docker inspect nardist_redis_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')

echo "Backend IP: $BACKEND_IP"
echo "Postgres IP: $POSTGRES_IP"
echo "Redis IP: $REDIS_IP"

# 5. Проверяем ping
echo ""
echo "5️⃣ Testing connectivity..."
docker exec nardist_backend_prod ping -c 1 $POSTGRES_IP >/dev/null 2>&1 && echo "✅ Ping to postgres works" || echo "❌ Ping to postgres failed"
docker exec nardist_backend_prod ping -c 1 $REDIS_IP >/dev/null 2>&1 && echo "✅ Ping to redis works" || echo "❌ Ping to redis failed"

# 6. Проверяем порты
echo ""
echo "6️⃣ Testing ports..."
docker exec nardist_backend_prod sh -c "echo '' | timeout 2 nc -w 1 $POSTGRES_IP 5432" 2>&1 | head -1 && echo "✅ Port 5432 reachable" || echo "❌ Port 5432 NOT reachable"
docker exec nardist_backend_prod sh -c "echo '' | timeout 2 nc -w 1 $REDIS_IP 6379" 2>&1 | head -1 && echo "✅ Port 6379 reachable" || echo "❌ Port 6379 NOT reachable"

# 7. Проверяем DNS
echo ""
echo "7️⃣ Testing DNS resolution..."
docker exec nardist_backend_prod getent hosts postgres
docker exec nardist_backend_prod getent hosts redis

# 8. Тестируем Node.js TCP
echo ""
echo "8️⃣ Testing Node.js TCP connection..."
docker exec nardist_backend_prod sh -c "node -e \"
const net = require('net');
console.log('Attempting connection to $POSTGRES_IP:5432...');
const client = net.createConnection({ host: '$POSTGRES_IP', port: 5432, timeout: 5000 }, () => {
  console.log('✅ TCP connection successful!');
  client.end();
  process.exit(0);
});
client.on('error', (e) => {
  console.log('❌ TCP connection error:', e.code, e.message);
  process.exit(1);
});
client.on('timeout', () => {
  console.log('❌ TCP connection timeout');
  client.destroy();
  process.exit(1);
});
setTimeout(() => {
  console.log('❌ Overall timeout');
  client.destroy();
  process.exit(1);
}, 6000);
\"" 2>&1

echo ""
echo "✅ Network fix completed!"

