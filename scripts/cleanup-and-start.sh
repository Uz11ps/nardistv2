#!/bin/bash

set -e

echo "🧹 Полная очистка контейнеров и запуск nginx..."

# Определяем команду docker compose
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "❌ Error: docker compose or docker-compose not found!"
    exit 1
fi

# Переходим в директорию проекта
cd "$(dirname "$0")/.." || exit 1

# Шаг 1: Останавливаем все контейнеры через docker-compose
echo "🛑 Остановка всех контейнеров через docker-compose..."
sudo $DOCKER_COMPOSE -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

# Шаг 2: Получаем все контейнеры с префиксом nardist и удаляем их принудительно
echo "🔍 Поиск всех контейнеров nardist_*..."
CONTAINERS=$(sudo docker ps -a --no-trunc --filter "name=nardist_" --format "{{.ID}}" 2>/dev/null || echo "")

if [ -n "$CONTAINERS" ]; then
    echo "$CONTAINERS" | while read -r id; do
        if [ -n "$id" ]; then
            echo "  Удаление контейнера: $id"
            # Принудительная остановка и удаление
            sudo docker kill "$id" 2>/dev/null || true
            sudo docker stop "$id" 2>/dev/null || true
            sudo docker rm -f "$id" 2>/dev/null || true
        fi
    done
fi

# Шаг 3: Удаляем контейнеры по именам (на случай если ID не сработали)
echo "🧹 Принудительное удаление контейнеров по именам..."
for container in nardist_nginx_prod nardist_postgres_prod nardist_redis_prod nardist_backend_prod nardist_frontend_prod nardist_certbot; do
    echo "  Попытка удаления: $container"
    sudo docker kill "$container" 2>/dev/null || true
    sudo docker stop "$container" 2>/dev/null || true
    sudo docker rm -f "$container" 2>/dev/null || true
done

# Шаг 4: Удаляем все контейнеры с _old_ или _backup_ в имени
echo "🧹 Удаление старых контейнеров (_old_, _backup_)..."
sudo docker ps -a --format "{{.ID}}|{{.Names}}" 2>/dev/null | while IFS='|' read -r id name; do
    if [ -n "$id" ] && [ -n "$name" ]; then
        if echo "$name" | grep -qE "(nardist_.*_old_|nardist_.*_backup_)"; then
            echo "  Удаление старого контейнера: $name ($id)"
            sudo docker kill "$id" 2>/dev/null || true
            sudo docker stop "$id" 2>/dev/null || true
            sudo docker rm -f "$id" 2>/dev/null || true
        fi
    fi
done || true

# Шаг 5: Проверяем что порты свободны
echo "🔍 Проверка портов 80 и 443..."
if command -v lsof &> /dev/null; then
    if lsof -i :80 2>/dev/null | grep -v docker; then
        echo "⚠️  Порт 80 занят, освобождаем..."
        lsof -ti :80 | xargs sudo kill -9 2>/dev/null || true
        sleep 2
    fi
    if lsof -i :443 2>/dev/null | grep -v docker; then
        echo "⚠️  Порт 443 занят, освобождаем..."
        lsof -ti :443 | xargs sudo kill -9 2>/dev/null || true
        sleep 2
    fi
fi

# Шаг 6: Проверяем результат
REMAINING=$(sudo docker ps -a --filter "name=nardist_" --format "{{.Names}}" 2>/dev/null | wc -l || echo "0")
if [ "$REMAINING" -eq "0" ]; then
    echo "✅ Все контейнеры успешно удалены"
else
    echo "⚠️  Предупреждение: осталось $REMAINING контейнеров"
    sudo docker ps -a --filter "name=nardist_" --format "{{.Names}}"
fi

# Шаг 7: Запускаем контейнеры через docker-compose
echo "🚀 Запуск контейнеров через docker-compose..."
sudo $DOCKER_COMPOSE -f docker-compose.prod.yml up -d --force-recreate --remove-orphans

# Шаг 8: Ждем немного для запуска
echo "⏳ Ожидание запуска сервисов..."
sleep 10

# Шаг 9: Проверяем статус
echo "📊 Статус контейнеров:"
sudo $DOCKER_COMPOSE -f docker-compose.prod.yml ps

echo ""
echo "✅ Готово! Все контейнеры перезапущены."
echo "📋 Проверка nginx:"
sudo docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep nardist || true
