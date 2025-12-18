#!/bin/bash

set -e

echo "🧹 Полная очистка сервера от проекта Nardist..."
echo "⚠️  ВНИМАНИЕ: Это удалит ВСЕ данные проекта, включая базу данных!"
read -p "Вы уверены? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Очистка отменена"
    exit 1
fi

# Определяем команду docker compose
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
elif command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    echo "❌ Error: docker compose or docker-compose not found!"
    exit 1
fi

# Переходим в директорию проекта если она существует
if [ -d "/opt/Nardist" ]; then
    cd /opt/Nardist
    
    echo "🛑 Остановка всех контейнеров..."
    $DOCKER_COMPOSE -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
    
    echo "🗑️  Удаление контейнеров проекта..."
    docker rm -f nardist_backend_prod nardist_frontend_prod nardist_postgres_prod \
                 nardist_redis_prod nardist_nginx_prod nardist_certbot 2>/dev/null || true
    
    echo "🗄️  Удаление volumes проекта..."
    docker volume rm nardist_postgres_data nardist_redis_data \
                     nardist_certbot_data nardist_certbot_www 2>/dev/null || true
    
    # Удаляем volumes по имени из docker-compose
    docker volume ls | grep -E "nardist.*(postgres_data|redis_data|certbot)" | awk '{print $2}' | \
        xargs -r docker volume rm 2>/dev/null || true
    
    echo "🖼️  Удаление образов проекта..."
    docker rmi nardist-backend:latest nardist-frontend:latest \
               ghcr.io/uz11ps/nardist-backend:latest \
               ghcr.io/uz11ps/nardist-frontend:latest 2>/dev/null || true
    
    # Удаляем все образы связанные с проектом
    docker images | grep -E "nardist|ghcr.io/uz11ps/nardist" | awk '{print $3}' | \
        xargs -r docker rmi -f 2>/dev/null || true
    
    echo "🌐 Удаление сетей проекта..."
    docker network rm nardist_network 2>/dev/null || true
    docker network prune -f 2>/dev/null || true
    
    echo "📁 Сохранение .env файла (если существует)..."
    if [ -f "/opt/Nardist/.env" ]; then
        BACKUP_DIR="/root/nardist-backup-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        cp /opt/Nardist/.env "$BACKUP_DIR/.env" 2>/dev/null || true
        echo "✅ .env сохранен в $BACKUP_DIR/.env"
    fi
    
    echo "🗑️  Удаление директории проекта..."
    cd /
    rm -rf /opt/Nardist
    echo "✅ Директория /opt/Nardist удалена"
else
    echo "⚠️  Директория /opt/Nardist не найдена, очищаем только Docker ресурсы..."
    
    # Удаляем контейнеры по имени
    docker rm -f $(docker ps -a --filter "name=nardist_" --format "{{.Names}}") 2>/dev/null || true
    
    # Удаляем volumes
    docker volume rm $(docker volume ls --filter "name=nardist" --format "{{.Name}}") 2>/dev/null || true
    
    # Удаляем образы
    docker rmi -f $(docker images --filter "reference=*nardist*" --format "{{.ID}}") 2>/dev/null || true
    
    # Удаляем сети
    docker network rm nardist_network 2>/dev/null || true
fi

echo "🧹 Очистка неиспользуемых Docker ресурсов..."
docker system prune -af --volumes 2>/dev/null || true

echo ""
echo "✅ Полная очистка завершена!"
echo ""
echo "📋 Что было удалено:"
echo "   - Все контейнеры проекта (backend, frontend, postgres, redis, nginx, certbot)"
echo "   - Все volumes (база данных, redis, certbot данные)"
echo "   - Все образы проекта"
echo "   - Сети Docker проекта"
echo "   - Директория /opt/Nardist"
echo ""
echo "💡 Для повторной установки:"
echo "   1. Клонируйте репозиторий: git clone https://github.com/Uz11ps/Nardist.git /opt/Nardist"
echo "   2. Создайте .env файл с необходимыми переменными"
echo "   3. Запустите deploy.sh или настройте GitHub Actions"
