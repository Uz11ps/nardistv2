#!/bin/bash

set -e

echo "🔧 Fixing Prisma on server..."
echo ""

cd /opt/Nardist/backend || exit 1

echo "📋 Current directory: $(pwd)"
echo ""

# Проверяем Node.js версию
echo "📦 Node.js version:"
node --version
npm --version
echo ""

# Проверяем package.json
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found!"
    exit 1
fi

# Проверяем версию Prisma в package.json
PRISMA_VERSION=$(grep -A 1 '"prisma"' package.json | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+' | head -1)
echo "📌 Prisma version in package.json: $PRISMA_VERSION"
echo ""

# Устанавливаем зависимости если их нет
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install --legacy-peer-deps --no-audit
else
    echo "✅ node_modules exists"
    # Проверяем установлена ли Prisma
    if [ ! -d "node_modules/prisma" ]; then
        echo "⚠️  Prisma not found in node_modules, installing..."
        npm install --legacy-peer-deps --no-audit
    fi
fi
echo ""

# Проверяем какая версия Prisma установлена
if [ -f "node_modules/prisma/package.json" ]; then
    INSTALLED_VERSION=$(grep '"version"' node_modules/prisma/package.json | grep -o '[0-9]\+\.[0-9]\+\.[0-9]\+')
    echo "✅ Installed Prisma version: $INSTALLED_VERSION"
else
    echo "❌ Prisma not installed!"
    exit 1
fi
echo ""

# Генерируем Prisma клиент используя локальную версию
echo "🚀 Generating Prisma client..."
echo "Using Prisma $INSTALLED_VERSION from node_modules..."
echo ""

START_TIME=$(date +%s)

# Используем локальную версию Prisma
if [ -f "./node_modules/.bin/prisma" ]; then
    echo "✅ Using: ./node_modules/.bin/prisma"
    ./node_modules/.bin/prisma generate --schema=./prisma/schema.prisma
elif command -v npm &> /dev/null; then
    echo "✅ Using: npm run prisma:generate"
    npm run prisma:generate
else
    echo "❌ Cannot find Prisma CLI!"
    exit 1
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
    CLIENT_COUNT=$(find node_modules/.prisma/client -type f 2>/dev/null | wc -l)
    echo "   Found $CLIENT_COUNT files in Prisma client"
    echo ""
    echo "📋 First 10 files:"
    ls -lh node_modules/.prisma/client/ | head -10
else
    echo "❌ Prisma client directory not found!"
    echo "Checking node_modules/.prisma:"
    ls -la node_modules/.prisma/ 2>/dev/null || echo "node_modules/.prisma does not exist"
    exit 1
fi
echo ""

# Проверяем размер
if [ -d "node_modules/.prisma" ]; then
    PRISMA_SIZE=$(du -sh node_modules/.prisma 2>/dev/null | cut -f1)
    echo "📊 Prisma directory size: $PRISMA_SIZE"
fi
echo ""

echo "✅ Prisma setup completed successfully!"
echo ""
echo "💡 To use Prisma in the future, use:"
echo "   ./node_modules/.bin/prisma generate"
echo "   or"
echo "   npm run prisma:generate"
