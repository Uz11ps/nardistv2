#!/bin/bash

set -e

echo "🧹 Принудительная очистка всех контейнеров nardist_*..."

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

# Функция для принудительной остановки контейнера
force_stop_container() {
    local id=$1
    if [ -z "$id" ]; then
        return 1
    fi
    
    # Пробуем остановить с таймаутом
    timeout 5 sudo docker stop "$id" 2>/dev/null || true
    
    # Принудительно убиваем
    sudo docker kill "$id" 2>/dev/null || true
    
    # Удаляем
    sudo docker rm -f "$id" 2>/dev/null || true
    
    return 0
}

# Шаг 1: Останавливаем все контейнеры через docker-compose
echo "🛑 Остановка всех контейнеров через docker-compose..."
sudo $DOCKER_COMPOSE -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

sleep 2

# Шаг 2: Сохраняем список контейнеров ДО агрессивной очистки
echo "📋 Сохранение списка контейнеров..."
CONTAINER_IDS=$(sudo docker ps -a --no-trunc --filter "name=nardist_" --format "{{.ID}}" 2>/dev/null || echo "")
CONTAINER_NAMES=$(sudo docker ps -a --filter "name=nardist_" --format "{{.Names}}" 2>/dev/null || echo "")

if [ -n "$CONTAINER_NAMES" ]; then
    echo "Контейнеры для удаления:"
    echo "$CONTAINER_NAMES"
fi

# Шаг 3: Агрессивная остановка и удаление контейнеров
echo "🔪 Принудительная остановка всех контейнеров nardist_*..."
if [ -n "$CONTAINER_IDS" ]; then
    echo "$CONTAINER_IDS" | while read -r id; do
        if [ -n "$id" ]; then
            echo "  Обработка контейнера: ${id:0:12}..."
            force_stop_container "$id"
        fi
    done || true
fi

sleep 3

# Шаг 4: Повторная попытка удаления оставшихся контейнеров
REMAINING_IDS=$(sudo docker ps -a --no-trunc --filter "name=nardist_" --format "{{.ID}}" 2>/dev/null || echo "")
if [ -n "$REMAINING_IDS" ]; then
    echo "🔄 Повторная попытка удаления оставшихся контейнеров..."
    echo "$REMAINING_IDS" | while read -r id; do
        if [ -n "$id" ]; then
            echo "  Принудительное удаление: ${id:0:12}..."
            force_stop_container "$id"
        fi
    done || true
fi

sleep 2

# Шаг 5: Если контейнеры все еще остались, останавливаем Docker daemon
REMAINING_COUNT=$(sudo docker ps -a --filter "name=nardist_" --format "{{.Names}}" 2>/dev/null | wc -l || echo "0")
if [ "$REMAINING_COUNT" -gt "0" ]; then
    echo "⚠️  Осталось $REMAINING_COUNT контейнеров, останавливаем Docker daemon для принудительной очистки..."
    
    # Сохраняем полные ID контейнеров перед остановкой Docker
    FINAL_CONTAINER_IDS=$(sudo docker ps -a --no-trunc --filter "name=nardist_" --format "{{.ID}}" 2>/dev/null || echo "")
    
    # Останавливаем Docker daemon
    echo "🛑 Остановка Docker daemon..."
    sudo systemctl stop docker 2>/dev/null || true
    sleep 5
    
    # Удаляем контейнеры из файловой системы
    if [ -d "/var/lib/docker/containers" ]; then
        echo "🧹 Удаление контейнеров из файловой системы..."
        
        # Удаляем по сохраненным ID
        if [ -n "$FINAL_CONTAINER_IDS" ]; then
            echo "$FINAL_CONTAINER_IDS" | while read -r id; do
                if [ -n "$id" ] && [ -d "/var/lib/docker/containers/$id" ]; then
                    echo "  Удаление: ${id:0:12}"
                    sudo rm -rf "/var/lib/docker/containers/$id" 2>/dev/null || true
                fi
            done || true
        fi
        
        # Удаляем все контейнеры nardist_* по метаданным
        echo "🔍 Поиск контейнеров nardist_* в метаданных..."
        sudo find /var/lib/docker/containers -maxdepth 1 -type d 2>/dev/null | while read -r dir; do
            if [ -n "$dir" ] && [ "$dir" != "/var/lib/docker/containers" ]; then
                CONTAINER_ID=$(basename "$dir")
                if [ -f "$dir/config.v2.json" ]; then
                    if sudo grep -q "nardist_" "$dir/config.v2.json" 2>/dev/null; then
                        echo "  Удаление контейнера nardist_*: ${CONTAINER_ID:0:12}"
                        sudo rm -rf "$dir" 2>/dev/null || true
                    fi
                fi
            fi
        done || true
    fi
    
    # Очищаем сетевые endpoints
    if [ -d "/var/lib/docker/network" ]; then
        echo "🧹 Очистка сетевых endpoints..."
        sudo find /var/lib/docker/network -name "*nardist*" -type f 2>/dev/null | while read -r file; do
            echo "  Удаление сетевого файла: $file"
            sudo rm -f "$file" 2>/dev/null || true
        done || true
    fi
    
    # Запускаем Docker daemon
    echo "🚀 Запуск Docker daemon..."
    sudo systemctl start docker
    sleep 10
