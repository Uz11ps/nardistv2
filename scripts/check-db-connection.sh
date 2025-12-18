#!/bin/bash

set -e

echo "🔍 Проверка подключения к базе данных..."

# Определяем команду docker compose
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "❌ Error: docker compose or docker-compose not found!"
    exit 1
fi

cd /opt/Nardist || exit 1

# Проверяем статус контейнеров
echo "📊 Статус контейнеров:"
$DOCKER_COMPOSE -f docker-compose.prod.yml ps

echo ""
echo "🔍 Проверка postgres контейнера..."
if $DOCKER_COMPOSE -f docker-compose.prod.yml ps postgres | grep -q "Up"; then
    echo "✅ Postgres контейнер запущен"
    
    # Проверяем healthcheck
    echo "🏥 Проверка healthcheck postgres..."
    $DOCKER_COMPOSE -f docker-compose.prod.yml exec postgres pg_isready -U nardist || echo "⚠️  Postgres еще не готов"
    
    # Проверяем подключение из backend контейнера
    echo "🔗 Проверка подключения из backend контейнера..."
    $DOCKER_COMPOSE -f docker-compose.prod.yml exec backend sh -c "nc -zv postgres 5432" 2>&1 || echo "⚠️  Не удалось подключиться к postgres:5432"
    
    # Проверяем переменные окружения
    echo "📝 Переменные окружения DATABASE_URL:"
    $DOCKER_COMPOSE -f docker-compose.prod.yml exec backend env | grep DATABASE_URL || echo "⚠️  DATABASE_URL не найдена"
    
    # Проверяем сеть Docker
    echo "🌐 Проверка Docker сети..."
    docker network inspect nardist_network | grep -A 5 "Containers" || echo "⚠️  Сеть не найдена"
else
    echo "❌ Postgres контейнер не запущен!"
    echo "🚀 Запускаем контейнеры..."
    $DOCKER_COMPOSE -f docker-compose.prod.yml up -d postgres
    echo "⏳ Ожидание готовности postgres (30 секунд)..."
    sleep 30
fi

echo ""
echo "✅ Проверка завершена"
