#!/bin/bash

echo "🔍 Checking if network is blocking connections..."
echo ""

# 1. Проверяем iptables на хосте
echo "1️⃣ Checking host iptables rules..."
iptables -L -n | grep -E "5432|172.18" || echo "No specific rules for 5432 or 172.18"

# 2. Проверяем Docker iptables
echo ""
echo "2️⃣ Checking Docker iptables rules..."
iptables -t nat -L -n | grep -E "5432|172.18" || echo "No NAT rules found"

# 3. Проверяем, может ли backend отправить пакет
echo ""
echo "3️⃣ Testing if backend can send packets to postgres..."
docker exec nardist_backend_prod ping -c 1 172.18.0.2 >/dev/null 2>&1 && echo "✅ Ping works" || echo "❌ Ping failed"

# 4. Проверяем сетевые интерфейсы
echo ""
echo "4️⃣ Checking network interfaces in containers..."
echo "Backend interfaces:"
docker exec nardist_backend_prod ip addr show | grep -E "inet.*172.18" || echo "No 172.18 interface"
echo "Postgres interfaces:"
docker exec nardist_postgres_prod ip addr show | grep -E "inet.*172.18" || echo "No 172.18 interface"

# 5. Проверяем маршрутизацию
echo ""
echo "5️⃣ Checking routing..."
echo "Backend routes:"
docker exec nardist_backend_prod ip route | grep 172.18 || echo "No route to 172.18"
echo "Postgres routes:"
docker exec nardist_postgres_prod ip route | grep 172.18 || echo "No route to 172.18"

# 6. Пробуем tcpdump на postgres контейнере
echo ""
echo "6️⃣ Starting tcpdump on postgres to see if packets arrive..."
timeout 5 docker exec nardist_postgres_prod tcpdump -i any -n port 5432 2>&1 &
TCPDUMP_PID=$!

# Пытаемся подключиться
docker exec nardist_backend_prod sh -c 'cd /app && timeout 3 npx prisma db execute --stdin' <<< "SELECT 1;" 2>&1 >/dev/null

sleep 2
kill $TCPDUMP_PID 2>/dev/null || true

echo ""
echo "✅ Network check completed!"

