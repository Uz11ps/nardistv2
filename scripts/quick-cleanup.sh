#!/bin/bash

# Быстрая очистка и запуск
cd /opt/Nardist || exit 1

echo "🛑 Остановка всех контейнеров..."
sudo docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

echo "🧹 Удаление всех контейнеров nardist_*..."
sudo docker ps -a --filter "name=nardist_" --format "{{.ID}}" | xargs -r sudo docker rm -f 2>/dev/null || true

echo "🚀 Запуск контейнеров..."
sudo docker compose -f docker-compose.prod.yml up -d --force-recreate --remove-orphans

echo "⏳ Ожидание 10 секунд..."
sleep 10

echo "📊 Статус:"
sudo docker compose -f docker-compose.prod.yml ps
