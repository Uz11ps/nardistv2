#!/bin/bash

# Скрипт для полной очистки сервера перед новым деплоем
# ВНИМАНИЕ: Этот скрипт удаляет все Docker контейнеры, образы, volumes и данные проекта

set -e

echo "🧹 Начинаем полную очистку сервера..."
echo "⚠️  ВНИМАНИЕ: Это удалит все контейнеры, образы и данные!"
echo ""

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Функция для вывода сообщений
info() {
    echo -e "${GREEN}✓${NC} $1"
}

warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

error() {
    echo -e "${RED}✗${NC} $1"
}

# Переходим в директорию проекта
cd /opt/Nardist || {
    error "Директория /opt/Nardist не найдена!"
    exit 1
}

info "Текущая директория: $(pwd)"

# 1. Останавливаем все контейнеры
echo ""
info "Останавливаем все Docker контейнеры..."
docker compose -f docker-compose.prod.yml down 2>/dev/null || true
docker stop $(docker ps -aq) 2>/dev/null || true
docker stop $(docker ps -q) 2>/dev/null || true

# 2. Удаляем все контейнеры
echo ""
info "Удаляем все Docker контейнеры..."
docker rm -f $(docker ps -aq) 2>/dev/null || true

# 3. Удаляем все образы проекта
echo ""
info "Удаляем Docker образы проекта..."
docker images | grep -E "nardist|backend|frontend" | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true

# 4. Удаляем все неиспользуемые образы
echo ""
info "Очищаем неиспользуемые Docker образы..."
docker image prune -af --filter "until=24h" 2>/dev/null || true

# 5. Удаляем все volumes (опционально, закомментировано для безопасности)
# echo ""
# warn "Удаляем все Docker volumes..."
# docker volume prune -af 2>/dev/null || true

# 6. Очищаем сеть Docker
echo ""
info "Очищаем Docker сети..."
docker network prune -f 2>/dev/null || true

# 7. Очищаем build cache
echo ""
info "Очищаем Docker build cache..."
docker builder prune -af 2>/dev/null || true

# 8. Удаляем node_modules из корня и backend
echo ""
info "Удаляем node_modules..."
rm -rf /opt/Nardist/node_modules 2>/dev/null || true
rm -rf /opt/Nardist/backend/node_modules 2>/dev/null || true
rm -rf /opt/Nardist/frontend/node_modules 2>/dev/null || true

# 9. Удаляем package-lock.json
echo ""
info "Удаляем package-lock.json файлы..."
rm -f /opt/Nardist/package-lock.json 2>/dev/null || true
rm -f /opt/Nardist/backend/package-lock.json 2>/dev/null || true
rm -f /opt/Nardist/frontend/package-lock.json 2>/dev/null || true

# 10. Удаляем dist директории
echo ""
info "Удаляем директории сборки..."
rm -rf /opt/Nardist/backend/dist 2>/dev/null || true
rm -f /opt/Nardist/frontend/dist 2>/dev/null || true

# 11. Очищаем логи Docker
echo ""
info "Очищаем Docker логи..."
docker system prune -af --volumes 2>/dev/null || true

# 12. Проверяем статус
echo ""
info "Проверяем статус Docker..."
echo "Контейнеры:"
docker ps -a | head -5 || echo "Нет контейнеров"
echo ""
echo "Образы:"
docker images | head -5 || echo "Нет образов"
echo ""

# 13. Очищаем старые файлы проекта (опционально)
# Если нужно полностью переустановить проект из Git, раскомментируйте:
# echo ""
# warn "Удаляем старые файлы проекта (кроме .env)..."
# find /opt/Nardist -type f ! -name ".env*" ! -name ".git*" -delete 2>/dev/null || true
# find /opt/Nardist -type d -empty -delete 2>/dev/null || true

echo ""
info "✅ Полная очистка сервера завершена!"
echo ""
echo "Следующие шаги:"
echo "1. git pull origin main"
echo "2. cd backend && npm install --legacy-peer-deps"
echo "3. docker compose -f docker-compose.prod.yml build --no-cache"
echo "4. docker compose -f docker-compose.prod.yml up -d"
