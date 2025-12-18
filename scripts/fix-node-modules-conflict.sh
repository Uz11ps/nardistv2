#!/bin/bash
# Скрипт для исправления конфликта node_modules между родительской и backend директориями

echo "🧹 Удаляем родительский node_modules (если есть конфликт)..."
cd /opt/Nardist
rm -rf node_modules package-lock.json

echo "🧹 Очищаем backend node_modules..."
cd /opt/Nardist/backend
rm -rf node_modules package-lock.json

echo "📦 Устанавливаем зависимости в backend..."
npm install --legacy-peer-deps

echo "✅ Готово!"
