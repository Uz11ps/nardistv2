#!/bin/bash

echo "🔍 Final PostgreSQL connection test..."
echo ""

# Убеждаемся что контейнеры запущены
docker compose -f docker-compose.prod.yml up -d postgres redis backend
sleep 10

POSTGRES_IP=$(docker inspect nardist_postgres_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null)
echo "Postgres IP: $POSTGRES_IP"
echo ""

# 1. Проверяем что nc работает
echo "1️⃣ Testing with nc..."
if docker exec nardist_backend_prod sh -c "echo '' | timeout 2 nc -w 1 $POSTGRES_IP 5432" 2>&1 | head -1; then
  echo "✅ nc can connect"
else
  echo "❌ nc cannot connect"
  exit 1
fi

# 2. Проверяем что Node.js НЕ может подключиться
echo ""
echo "2️⃣ Testing with Node.js (should fail)..."
docker exec nardist_backend_prod sh -c "node -e \"
const net = require('net');
const client = net.createConnection({ host: '$POSTGRES_IP', port: 5432, timeout: 3000 }, () => {
  console.log('Connected');
  client.end();
  process.exit(0);
});
client.on('error', (e) => {
  console.log('Error:', e.code);
  process.exit(1);
});
setTimeout(() => {
  console.log('Timeout');
  process.exit(1);
}, 4000);
\"" 2>&1

# 3. Проверяем разницу - может быть проблема в том, как Node.js создает соединение
echo ""
echo "3️⃣ Checking network interfaces in backend..."
docker exec nardist_backend_prod ip addr show | grep -E "inet.*172.18" || echo "No 172.18 interface"

echo ""
echo "4️⃣ Checking if there's a firewall in backend container..."
docker exec nardist_backend_prod iptables -L -n 2>/dev/null | head -10 || echo "iptables not available or no rules"

echo ""
echo "✅ Test completed!"
echo ""
echo "🔍 CONCLUSION:"
echo "If nc works but Node.js doesn't, there might be:"
echo "1. Firewall blocking Node.js connections"
echo "2. Different network namespace"
echo "3. Problem with how Node.js creates sockets"
echo ""
echo "SOLUTION: Use nc for connection check in migrations, not Node.js/Prisma"

