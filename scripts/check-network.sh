#!/bin/bash

# Скрипт для проверки сети Docker и доступности сервисов

set -e

echo "🔍 Проверка сети Docker и доступности сервисов"
echo ""

cd /opt/Nardist

# 1. Проверяем сеть
echo "1️⃣ Проверка сети Docker..."
docker network inspect nardist_network --format '{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null || {
    echo "❌ Сеть nardist_network не найдена!"
    exit 1
}
echo "✅ Сеть nardist_network существует"
echo ""

# 2. Проверяем какие контейнеры в сети
echo "2️⃣ Контейнеры в сети:"
docker network inspect nardist_network --format '{{range .Containers}}{{.Name}} ({{.IPv4Address}}){{"\n"}}{{end}}'
echo ""

# 3. Проверяем доступность PostgreSQL из backend контейнера
echo "3️⃣ Проверка доступности PostgreSQL из backend..."
if docker ps | grep -q nardist_backend_prod; then
    echo "Проверяем ping postgres..."
    docker exec nardist_backend_prod sh -c "nc -zv postgres 5432" 2>&1 || echo "⚠️  Не удалось подключиться к postgres:5432"
    
    echo "Проверяем DNS резолюцию..."
    docker exec nardist_backend_prod sh -c "getent hosts postgres" || echo "⚠️  Не удалось разрешить имя postgres"
else
    echo "⚠️  Backend контейнер не запущен"
fi
echo ""

# 4. Проверяем доступность Redis из backend контейнера
echo "4️⃣ Проверка доступности Redis из backend..."
if docker ps | grep -q nardist_backend_prod; then
    echo "Проверяем ping redis..."
    docker exec nardist_backend_prod sh -c "nc -zv redis 6379" 2>&1 || echo "⚠️  Не удалось подключиться к redis:6379"
    
    echo "Проверяем DNS резолюцию..."
    docker exec nardist_backend_prod sh -c "getent hosts redis" || echo "⚠️  Не удалось разрешить имя redis"
else
    echo "⚠️  Backend контейнер не запущен"
fi
echo ""

# 5. Проверяем переменные окружения backend
echo "5️⃣ Переменные окружения backend:"
if docker ps | grep -q nardist_backend_prod; then
    docker exec nardist_backend_prod env | grep -E "(DATABASE_URL|REDIS_URL)" || echo "⚠️  Переменные не найдены"
else
    echo "⚠️  Backend контейнер не запущен"
fi
echo ""

# 6. Проверяем статус всех контейнеров
echo "6️⃣ Статус всех контейнеров:"
docker compose -f docker-compose.prod.yml ps
echo ""

echo "✅ Проверка завершена!"
