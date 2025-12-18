#!/bin/bash

set -e

echo "🔍 Testing Prisma generation process..."
echo ""

# Переходим в директорию backend
cd "$(dirname "$0")/.." || exit 1

echo "📋 Current directory: $(pwd)"
echo ""

# Проверяем наличие файлов
echo "📁 Checking required files..."
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found!"
    exit 1
fi
echo "✅ package.json found"

if [ ! -f "prisma/schema.prisma" ]; then
    echo "❌ prisma/schema.prisma not found!"
    exit 1
fi
echo "✅ prisma/schema.prisma found"
echo ""

# Проверяем Node.js версию
echo "📦 Node.js version:"
node --version
npm --version
echo ""

# Проверяем установлены ли зависимости
if [ ! -d "node_modules" ]; then
    echo "⚠️  node_modules not found, installing dependencies..."
    npm install --legacy-peer-deps
else
    echo "✅ node_modules exists"
fi
echo ""

# Проверяем Prisma CLI
echo "🔧 Checking Prisma CLI..."
if command -v npx &> /dev/null; then
    echo "✅ npx available"
    npx prisma --version || echo "⚠️  Prisma CLI not found in node_modules"
else
    echo "❌ npx not found!"
    exit 1
fi
echo ""

# Генерируем Prisma клиент с подробным выводом
echo "🚀 Generating Prisma client..."
echo "This may take 30-60 seconds..."
echo ""

# Используем локальную версию Prisma из package.json (5.7.1), а не последнюю через npx
START_TIME=$(date +%s)
if [ -f "./node_modules/.bin/prisma" ]; then
    echo "✅ Using local Prisma from node_modules..."
    ./node_modules/.bin/prisma generate --schema=./prisma/schema.prisma
elif [ -f "./node_modules/prisma/package.json" ]; then
    echo "✅ Using Prisma via npm script..."
    npm run prisma:generate
else
    echo "⚠️  Local Prisma not found, using specific version..."
    npx --package=prisma@5.7.1 prisma generate --schema=./prisma/schema.prisma
fi
END_TIME=$(date +%s)

DURATION=$((END_TIME - START_TIME))
echo ""
echo "⏱️  Prisma generation took: ${DURATION} seconds"
echo ""

# Проверяем что клиент сгенерирован
echo "🔍 Verifying generated Prisma client..."
if [ -d "node_modules/.prisma/client" ]; then
    echo "✅ Prisma client directory exists"
    CLIENT_COUNT=$(find node_modules/.prisma/client -type f | wc -l)
    echo "   Found $CLIENT_COUNT files in Prisma client"
    ls -lh node_modules/.prisma/client/ | head -10
else
    echo "❌ Prisma client directory not found!"
    exit 1
fi
echo ""

# Проверяем размер
if [ -d "node_modules/.prisma" ]; then
    PRISMA_SIZE=$(du -sh node_modules/.prisma | cut -f1)
    echo "📊 Prisma directory size: $PRISMA_SIZE"
fi
echo ""

echo "✅ Prisma generation test completed successfully!"
