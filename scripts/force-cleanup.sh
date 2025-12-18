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
    FINAL_CONTAINER_NAMES=$(sudo docker ps -a --filter "name=nardist_" --format "{{.Names}}" 2>/dev/null || echo "")
    
    echo "Контейнеры для принудительного удаления:"
    echo "$FINAL_CONTAINER_NAMES"
    
    # Останавливаем все контейнеры перед остановкой Docker
    echo "🛑 Остановка всех контейнеров перед остановкой Docker daemon..."
    echo "$FINAL_CONTAINER_IDS" | while read -r id; do
        if [ -n "$id" ]; then
            echo "  Остановка контейнера: ${id:0:12}"
            sudo docker stop "$id" 2>/dev/null || true
            sudo docker kill "$id" 2>/dev/null || true
            sudo docker rm -f "$id" 2>/dev/null || true
        fi
    done || true
    
    sleep 2
    
    # Останавливаем Docker daemon (без убийства процессов, чтобы не повредить daemon)
    echo "🛑 Остановка Docker daemon..."
    sudo systemctl stop docker 2>/dev/null || true
    sleep 3
    
    # Если Docker не остановился, пробуем мягко завершить процессы
    if sudo systemctl is-active --quiet docker 2>/dev/null; then
        echo "⚠️  Docker daemon все еще активен, пробуем мягко завершить..."
        sudo pkill -TERM dockerd 2>/dev/null || true
        sleep 3
        sudo systemctl stop docker 2>/dev/null || true
    fi
    
    # Останавливаем containerd только если он запущен
    if sudo systemctl is-active --quiet containerd 2>/dev/null; then
        sudo systemctl stop containerd 2>/dev/null || true
    fi
    
    # Очищаем возможные блокировки сокета Docker
    for sock in /var/run/docker.sock /run/docker.sock; do
        if [ -S "$sock" ]; then
            echo "🧹 Очистка сокета Docker: $sock..."
            sudo rm -f "$sock" 2>/dev/null || true
        fi
    done
    
    sleep 2
    
    # Удаляем контейнеры из файловой системы
    if [ -d "/var/lib/docker/containers" ]; then
        echo "🧹 Удаление контейнеров из файловой системы..."
        
        # Удаляем по сохраненным ID
        if [ -n "$FINAL_CONTAINER_IDS" ]; then
            echo "$FINAL_CONTAINER_IDS" | while read -r id; do
                if [ -n "$id" ] && [ -d "/var/lib/docker/containers/$id" ]; then
                    echo "  Удаление: ${id:0:12}"
                    # Пробуем удалить с разными методами
                    sudo rm -rf "/var/lib/docker/containers/$id" 2>/dev/null || \
                    sudo chmod -R 777 "/var/lib/docker/containers/$id" 2>/dev/null && \
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
                        sudo chmod -R 777 "$dir" 2>/dev/null || true
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
    # Сначала запускаем containerd если он нужен
    if command -v containerd &> /dev/null; then
        sudo systemctl start containerd 2>/dev/null || true
        sleep 2
    fi
    
    # Запускаем Docker daemon
    sudo systemctl start docker 2>/dev/null || true
    sleep 5
    
    # Проверяем что Docker запустился
    MAX_START_RETRIES=5
    START_RETRY=0
    while [ $START_RETRY -lt $MAX_START_RETRIES ]; do
        if sudo docker info &>/dev/null; then
            echo "✅ Docker daemon запущен"
            break
        else
            START_RETRY=$((START_RETRY + 1))
            echo "  ⚠️  Ожидание запуска Docker... ($START_RETRY/$MAX_START_RETRIES)"
            sleep 2
            # Пробуем запустить еще раз
            sudo systemctl start docker 2>/dev/null || true
        fi
    done
    
    # Пробуем удалить контейнеры еще раз после перезапуска
    if sudo docker info &>/dev/null; then
        REMAINING_AFTER_RESTART=$(sudo docker ps -a --filter "name=nardist_" --format "{{.ID}}" 2>/dev/null || echo "")
        if [ -n "$REMAINING_AFTER_RESTART" ]; then
            echo "🔄 Повторная попытка удаления контейнеров после перезапуска Docker..."
            echo "$REMAINING_AFTER_RESTART" | while read -r id; do
                if [ -n "$id" ]; then
                    echo "  Удаление контейнера: ${id:0:12}"
                    sudo docker rm -f "$id" 2>/dev/null || true
                fi
            done || true
            sleep 2
        fi
    fi
    
    # Проверяем что контейнеры удалены после перезапуска
    REMAINING_AFTER_RESTART=$(sudo docker ps -a --filter "name=nardist_" --format "{{.Names}}" 2>/dev/null | wc -l || echo "0")
    if [ "$REMAINING_AFTER_RESTART" -gt "0" ]; then
        echo "⚠️  После перезапуска Docker осталось $REMAINING_AFTER_RESTART контейнеров"
        echo "   Они будут удалены при следующем запуске docker-compose down"
    fi
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

