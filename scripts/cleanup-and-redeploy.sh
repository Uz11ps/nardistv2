#!/bin/bash

# Полная очистка сервера и новый деплой
# Использование: ./cleanup-and-redeploy.sh

set -e

echo "🚀 Полная очистка и новый деплой проекта"
echo ""

# Выполняем очистку
bash /opt/Nardist/scripts/full-server-cleanup.sh

echo ""
echo "📥 Обновляем проект из Git..."
cd /opt/Nardist
git pull origin main

echo ""
echo "📦 Устанавливаем зависимости backend..."
cd /opt/Nardist/backend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

echo ""
echo "🏗️ Собираем Docker образы..."
cd /opt/Nardist
docker compose -f docker-compose.prod.yml build --no-cache backend

echo ""
echo "🚀 Запускаем контейнеры..."
docker compose -f docker-compose.prod.yml up -d

echo ""
echo "📊 Проверяем статус..."
docker compose -f docker-compose.prod.yml ps

echo ""
echo "📝 Логи backend (последние 50 строк):"
docker compose -f docker-compose.prod.yml logs --tail=50 backend

echo ""
echo "✅ Деплой завершен!"
