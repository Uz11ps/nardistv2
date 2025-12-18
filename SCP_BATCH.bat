@echo off
REM Batch скрипт для загрузки всех файлов на сервер через SCP
REM Для Windows

set USERNAME=root
set HOST=89.104.65.118
set REMOTE_PATH=/opt/Nardist

echo 🚀 Начинаем загрузку всех файлов на сервер...

echo 📦 Загружаем сервисы...
scp backend/src/auth/auth.service.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/auth/
scp backend/src/users/users.service.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/users/
scp backend/src/referrals/referrals.service.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/referrals/
scp backend/src/subscription/subscription.service.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/subscription/
scp backend/src/tournaments/tournaments.service.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/tournaments/
scp backend/src/game-history/game-history.service.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/game-history/
scp backend/src/inventory/inventory.service.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/inventory/
scp backend/src/economy/economy.service.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/economy/
scp backend/src/ratings/ratings.service.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/ratings/
scp backend/src/academy/academy.service.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/academy/
scp backend/src/quests/quests.service.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/quests/
scp backend/src/city/city.service.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/city/
scp backend/src/resources/resources.service.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/resources/
scp backend/src/districts/districts.service.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/districts/
scp backend/src/clans/clans.service.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/clans/
scp backend/src/market/market.service.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/market/
scp backend/src/sieges/sieges.service.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/sieges/
scp backend/src/businesses/businesses.service.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/businesses/
scp backend/src/admin/admin.service.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/admin/

echo 📦 Загружаем модули...
scp backend/src/auth/auth.module.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/auth/
scp backend/src/users/users.module.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/users/
scp backend/src/referrals/referrals.module.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/referrals/
scp backend/src/subscription/subscription.module.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/subscription/
scp backend/src/tournaments/tournaments.module.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/tournaments/
scp backend/src/game-history/game-history.module.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/game-history/
scp backend/src/inventory/inventory.module.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/inventory/
scp backend/src/economy/economy.module.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/economy/
scp backend/src/ratings/ratings.module.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/ratings/
scp backend/src/academy/academy.module.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/academy/
scp backend/src/quests/quests.module.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/quests/
scp backend/src/city/city.module.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/city/
scp backend/src/resources/resources.module.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/resources/
scp backend/src/districts/districts.module.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/districts/
scp backend/src/clans/clans.module.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/clans/
scp backend/src/market/market.module.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/market/
scp backend/src/sieges/sieges.module.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/sieges/
scp backend/src/businesses/businesses.module.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/businesses/
scp backend/src/admin/admin.module.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/admin/
scp backend/src/health/health.module.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/health/

echo 📦 Загружаем DatabaseService...
scp backend/src/database/database.service.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/database/
scp backend/src/database/database.module.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/database/

echo 📦 Загружаем app.module.ts...
scp backend/src/app.module.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/

echo 📦 Загружаем health.service.ts...
scp backend/src/health/health.service.ts %USERNAME%@%HOST%:%REMOTE_PATH%/backend/src/health/

echo 📦 Загружаем package.json и Dockerfile...
scp backend/package.json %USERNAME%@%HOST%:%REMOTE_PATH%/backend/
scp backend/Dockerfile %USERNAME%@%HOST%:%REMOTE_PATH%/backend/

echo ✅ Все файлы загружены!
echo.
echo 📋 Следующие шаги на сервере:
echo 1. cd /opt/Nardist/backend
echo 2. npm install
echo 3. cd /opt/Nardist
echo 4. docker compose -f docker-compose.prod.yml build backend --no-cache
echo 5. docker compose -f docker-compose.prod.yml up -d backend
echo 6. docker compose -f docker-compose.prod.yml logs -f backend

pause
