#!/bin/bash

# Скрипт для исправления образа backend - использует локальный образ вместо registry

set -e

echo "🔧 Исправление образа backend"
echo ""

cd /opt/Nardist

# 1. Останавливаем backend
echo "1️⃣ Останавливаем backend..."
docker compose -f docker-compose.prod.yml stop backend
docker compose -f docker-compose.prod.yml rm -f backend

# 2. Проверяем что локальный образ существует
echo "2️⃣ Проверяем локальный образ..."
if ! docker images | grep -q "nardist-backend.*latest"; then
    echo "❌ Локальный образ nardist-backend:latest не найден!"
    echo "Запустите сначала: bash scripts/build-preinstall-deps.sh"
    exit 1
fi
echo "✅ Локальный образ найден"

# 3. Убеждаемся что PostgreSQL и Redis запущены
echo "3️⃣ Проверяем PostgreSQL и Redis..."
if ! docker compose -f docker-compose.prod.yml ps postgres | grep -q "Up"; then
    echo "⚠️  PostgreSQL не запущен, запускаем..."
    docker compose -f docker-compose.prod.yml up -d postgres
    sleep 5
fi

if ! docker compose -f docker-compose.prod.yml ps redis | grep -q "Up"; then
    echo "⚠️  Redis не запущен, запускаем..."
    docker compose -f docker-compose.prod.yml up -d redis
    sleep 5
fi

# 4. Запускаем backend с локальным образом (используем docker run напрямую)
echo "4️⃣ Запускаем backend с локальным образом..."
# Останавливаем и удаляем старый контейнер если он есть
docker stop nardist_backend_prod 2>/dev/null || true
docker rm nardist_backend_prod 2>/dev/null || true

# Загружаем переменные окружения
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Запускаем backend контейнер напрямую с локальным образом
docker run -d \
  --name nardist_backend_prod \
  --network nardist_network \
  --restart unless-stopped \
  -e DATABASE_URL="postgresql://${POSTGRES_USER:-nardist}:${POSTGRES_PASSWORD:-nardist_password}@postgres:5432/${POSTGRES_DB:-nardist_db}" \
  -e REDIS_URL="redis://redis:6379" \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e JWT_SECRET="${JWT_SECRET}" \
  -e TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN}" \
  -e FRONTEND_URL="${FRONTEND_URL:-https://nardist.online}" \
  nardist-backend:latest

# 5. Ждем немного
echo "5️⃣ Ждем запуска backend..."
sleep 10

# 6. Проверяем переменные окружения
echo "6️⃣ Проверяем переменные окружения backend..."
docker exec nardist_backend_prod env | grep -E "(DATABASE_URL|REDIS_URL)" || echo "⚠️  Переменные не найдены"

# 7. Проверяем логи
echo ""
echo "📝 Логи backend (последние 30 строк):"
docker logs nardist_backend_prod --tail=30 2>&1

echo ""
echo "✅ Готово!"
