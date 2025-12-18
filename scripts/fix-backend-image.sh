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

# 3. Запускаем backend с локальным образом
echo "3️⃣ Запускаем backend с локальным образом..."
export BACKEND_IMAGE=nardist-backend:latest
docker compose -f docker-compose.prod.yml up -d --no-build backend

# 4. Ждем немного
echo "4️⃣ Ждем запуска backend..."
sleep 10

# 5. Проверяем переменные окружения
echo "5️⃣ Проверяем переменные окружения backend..."
docker exec nardist_backend_prod env | grep -E "(DATABASE_URL|REDIS_URL|BACKEND_IMAGE)" || echo "⚠️  Переменные не найдены"

# 6. Проверяем логи
echo ""
echo "📝 Логи backend (последние 30 строк):"
docker compose -f docker-compose.prod.yml logs --tail=30 backend

echo ""
echo "✅ Готово!"
