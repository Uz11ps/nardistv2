#!/bin/bash

# ПОЛНАЯ ОЧИСТКА СЕРВЕРА ПОД НОЛЬ
# ВНИМАНИЕ: Этот скрипт удалит ВСЕ данные Docker и проекта!

set -e

echo "⚠️  ВНИМАНИЕ: Полная очистка сервера!"
echo "Это удалит:"
echo "  - Все Docker контейнеры, образы, volumes, сети"
echo "  - Все node_modules и build артефакты"
echo "  - Все временные файлы проекта"
echo ""
read -p "Продолжить? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Отменено"
    exit 1
fi

cd /opt/Nardist

# 1. Останавливаем и удаляем ВСЕ контейнеры
echo "1️⃣ Останавливаем все контейнеры..."
docker compose -f docker-compose.prod.yml down --remove-orphans 2>/dev/null || true
docker ps -aq | xargs -r docker rm -f 2>/dev/null || true

# 2. Удаляем ВСЕ образы проекта
echo "2️⃣ Удаляем все образы проекта..."
docker images | grep -E "(nardist|ghcr.io/uz11ps)" | awk '{print $3}' | xargs -r docker rmi -f 2>/dev/null || true

# 3. Удаляем ВСЕ volumes проекта
echo "3️⃣ Удаляем все volumes..."
docker volume ls | grep nardist | awk '{print $2}' | xargs -r docker volume rm -f 2>/dev/null || true

# 4. Удаляем ВСЕ сети проекта
echo "4️⃣ Удаляем все сети..."
docker network ls | grep nardist | awk '{print $1}' | xargs -r docker network rm 2>/dev/null || true

# 5. Полная очистка Docker системы
echo "5️⃣ Полная очистка Docker системы..."
docker system prune -af --volumes

# 6. Очищаем проект от build артефактов
echo "6️⃣ Очищаем проект от build артефактов..."
cd /opt/Nardist
rm -rf backend/node_modules backend/dist backend/.nest
rm -rf frontend/node_modules frontend/dist frontend/.vite
rm -rf node_modules

# 7. Удаляем временные файлы
echo "7️⃣ Удаляем временные файлы..."
rm -f backend/package-lock.json
rm -f frontend/package-lock.json
rm -f package-lock.json
rm -f backend/Dockerfile.*
rm -f scripts/*.sh
rm -f *.md *.txt *.ps1 *.bat

# 8. Очищаем логи
echo "8️⃣ Очищаем логи..."
journalctl --vacuum-time=1d 2>/dev/null || true
rm -rf /var/log/*.log.* 2>/dev/null || true

# 9. Очищаем кэш системы
echo "9️⃣ Очищаем кэш системы..."
apt-get clean 2>/dev/null || true
apt-get autoclean 2>/dev/null || true

# 10. Показываем статистику
echo ""
echo "📊 Статистика после очистки:"
echo "Docker дисковое пространство:"
docker system df

echo ""
echo "Свободное место на диске:"
df -h / | tail -1

echo ""
echo "✅ Полная очистка сервера завершена!"
echo ""
echo "Для восстановления проекта выполните:"
echo "  cd /opt/Nardist"
echo "  git pull origin main"
echo "  bash scripts/build-preinstall-deps.sh"
