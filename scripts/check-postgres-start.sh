#!/bin/bash

echo "🔍 Checking why postgres container fails to start..."
echo ""

# 1. Проверяем статус
echo "1️⃣ Checking postgres container status..."
docker ps -a | grep nardist_postgres_prod

# 2. Проверяем логи
echo ""
echo "2️⃣ Checking postgres logs..."
docker logs nardist_postgres_prod --tail 50 2>&1 || echo "Cannot get logs"

# 3. Пробуем запустить вручную
echo ""
echo "3️⃣ Trying to start postgres manually..."
docker compose -f docker-compose.prod.yml up -d postgres
sleep 5

# 4. Проверяем статус
echo ""
echo "4️⃣ Checking status after manual start..."
docker ps | grep nardist_postgres_prod || echo "❌ Postgres not running"

# 5. Проверяем ошибки
echo ""
echo "5️⃣ Checking for errors..."
docker inspect nardist_postgres_prod --format '{{.State.Status}} {{.State.Error}}' 2>/dev/null || echo "Cannot inspect"

echo ""
echo "✅ Check completed!"

