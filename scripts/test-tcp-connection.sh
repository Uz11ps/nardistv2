#!/bin/bash

echo "🔍 Testing TCP connection to PostgreSQL..."
echo ""

POSTGRES_IP=$(docker inspect nardist_postgres_prod --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
echo "Postgres IP: $POSTGRES_IP"
echo ""

# 1. Проверяем через telnet (если есть)
echo "1️⃣ Testing with telnet..."
docker exec nardist_backend_prod sh -c "which telnet && echo 'quit' | timeout 3 telnet $POSTGRES_IP 5432 2>&1" || echo "telnet not available"

# 2. Проверяем через curl (если есть)
echo ""
echo "2️⃣ Testing with curl..."
docker exec nardist_backend_prod sh -c "which curl && curl -v telnet://$POSTGRES_IP:5432 2>&1" | head -10 || echo "curl not available or connection failed"

# 3. Проверяем через node напрямую
echo ""
echo "3️⃣ Testing with Node.js TCP connection..."
docker exec nardist_backend_prod sh -c 'node -e "
const net = require(\"net\");
const client = net.createConnection({ host: \"'$POSTGRES_IP'\", port: 5432 }, () => {
  console.log(\"✅ TCP connection successful\");
  client.end();
});
client.on(\"error\", (err) => {
  console.log(\"❌ TCP connection failed:\", err.message);
  process.exit(1);
});
setTimeout(() => {
  console.log(\"❌ Connection timeout\");
  process.exit(1);
}, 3000);
"' 2>&1

# 4. Проверяем через Python (если есть)
echo ""
echo "4️⃣ Testing with Python (if available)..."
docker exec nardist_backend_prod sh -c "which python3 && python3 -c \"
import socket
import sys
try:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    sock.settimeout(3)
    result = sock.connect_ex(('$POSTGRES_IP', 5432))
    if result == 0:
        print('✅ TCP connection successful')
    else:
        print('❌ TCP connection failed')
    sock.close()
except Exception as e:
    print(f'❌ Error: {e}')
    sys.exit(1)
\"" 2>&1 || echo "Python not available"

# 5. Проверяем через strace что делает Prisma
echo ""
echo "5️⃣ Checking what Prisma is doing (if strace available)..."
docker exec nardist_backend_prod sh -c "which strace && timeout 3 strace -e trace=connect,write,read -f npx prisma db execute --stdin" <<< "SELECT 1;" 2>&1 | grep -E "connect|5432|postgres" | head -10 || echo "strace not available"

echo ""
echo "✅ TCP test completed!"

