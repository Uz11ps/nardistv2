#!/bin/bash

# Скрипт для массовой замены PrismaModule на DatabaseModule во всех модулях

cd "$(dirname "$0")/.." || exit 1

echo "🔄 Замена PrismaModule на DatabaseModule во всех модулях..."

# Список всех модулей для обновления
MODULES=(
  "backend/src/auth/auth.module.ts"
  "backend/src/users/users.module.ts"
  "backend/src/referrals/referrals.module.ts"
  "backend/src/subscription/subscription.module.ts"
  "backend/src/tournaments/tournaments.module.ts"
  "backend/src/game-history/game-history.module.ts"
  "backend/src/inventory/inventory.module.ts"
  "backend/src/economy/economy.module.ts"
  "backend/src/clans/clans.module.ts"
  "backend/src/businesses/businesses.module.ts"
  "backend/src/admin/admin.module.ts"
  "backend/src/academy/academy.module.ts"
  "backend/src/sieges/sieges.module.ts"
  "backend/src/resources/resources.module.ts"
  "backend/src/ratings/ratings.module.ts"
  "backend/src/quests/quests.module.ts"
  "backend/src/market/market.module.ts"
  "backend/src/districts/districts.module.ts"
  "backend/src/city/city.module.ts"
  "backend/src/health/health.module.ts"
)

for module in "${MODULES[@]}"; do
  if [ -f "$module" ]; then
    echo "  Обновление: $module"
    # Заменяем импорт
    sed -i.bak 's/import { PrismaModule }/import { DatabaseModule }/g' "$module"
    sed -i.bak 's/from '\''\.\.\/prisma\/prisma\.module'\''/from '\''..\/database\/database.module'\''/g' "$module"
    sed -i.bak 's/from "\.\.\/prisma\/prisma\.module"/from "..\/database\/database.module"/g' "$module"
    # Заменяем использование в imports массиве
    sed -i.bak 's/PrismaModule/DatabaseModule/g' "$module"
    # Удаляем backup файлы
    rm -f "${module}.bak"
  else
    echo "  ⚠️  Файл не найден: $module"
  fi
done

echo "✅ Замена завершена!"