fi

# Шаг 6: Финальная проверка и удаление оставшихся контейнеров
REMAINING_FINAL=$(sudo docker ps -a --filter "name=nardist_" --format "{{.Names}}" 2>/dev/null | wc -l || echo "0")
if [ "$REMAINING_FINAL" -eq "0" ]; then
    echo "✅ Все контейнеры успешно удалены"
else
    echo "⚠️  Осталось $REMAINING_FINAL контейнеров:"
    sudo docker ps -a --filter "name=nardist_" --format "{{.Names}}"
    
    # Последняя попытка удаления через docker rm
    echo "🔄 Финальная попытка удаления..."
    sudo docker ps -a --no-trunc --filter "name=nardist_" --format "{{.ID}}" | while read -r id; do
        if [ -n "$id" ]; then
            echo "  Финальное удаление: ${id:0:12}"
            force_stop_container "$id"
        fi
    done || true
fi

# Шаг 7: Очистка сетей Docker и восстановление iptables правил
echo "🧹 Очистка неиспользуемых сетей Docker..."
sudo docker network prune -f 2>/dev/null || true

# Удаляем сети nardist_* если они остались
echo "🔍 Поиск и удаление сетей nardist_*..."
sudo docker network ls --filter "name=nardist_" --format "{{.ID}}" 2>/dev/null | while read -r net_id; do
    if [ -n "$net_id" ]; then
        echo "  Удаление сети: $net_id"
        sudo docker network rm "$net_id" 2>/dev/null || true
    fi
done || true

# Останавливаем Docker daemon для полной очистки iptables
echo "🛑 Остановка Docker daemon для очистки iptables правил..."
sudo systemctl stop docker 2>/dev/null || true
sleep 3

# Очищаем правила iptables Docker
echo "🧹 Очистка правил iptables Docker..."
if command -v iptables &> /dev/null; then
    # Удаляем все правила из цепочек Docker
    sudo iptables -t filter -F DOCKER-ISOLATION-STAGE-1 2>/dev/null || true
    sudo iptables -t filter -F DOCKER-ISOLATION-STAGE-2 2>/dev/null || true
    sudo iptables -t filter -F DOCKER 2>/dev/null || true
    sudo iptables -t nat -F DOCKER 2>/dev/null || true
    
    # Удаляем цепочки Docker если они существуют
    sudo iptables -t filter -X DOCKER-ISOLATION-STAGE-1 2>/dev/null || true
    sudo iptables -t filter -X DOCKER-ISOLATION-STAGE-2 2>/dev/null || true
    sudo iptables -t filter -X DOCKER 2>/dev/null || true
    sudo iptables -t nat -X DOCKER 2>/dev/null || true
fi

# Удаляем сетевые интерфейсы Docker (br-*)
echo "🧹 Удаление сетевых интерфейсов Docker..."
if command -v ip &> /dev/null; then
    ip link show 2>/dev/null | grep -o 'br-[a-f0-9]*' | while read -r br_name; do
        if [ -n "$br_name" ]; then
            echo "  Удаление интерфейса: $br_name"
            sudo ip link delete "$br_name" 2>/dev/null || true
        fi
    done || true
fi

# Настраиваем Docker daemon на использование iptables-legacy
echo "🔧 Настройка Docker daemon на использование iptables-legacy..."
DOCKER_DAEMON_JSON="/etc/docker/daemon.json"
if [ ! -f "$DOCKER_DAEMON_JSON" ]; then
    echo "  Создание $DOCKER_DAEMON_JSON..."
    sudo mkdir -p /etc/docker
    echo '{"iptables": true}' | sudo tee "$DOCKER_DAEMON_JSON" > /dev/null
