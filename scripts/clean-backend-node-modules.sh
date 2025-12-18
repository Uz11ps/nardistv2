#!/bin/bash
# Скрипт для очистки node_modules и переустановки зависимостей на сервере

cd /opt/Nardist/backend

echo "🧹 Очищаем node_modules и package-lock.json..."
rm -rf node_modules package-lock.json

echo "📦 Устанавливаем зависимости..."
npm install --legacy-peer-deps

echo "✅ Готово!"
