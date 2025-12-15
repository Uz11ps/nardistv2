#!/bin/bash

set -e

echo "🔄 Updating from Git repository..."

# Проверяем статус репозитория
if [ -n "$(git status --porcelain)" ]; then
    echo "⚠️  You have local changes. Choose an option:"
    echo "1) Stash local changes and pull (recommended)"
    echo "2) Discard local changes and pull"
    echo "3) Commit local changes first"
    read -p "Enter choice (1/2/3): " choice
    
    case $choice in
        1)
            echo "📦 Stashing local changes..."
            git stash push -m "Local changes before pull $(date)"
            echo "⬇️  Pulling latest changes..."
            git pull origin main || git pull origin master
            echo "📤 Applying stashed changes..."
            git stash pop || echo "⚠️  No stashed changes to apply"
            ;;
        2)
            echo "🗑️  Discarding local changes..."
            git reset --hard HEAD
            echo "⬇️  Pulling latest changes..."
            git pull origin main || git pull origin master
            ;;
        3)
            echo "📝 Please commit your changes first:"
            echo "   git add ."
            echo "   git commit -m 'Your commit message'"
            echo "   git pull origin main"
            exit 1
            ;;
        *)
            echo "❌ Invalid choice"
            exit 1
            ;;
    esac
else
    echo "⬇️  Pulling latest changes..."
    git pull origin main || git pull origin master
fi

echo "✅ Repository updated successfully!"

# Перезапускаем контейнеры если они запущены
if docker compose ps 2>/dev/null | grep -q "Up" || docker-compose ps 2>/dev/null | grep -q "Up"; then
    echo "🔄 Restarting containers with new code..."
    if command -v docker &> /dev/null && docker compose version &> /dev/null; then
        docker compose -f docker-compose.prod.yml up -d --build
    elif command -v docker-compose &> /dev/null; then
        docker-compose -f docker-compose.prod.yml up -d --build
    fi
fi

echo "✅ Update completed!"

