#!/bin/bash

# Скрипт для массовой замены PrismaModule на DatabaseModule во всех модулях

cd "$(dirname "$0")/.." || exit 1

echo "🔄 Замена PrismaModule на DatabaseModule во всех модулях..."

# Находим все файлы модулей и заменяем импорты
find backend/src -name "*.module.ts" -type f | while read -r file; do
    if grep -q "PrismaModule" "$file"; then
        echo "  Обновление: $file"
        sed -i 's/import { PrismaModule }/import { DatabaseModule }/g' "$file"
        sed -i 's/from '\''\.\.\/prisma\/prisma\.module'\''/from '\''..\/database\/database.module'\''/g' "$file"
        sed -i 's/from "\.\.\/prisma\/prisma\.module"/from "..\/database\/database.module"/g' "$file"
        sed -i 's/PrismaModule/DatabaseModule/g' "$file"
    fi
done

echo "✅ Замена завершена!"