# Перезапускаем Docker daemon для применения настроек iptables-legacy
echo "🔄 Перезапуск Docker daemon для применения настроек iptables-legacy..."
sudo systemctl stop docker 2>/dev/null || true
sleep 2

# Очищаем возможные блокировки перед запуском
for sock in /var/run/docker.sock /run/docker.sock; do
    if [ -S "$sock" ]; then
        sudo rm -f "$sock" 2>/dev/null || true
    fi
done

sudo systemctl start docker 2>/dev/null || true
sleep 10

# Проверяем что Docker запустился
if ! sudo systemctl is-active --quiet docker 2>/dev/null; then
    echo "⚠️  Docker daemon не запустился после перезапуска, проверяем статус..."
    sudo systemctl status docker --no-pager -l | head -20 || true
    echo "   Пробуем запустить еще раз..."
    sudo systemctl start docker 2>/dev/null || true
    sleep 5
fi

# Ждем готовности API
for i in {1..5}; do
    if timeout 2 sudo docker info &>/dev/null 2>&1; then
        break
    fi
    sleep 2
done

# Проверяем что Docker использует правильный интерфейс iptables
echo "🔍 Проверка используемого интерфейса iptables..."
if command -v iptables &> /dev/null; then
    IPTABLES_VERSION=$(sudo iptables --version 2>&1)
    echo "  Версия iptables: $IPTABLES_VERSION"
fi

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
# Docker использует nf_tables, поэтому создаем цепочки через nft напрямую
if command -v nft &> /dev/null; then
    echo "  Создание цепочек через nft (Docker использует nf_tables)..."
    # Убеждаемся что таблица filter существует
    sudo nft list table ip filter &>/dev/null || sudo nft create table ip filter 2>/dev/null || true
    
    # Создаем цепочки через nft (обычные цепочки, не hook)
    sudo nft list chain ip filter DOCKER-ISOLATION-STAGE-2 &>/dev/null || \
        sudo nft add chain ip filter DOCKER-ISOLATION-STAGE-2 2>/dev/null || true
    
    sudo nft list chain ip filter DOCKER-ISOLATION-STAGE-1 &>/dev/null || \
        sudo nft add chain ip filter DOCKER-ISOLATION-STAGE-1 2>/dev/null || true
    
    # Добавляем правило для связи цепочек в цепочке FORWARD
    sudo nft list chain ip filter FORWARD &>/dev/null || \
        sudo nft add chain ip filter FORWARD '{ type filter hook forward priority 0; policy accept; }' 2>/dev/null || true
    
    # Добавляем правило в FORWARD для перехода в DOCKER-ISOLATION-STAGE-1
    sudo nft list chain ip filter FORWARD 2>/dev/null | grep -q "jump DOCKER-ISOLATION-STAGE-1" || \
        sudo nft insert rule ip filter FORWARD jump DOCKER-ISOLATION-STAGE-1 2>/dev/null || true
