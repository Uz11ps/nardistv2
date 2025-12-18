#!/bin/bash

# Скрипт для очистки проекта от временных файлов и скриптов

set -e

echo "🧹 Очистка проекта от временных файлов"
echo ""

cd /opt/Nardist

# 1. Удаляем временные скрипты деплоя и диагностики
echo "1️⃣ Удаляем временные скрипты..."
rm -f scripts/build-*.sh
rm -f scripts/fix-*.sh
rm -f scripts/check-*.sh
rm -f scripts/test-*.sh
rm -f scripts/clean-*.sh
rm -f scripts/recreate-*.sh
rm -f scripts/ensure-*.sh
rm -f scripts/start-*.sh
rm -f scripts/debug-*.sh
rm -f scripts/*-network*.sh
rm -f scripts/*-connection*.sh
rm -f scripts/*-image*.sh
rm -f scripts/*-status*.sh

# 2. Удаляем временные Dockerfile
echo "2️⃣ Удаляем временные Dockerfile..."
rm -f backend/Dockerfile.fast
rm -f backend/Dockerfile.local
rm -f backend/Dockerfile.optimized
rm -f backend/Dockerfile.yarn

# 3. Удаляем временные markdown файлы
echo "3️⃣ Удаляем временные документации..."
rm -f BUILD_OPTIONS.md
rm -f QUICK_DEPLOY.md
rm -f CLEANUP_SERVER.md
rm -f SCP_*.md
rm -f SCP_*.txt
rm -f SCP_*.ps1
rm -f SCP_*.bat
rm -f SCP_*.sh

# 4. Очищаем node_modules и dist (если нужно)
echo "4️⃣ Очищаем build артефакты..."
cd backend
rm -rf node_modules dist .nest
cd ..

# 5. Очищаем git от удаленных файлов
echo "5️⃣ Очищаем git..."
git add -A
git status

echo ""
echo "✅ Очистка проекта завершена!"
echo "📝 Проверьте изменения: git status"
echo "💾 Для коммита: git commit -m 'Cleanup: удалены временные файлы и скрипты'"
