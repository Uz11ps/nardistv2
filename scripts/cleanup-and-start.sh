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

# Шаг 2: Принудительно убиваем все контейнеры nardist_*
echo "🔍 Принудительная остановка всех контейнеров nardist_*..."
sudo docker ps -a --filter "name=nardist_" --format "{{.ID}}" 2>/dev/null | while read -r id; do
    if [ -n "$id" ]; then
        echo "  Kill контейнера: $id"
        sudo docker kill "$id" 2>/dev/null || true
    fi
done || true

sleep 2

# Шаг 3: Удаляем все контейнеры nardist_* принудительно
echo "🧹 Принудительное удаление всех контейнеров nardist_*..."
sudo docker ps -a --filter "name=nardist_" --format "{{.ID}}" 2>/dev/null | while read -r id; do
    if [ -n "$id" ]; then
        echo "  Удаление контейнера: $id"
        sudo docker rm -f "$id" 2>/dev/null || true
    fi
done || true

# Шаг 4: Если контейнеры все еще не удаляются, останавливаем Docker daemon
REMAINING=$(sudo docker ps -a --filter "name=nardist_" --format "{{.Names}}" 2>/dev/null | wc -l || echo "0")
if [ "$REMAINING" -gt 0 ]; then
    echo "⚠️  Осталось $REMAINING контейнеров, останавливаем Docker daemon для принудительной очистки..."
    
    # Сохраняем список ID контейнеров ДО остановки Docker
    echo "📋 Сохранение списка контейнеров для удаления..."
    CONTAINER_IDS=$(sudo docker ps -a --filter "name=nardist_" --format "{{.ID}}" 2>/dev/null || echo "")
    CONTAINER_NAMES=$(sudo docker ps -a --filter "name=nardist_" --format "{{.Names}}" 2>/dev/null || echo "")
    
    echo "Контейнеры для удаления:"
    echo "$CONTAINER_NAMES"
    
    sudo systemctl stop docker 2>/dev/null || true
    sleep 5
    
    # Удаляем контейнеры напрямую из файловой системы Docker
    if [ -d "/var/lib/docker/containers" ]; then
        echo "🧹 Удаление контейнеров из файловой системы..."
        if [ -n "$CONTAINER_IDS" ]; then
            echo "$CONTAINER_IDS" | while read -r id; do
                if [ -n "$id" ] && [ -d "/var/lib/docker/containers/$id" ]; then
                    echo "  Удаление директории контейнера: $id"
                    sudo rm -rf "/var/lib/docker/containers/$id" 2>/dev/null || true
                fi
            done || true
        fi
        
        # Удаляем все контейнеры nardist_* из файловой системы (на случай если ID не совпадают)
        echo "🧹 Поиск и удаление всех контейнеров nardist_*..."
        sudo find /var/lib/docker/containers -maxdepth 1 -type d 2>/dev/null | while read -r dir; do
            if [ -n "$dir" ] && [ "$dir" != "/var/lib/docker/containers" ]; then
                CONTAINER_ID=$(basename "$dir")
                # Проверяем метаданные контейнера на наличие имени nardist_
                if [ -f "$dir/config.v2.json" ]; then
                    if sudo grep -q "nardist_" "$dir/config.v2.json" 2>/dev/null; then
                        echo "  Удаление контейнера nardist_*: $CONTAINER_ID"
                        sudo rm -rf "$dir" 2>/dev/null || true
                    fi
                fi
            fi
        done || true
    fi
    
    echo "🚀 Запуск Docker daemon..."
    sudo systemctl start docker
    sleep 10
fi

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