elif command -v iptables &> /dev/null; then
    # Fallback на iptables если nft недоступен
    echo "  Создание цепочек через iptables..."
    if command -v iptables-legacy &> /dev/null; then
        if ! sudo iptables-legacy -t filter -L DOCKER-ISOLATION-STAGE-2 &>/dev/null; then
            echo "    Создание цепочки DOCKER-ISOLATION-STAGE-2 через iptables-legacy..."
            sudo iptables-legacy -t filter -N DOCKER-ISOLATION-STAGE-2 2>/dev/null || true
            sudo iptables-legacy -t filter -A DOCKER-ISOLATION-STAGE-2 -j RETURN 2>/dev/null || true
        fi
        
        if ! sudo iptables-legacy -t filter -L DOCKER-ISOLATION-STAGE-1 &>/dev/null; then
            echo "    Создание цепочки DOCKER-ISOLATION-STAGE-1 через iptables-legacy..."
            sudo iptables-legacy -t filter -N DOCKER-ISOLATION-STAGE-1 2>/dev/null || true
            sudo iptables-legacy -t filter -A DOCKER-ISOLATION-STAGE-1 -j RETURN 2>/dev/null || true
        fi
        
        # Добавляем правило в FORWARD для связи цепочек
        if ! sudo iptables-legacy -t filter -C FORWARD -j DOCKER-ISOLATION-STAGE-1 &>/dev/null; then
            echo "    Добавление правила в FORWARD через iptables-legacy..."
            sudo iptables-legacy -t filter -I FORWARD -j DOCKER-ISOLATION-STAGE-1 2>/dev/null || true
        fi
    else
        if ! sudo iptables -t filter -L DOCKER-ISOLATION-STAGE-2 &>/dev/null; then
            echo "    Создание цепочки DOCKER-ISOLATION-STAGE-2..."
            sudo iptables -t filter -N DOCKER-ISOLATION-STAGE-2 2>/dev/null || true
            sudo iptables -t filter -A DOCKER-ISOLATION-STAGE-2 -j RETURN 2>/dev/null || true
        fi
        
        if ! sudo iptables -t filter -L DOCKER-ISOLATION-STAGE-1 &>/dev/null; then
            echo "    Создание цепочки DOCKER-ISOLATION-STAGE-1..."
            sudo iptables -t filter -N DOCKER-ISOLATION-STAGE-1 2>/dev/null || true
            sudo iptables -t filter -A DOCKER-ISOLATION-STAGE-1 -j RETURN 2>/dev/null || true
        fi
        
        # Добавляем правило в FORWARD для связи цепочек
        if ! sudo iptables -t filter -C FORWARD -j DOCKER-ISOLATION-STAGE-1 &>/dev/null; then
            echo "    Добавление правила в FORWARD..."
            sudo iptables -t filter -I FORWARD -j DOCKER-ISOLATION-STAGE-1 2>/dev/null || true
        fi
    fi
fi

sleep 2

# Шаг 8: Проверяем и создаем необходимые директории
echo "🔧 Проверка необходимых директорий..."

# Проверяем монтирование файловой системы и перемонтируем как read-write если нужно
MOUNT_INFO=$(df /opt/Nardist 2>/dev/null | tail -1)
if [ -n "$MOUNT_INFO" ]; then
    MOUNT_POINT=$(echo "$MOUNT_INFO" | awk '{print $1}')
    if mount | grep -q "$MOUNT_POINT.*ro,"; then
        echo "⚠️  Файловая система смонтирована как read-only, перемонтируем как read-write..."
        # Пробуем перемонтировать /opt или корневую файловую систему
        sudo mount -o remount,rw /opt 2>/dev/null || \
        sudo mount -o remount,rw / 2>/dev/null || \
        sudo mount -o remount,rw "$MOUNT_POINT" 2>/dev/null || true
        sleep 1
    fi
fi

# Проверяем что директория проекта доступна для записи
if [ ! -w "/opt/Nardist" ]; then
    echo "⚠️  Директория /opt/Nardist недоступна для записи, проверяем права..."
    sudo chmod -R u+w /opt/Nardist 2>/dev/null || true
    CURRENT_USER=$(whoami)
    sudo chown -R "$CURRENT_USER:$CURRENT_USER" /opt/Nardist 2>/dev/null || true
fi

# Создаем необходимые директории если их нет
REQUIRED_DIRS=(
    "nginx/conf.d"
    "nginx"
)

for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "/opt/Nardist/$dir" ]; then
        echo "  Создание директории: $dir"
        sudo mkdir -p "/opt/Nardist/$dir" 2>/dev/null || true
        if [ -d "/opt/Nardist/$dir" ]; then
            sudo chmod 755 "/opt/Nardist/$dir" 2>/dev/null || true
            CURRENT_USER=$(whoami)
            sudo chown -R "$CURRENT_USER:$CURRENT_USER" "/opt/Nardist/$dir" 2>/dev/null || true
        fi
    fi
