#!/bin/bash

# Скрипт для массовой замены PrismaService на DatabaseService во всех сервисах

cd "$(dirname "$0")/.." || exit 1

echo "🔄 Замена PrismaService на DatabaseService во всех сервисах..."

# Находим все файлы сервисов и заменяем импорты
find backend/src -name "*.service.ts" -type f | while read -r file; do
    if grep -q "PrismaService" "$file"; then
        echo "  Обновление: $file"
        sed -i 's/import { PrismaService }/import { DatabaseService }/g' "$file"
        sed -i 's/from '\''\.\.\/prisma\/prisma\.service'\''/from '\''..\/database\/database.service'\''/g' "$file"
        sed -i 's/from "\.\.\/prisma\/prisma\.service"/from "..\/database\/database.service"/g' "$file"
        sed -i 's/private readonly prisma: PrismaService/private readonly db: DatabaseService/g' "$file"
        sed -i 's/private readonly prisma/private readonly db/g' "$file"
        sed -i 's/this\.prisma\./this.db./g' "$file"
    fi
done

echo "✅ Замена завершена!"
echo "⚠️  ВНИМАНИЕ: Нужно вручную переписать все Prisma запросы на SQL!"
