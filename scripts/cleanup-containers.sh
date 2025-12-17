#!/bin/bash

set -e

echo "🧹 Cleaning up Docker containers..."

# Останавливаем Docker daemon для полной очистки
echo "🛑 Stopping Docker daemon..."
sudo systemctl stop docker 2>/dev/null || true
sleep 3

# Запускаем Docker daemon
echo "🚀 Starting Docker daemon..."
sudo systemctl start docker
sleep 10

# Получаем все контейнеры с префиксом nardist
echo "🔍 Finding all nardist containers..."
CONTAINERS=$(sudo docker ps -a --no-trunc --filter "name=nardist_" --format "{{.ID}}|{{.Names}}" 2>/dev/null || echo "")

# Удаляем все найденные контейнеры
if [ -n "$CONTAINERS" ]; then
  echo "$CONTAINERS" | while IFS='|' read -r id name; do
    if [ -n "$id" ] && [ -n "$name" ]; then
      echo "  Removing: $name ($id)"
      # Используем kill для принудительной остановки
      sudo docker kill $id 2>/dev/null || true
      sudo docker stop $id 2>/dev/null || true
      # Принудительное удаление
      sudo docker rm -f $id 2>/dev/null || true
    fi
  done
fi

# Дополнительная очистка по именам
echo "🧹 Force removing containers by name..."
for container in nardist_nginx_prod nardist_postgres_prod nardist_redis_prod nardist_backend_prod nardist_frontend_prod nardist_certbot; do
  sudo docker kill $container 2>/dev/null || true
  sudo docker stop $container 2>/dev/null || true
  sudo docker rm -f $container 2>/dev/null || true
done

# Удаляем контейнеры со старыми именами
echo "🧹 Removing old containers..."
sudo docker ps -a --filter "name=_old_" --format "{{.ID}}" | while read id; do
  if [ -n "$id" ]; then
    echo "  Removing old container: $id"
    sudo docker kill $id 2>/dev/null || true
    sudo docker rm -f $id 2>/dev/null || true
  fi
done || true

# Проверяем что порты свободны
echo "🔍 Checking ports..."
if lsof -i :80 2>/dev/null | grep -v docker; then
  echo "⚠️  Port 80 is still occupied, killing processes..."
  lsof -ti :80 | xargs sudo kill -9 2>/dev/null || true
fi
if lsof -i :443 2>/dev/null | grep -v docker; then
  echo "⚠️  Port 443 is still occupied, killing processes..."
  lsof -ti :443 | xargs sudo kill -9 2>/dev/null || true
fi

# Проверяем результат
REMAINING=$(sudo docker ps -a --filter "name=nardist_" --format "{{.Names}}" 2>/dev/null | wc -l || echo "0")
if [ "$REMAINING" -eq "0" ]; then
  echo "✅ All containers removed successfully"
else
  echo "⚠️  Warning: $REMAINING containers still exist"
  sudo docker ps -a --filter "name=nardist_" --format "{{.Names}}"
fi

echo "✅ Cleanup completed"