done

# Проверяем что директории существуют и доступны для чтения
if [ ! -d "/opt/Nardist/nginx/conf.d" ]; then
    echo "❌ Не удалось создать директорию nginx/conf.d"
    echo "   Проверьте права доступа к /opt/Nardist"
    echo "   Попробуйте выполнить: sudo mount -o remount,rw /opt"
    echo "   Или: sudo mount -o remount,rw /"
    # Не выходим с ошибкой, продолжаем - docker-compose может создать директорию сам
fi

# Шаг 9: Проверяем статус Docker daemon и запускаем контейнеры
echo "🔍 Проверка статуса Docker daemon..."

# Сначала проверяем через systemctl (более надежно)
if ! sudo systemctl is-active --quiet docker 2>/dev/null; then
    echo "⚠️  Docker daemon не запущен, запускаем..."
    sudo systemctl start containerd 2>/dev/null || true
    sleep 2
    sudo systemctl start docker 2>/dev/null || true
    sleep 5
fi

# Ждем пока Docker полностью инициализируется
MAX_DOCKER_RETRIES=15
DOCKER_RETRY=0
DOCKER_READY=0

while [ $DOCKER_RETRY -lt $MAX_DOCKER_RETRIES ]; do
    # Проверяем через systemctl
    if sudo systemctl is-active --quiet docker 2>/dev/null; then
        # Проверяем доступность API (с таймаутом)
        if timeout 2 sudo docker info &>/dev/null 2>&1; then
            echo "✅ Docker daemon запущен и доступен"
            DOCKER_READY=1
            break
        else
            # Docker запущен, но API еще не готов
            DOCKER_RETRY=$((DOCKER_RETRY + 1))
            echo "  ⚠️  Docker запущен, но API еще не готов (попытка $DOCKER_RETRY из $MAX_DOCKER_RETRIES)..."
            sleep 2
        fi
    else
        # Docker не запущен
        DOCKER_RETRY=$((DOCKER_RETRY + 1))
        echo "  ⚠️  Попытка запуска $DOCKER_RETRY из $MAX_DOCKER_RETRIES..."
        sudo systemctl start containerd 2>/dev/null || true
        sleep 1
        sudo systemctl start docker 2>/dev/null || true
        sleep 3
    fi
done

if [ $DOCKER_READY -eq 0 ]; then
    echo "⚠️  Docker daemon может быть не полностью готов, но продолжаем..."
    echo "   Статус systemd:"
    sudo systemctl is-active docker 2>/dev/null && echo "   ✅ Docker service активен" || echo "   ❌ Docker service не активен"
    
    # Проверяем сокет
    for sock in /var/run/docker.sock /run/docker.sock; do
        if [ -S "$sock" ]; then
            echo "   ✅ Сокет найден: $sock"
            ls -la "$sock" 2>/dev/null | head -1 || true
        fi
    done
fi

echo "🚀 Запуск контейнеров через docker-compose..."

# Сначала пробуем удалить оставшиеся контейнеры через docker-compose down
echo "🛑 Финальная очистка через docker-compose down..."
sudo $DOCKER_COMPOSE -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true

# Принудительно удаляем оставшиеся контейнеры по именам
REMAINING_BEFORE_START=$(sudo docker ps -a --filter "name=nardist_" --format "{{.ID}}" 2>/dev/null || echo "")
if [ -n "$REMAINING_BEFORE_START" ]; then
    echo "🔪 Принудительное удаление оставшихся контейнеров..."
    echo "$REMAINING_BEFORE_START" | while read -r id; do
        if [ -n "$id" ]; then
            echo "  Принудительное удаление: ${id:0:12}"
            sudo docker stop "$id" 2>/dev/null || true
            sudo docker kill "$id" 2>/dev/null || true
            sudo docker rm -f "$id" 2>/dev/null || true
        fi
    done || true
    sleep 2
fi

# Запускаем контейнеры
sudo $DOCKER_COMPOSE -f docker-compose.prod.yml up -d --force-recreate --remove-orphans

# Шаг 10: Ждем и проверяем статус
echo "⏳ Ожидание запуска сервисов..."
sleep 10

echo "📊 Статус контейнеров:"
sudo $DOCKER_COMPOSE -f docker-compose.prod.yml ps

echo ""
echo "✅ Готово!"
