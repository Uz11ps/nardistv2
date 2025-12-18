#!/bin/bash

# Скрипт для исправления подключения backend к PostgreSQL и Redis

set -e

echo "🔧 Исправление подключения backend"
echo ""

cd /opt/Nardist

# 1. Останавливаем backend
echo "1️⃣ Останавливаем backend..."
docker compose -f docker-compose.prod.yml stop backend
docker compose -f docker-compose.prod.yml rm -f backend

# 2. Убеждаемся что используется локальный образ
echo "2️⃣ Проверяем образ backend..."
export BACKEND_IMAGE=nardist-backend:latest
docker images | grep nardist-backend || {
    echo "❌ Образ nardist-backend:latest не найден!"
    echo "Запустите сначала: bash scripts/build-preinstall-deps.sh"
    exit 1
}
echo "✅ Образ найден: $(docker images --format '{{.Repository}}:{{.Tag}}' nardist-backend:latest)"
echo ""

# 3. Проверяем что PostgreSQL и Redis запущены
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

echo "✅ PostgreSQL и Redis запущены"
echo ""

# 4. Проверяем сеть
echo "4️⃣ Проверяем сеть..."
if ! docker network inspect nardist_network >/dev/null 2>&1; then
    echo "⚠️  Сеть не найдена, создаем..."
    docker network create nardist_network
fi
echo "✅ Сеть существует"
echo ""

# 5. Запускаем backend с правильным образом
echo "5️⃣ Запускаем backend с локальным образом..."
export BACKEND_IMAGE=nardist-backend:latest
docker compose -f docker-compose.prod.yml up -d --no-build backend

# 6. Ждем немного и проверяем логи
echo "6️⃣ Ждем запуска backend..."
sleep 10

echo ""
echo "📝 Логи backend (последние 30 строк):"
docker compose -f docker-compose.prod.yml logs --tail=30 backend

echo ""
echo "✅ Готово! Проверьте логи выше."
