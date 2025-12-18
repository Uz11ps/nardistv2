#!/bin/bash

echo "🔍 Testing Node.js TCP connection to PostgreSQL..."
echo ""

# Убеждаемся что контейнеры запущены
if ! docker ps | grep -q nardist_backend_prod; then
  echo "⚠️  Backend not running, starting it..."
  docker compose -f docker-compose.prod.yml up -d backend
  sleep 10
fi

if ! docker ps | grep -q nardist_postgres_prod; then
  echo "⚠️  Postgres not running, starting it..."
  docker compose -f docker-compose.prod.yml up -d postgres
  sleep 10
fi

POSTGRES_IP=$(docker inspect nardist_postgres_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' 2>/dev/null)
if [ -z "$POSTGRES_IP" ] || [ "$POSTGRES_IP" = "invalid IP" ]; then
  echo "❌ Cannot get postgres IP"
  exit 1
fi

echo "Postgres IP: $POSTGRES_IP"
echo ""

# Тестируем Node.js TCP соединение
echo "1️⃣ Testing raw Node.js TCP connection..."
docker exec nardist_backend_prod sh -c "node -e \"
const net = require('net');
console.log('Connecting to $POSTGRES_IP:5432...');
const client = net.createConnection({ 
  host: '$POSTGRES_IP', 
  port: 5432,
  timeout: 5000
}, () => {
  console.log('✅ TCP connection established!');
  console.log('Local address:', client.localAddress, client.localPort);
  console.log('Remote address:', client.remoteAddress, client.remotePort);
  client.end();
  process.exit(0);
});
client.on('error', (e) => {
  console.log('❌ TCP error:', e.code, e.message);
  console.log('Error details:', e);
  process.exit(1);
});
client.on('timeout', () => {
  console.log('❌ TCP timeout');
  client.destroy();
  process.exit(1);
});
setTimeout(() => {
  console.log('❌ Overall timeout after 6 seconds');
  client.destroy();
  process.exit(1);
}, 6000);
\"" 2>&1

echo ""
echo "2️⃣ Testing with pg library (if available)..."
docker exec nardist_backend_prod sh -c "node -e \"
try {
  const { Client } = require('pg');
  const client = new Client({
    host: '$POSTGRES_IP',
    port: 5432,
    user: 'nardist',
    password: '$(grep POSTGRES_PASSWORD .env | sed "s/^POSTGRES_PASSWORD=//")',
    database: 'nardist_db',
    connectionTimeoutMillis: 5000
  });
  client.connect().then(() => {
    console.log('✅ pg library connection successful!');
    client.end();
    process.exit(0);
  }).catch((e) => {
    console.log('❌ pg library connection failed:', e.message);
    process.exit(1);
  });
} catch (e) {
  console.log('pg library not available');
  process.exit(0);
}
\"" 2>&1

echo ""
echo "✅ Node.js TCP test completed!"

