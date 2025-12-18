#!/bin/bash

# Скрипт для проверки статуса контейнеров и их логов

set -e

echo "🔍 Проверка статуса контейнеров"
echo ""

cd /opt/Nardist

echo "📊 Статус всех контейнеров:"
docker compose -f docker-compose.prod.yml ps -a

echo ""
echo "📝 Логи PostgreSQL (последние 30 строк):"
docker compose -f docker-compose.prod.yml logs --tail=30 postgres 2>&1 || echo "⚠️  Не удалось получить логи PostgreSQL"

echo ""
echo "📝 Логи Redis (последние 30 строк):"
docker compose -f docker-compose.prod.yml logs --tail=30 redis 2>&1 || echo "⚠️  Не удалось получить логи Redis"

echo ""
echo "📝 Логи Backend (последние 30 строк):"
docker compose -f docker-compose.prod.yml logs --tail=30 backend 2>&1 || echo "⚠️  Не удалось получить логи Backend"

echo ""
echo "🔍 Проверка образов:"
docker images | grep -E "(nardist|postgres|redis)" || echo "⚠️  Образы не найдены"

echo ""
echo "🌐 Проверка сети:"
docker network inspect nardist_network 2>/dev/null | grep -A 10 "Containers" || echo "⚠️  Сеть не найдена или пуста"
