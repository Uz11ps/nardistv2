#!/bin/bash

# Скрипт для полного пересоздания всех контейнеров с правильной сетью

set -e

echo "🔄 Полное пересоздание всех контейнеров"
echo ""

cd /opt/Nardist

# 1. Останавливаем все контейнеры
echo "1️⃣ Останавливаем все контейнеры..."
docker compose -f docker-compose.prod.yml down

# 2. Удаляем сеть если она существует (чтобы создать заново)
echo "2️⃣ Удаляем старую сеть..."
docker network rm nardist_network 2>/dev/null || true
sleep 2

# 3. Убеждаемся что используется локальный образ backend
export BACKEND_IMAGE=nardist-backend:latest

# 4. Запускаем PostgreSQL и Redis первыми
echo "3️⃣ Запускаем PostgreSQL и Redis..."
docker compose -f docker-compose.prod.yml up -d postgres redis

# 5. Ждем пока они запустятся и будут готовы
echo "4️⃣ Ждем запуска PostgreSQL и Redis..."
for i in {1..30}; do
    if docker compose -f docker-compose.prod.yml ps postgres | grep -q "Up" && \
       docker compose -f docker-compose.prod.yml ps redis | grep -q "Up"; then
        echo "✅ Контейнеры запущены, ждем готовности..."
        break
    fi
    sleep 1
done

# Ждем еще немного для healthcheck
echo "⏳ Ждем готовности healthcheck..."
sleep 20

# 6. Проверяем базу данных
echo "5️⃣ Проверяем базу данных..."
chmod +x scripts/ensure-database.sh
bash scripts/ensure-database.sh || echo "⚠️  Проблема с базой данных, продолжаем..."

# 7. Запускаем остальные сервисы
echo "6️⃣ Запускаем остальные сервисы..."
docker compose -f docker-compose.prod.yml up -d --no-build

# 8. Ждем немного
echo "7️⃣ Ждем запуска всех сервисов..."
sleep 10

# 9. Проверяем статус
echo "8️⃣ Статус контейнеров:"
docker compose -f docker-compose.prod.yml ps

echo ""
echo "📝 Логи backend (последние 50 строк):"
docker compose -f docker-compose.prod.yml logs --tail=50 backend

echo ""
echo "✅ Готово!"