fi

# Проверяем и обновляем daemon.json для использования iptables-legacy
if ! sudo grep -q '"iptables":' "$DOCKER_DAEMON_JSON" 2>/dev/null; then
    echo "  Добавление настройки iptables в $DOCKER_DAEMON_JSON..."
    sudo python3 -c "
import json
import sys
try:
    with open('$DOCKER_DAEMON_JSON', 'r') as f:
        config = json.load(f)
except:
    config = {}
config['iptables'] = True
with open('$DOCKER_DAEMON_JSON', 'w') as f:
    json.dump(config, f, indent=2)
" 2>/dev/null || echo '{"iptables": true}' | sudo tee "$DOCKER_DAEMON_JSON" > /dev/null
fi

# Устанавливаем альтернативу iptables на legacy если доступно
if command -v update-alternatives &> /dev/null && command -v iptables-legacy &> /dev/null; then
    echo "  Настройка альтернативы iptables на legacy..."
    sudo update-alternatives --set iptables /usr/sbin/iptables-legacy 2>/dev/null || true
    sudo update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy 2>/dev/null || true
fi

# Перезапускаем Docker daemon для восстановления iptables правил
echo "🔄 Запуск Docker daemon для восстановления iptables правил..."
sudo systemctl start docker 2>/dev/null || true
sleep 10

# Инициализируем Docker сетевые правила через создание и удаление тестовой сети
# Это должно создать все необходимые цепочки iptables
echo "🔧 Инициализация Docker сетевых правил через тестовую сеть..."
MAX_RETRIES=3
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if sudo docker network create --driver bridge test_docker_init_$(date +%s) 2>/dev/null; then
        TEST_NET=$(sudo docker network ls --filter "name=test_docker_init" --format "{{.ID}}" | head -n1)
        if [ -n "$TEST_NET" ]; then
            sudo docker network rm "$TEST_NET" 2>/dev/null || true
        fi
        echo "  ✅ Docker сетевые правила инициализированы"
        break
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        echo "  ⚠️  Попытка $RETRY_COUNT из $MAX_RETRIES..."
        sleep 2
    fi
done

# Проверяем наличие цепочек и создаем их через правильный интерфейс
echo "🔧 Проверка цепочек iptables Docker..."
# Используем iptables напрямую (Docker должен использовать legacy после настройки)
if command -v iptables &> /dev/null; then
    # Проверяем и создаем цепочки через iptables (Docker использует тот же интерфейс)
    if ! sudo iptables -t filter -L DOCKER-ISOLATION-STAGE-2 &>/dev/null; then
        echo "  Создание цепочки DOCKER-ISOLATION-STAGE-2..."
        sudo iptables -t filter -N DOCKER-ISOLATION-STAGE-2 2>/dev/null || true
        sudo iptables -t filter -A DOCKER-ISOLATION-STAGE-2 -j RETURN 2>/dev/null || true
    fi
    
    if ! sudo iptables -t filter -L DOCKER-ISOLATION-STAGE-1 &>/dev/null; then
        echo "  Создание цепочки DOCKER-ISOLATION-STAGE-1..."
        sudo iptables -t filter -N DOCKER-ISOLATION-STAGE-1 2>/dev/null || true
        sudo iptables -t filter -A DOCKER-ISOLATION-STAGE-1 -j RETURN 2>/dev/null || true
    fi
    
    # Добавляем правило в FORWARD для связи цепочек
    if ! sudo iptables -t filter -C FORWARD -j DOCKER-ISOLATION-STAGE-1 &>/dev/null; then
        echo "  Добавление правила в FORWARD..."
        sudo iptables -t filter -I FORWARD -j DOCKER-ISOLATION-STAGE-1 2>/dev/null || true
    fi
fi

sleep 2

# Шаг 8: Запускаем контейнеры
echo "🚀 Запуск контейнеров через docker-compose..."
sudo $DOCKER_COMPOSE -f docker-compose.prod.yml up -d --force-recreate --remove-orphans

# Шаг 9: Ждем и проверяем статус
echo "⏳ Ожидание запуска сервисов..."
sleep 10

echo "📊 Статус контейнеров:"
sudo $DOCKER_COMPOSE -f docker-compose.prod.yml ps

echo ""
echo "✅ Готово!"
