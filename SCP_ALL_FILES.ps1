# PowerShell скрипт для загрузки всех файлов на сервер
# Конфигурация сервера
$USERNAME = "root"
$SERVER_HOST = "89.104.65.118"
$REMOTE_PATH = "/opt/Nardist"

Write-Host "🚀 Начинаем загрузку всех файлов на сервер..." -ForegroundColor Green

# Замена сервисов (все переписаны)
Write-Host "📦 Загружаем сервисы..." -ForegroundColor Cyan
scp backend/src/auth/auth.service.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/auth/"
scp backend/src/users/users.service.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/users/"
scp backend/src/referrals/referrals.service.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/referrals/"
scp backend/src/subscription/subscription.service.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/subscription/"
scp backend/src/tournaments/tournaments.service.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/tournaments/"
scp backend/src/game-history/game-history.service.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/game-history/"
scp backend/src/inventory/inventory.service.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/inventory/"
scp backend/src/economy/economy.service.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/economy/"
scp backend/src/ratings/ratings.service.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/ratings/"
scp backend/src/academy/academy.service.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/academy/"
scp backend/src/quests/quests.service.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/quests/"
scp backend/src/city/city.service.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/city/"
scp backend/src/resources/resources.service.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/resources/"
scp backend/src/districts/districts.service.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/districts/"
scp backend/src/clans/clans.service.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/clans/"
scp backend/src/market/market.service.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/market/"
scp backend/src/sieges/sieges.service.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/sieges/"
scp backend/src/businesses/businesses.service.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/businesses/"
scp backend/src/admin/admin.service.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/admin/"

# Замена модулей (все обновлены)
Write-Host "📦 Загружаем модули..." -ForegroundColor Cyan
scp backend/src/auth/auth.module.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/auth/"
scp backend/src/users/users.module.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/users/"
scp backend/src/referrals/referrals.module.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/referrals/"
scp backend/src/subscription/subscription.module.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/subscription/"
scp backend/src/tournaments/tournaments.module.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/tournaments/"
scp backend/src/game-history/game-history.module.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/game-history/"
scp backend/src/inventory/inventory.module.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/inventory/"
scp backend/src/economy/economy.module.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/economy/"
scp backend/src/ratings/ratings.module.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/ratings/"
scp backend/src/academy/academy.module.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/academy/"
scp backend/src/quests/quests.module.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/quests/"
scp backend/src/city/city.module.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/city/"
scp backend/src/resources/resources.module.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/resources/"
scp backend/src/districts/districts.module.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/districts/"
scp backend/src/clans/clans.module.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/clans/"
scp backend/src/market/market.module.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/market/"
scp backend/src/sieges/sieges.module.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/sieges/"
scp backend/src/businesses/businesses.module.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/businesses/"
scp backend/src/admin/admin.module.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/admin/"
scp backend/src/health/health.module.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/health/"

# Замена DatabaseService и модуля
Write-Host "📦 Создаем директорию database на сервере..." -ForegroundColor Cyan
ssh "${USERNAME}@${SERVER_HOST}" "mkdir -p ${REMOTE_PATH}/backend/src/database"
Write-Host "📦 Загружаем DatabaseService..." -ForegroundColor Cyan
scp backend/src/database/database.service.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/database/"
scp backend/src/database/database.module.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/database/"

# Замена app.module.ts
Write-Host "📦 Загружаем app.module.ts..." -ForegroundColor Cyan
scp backend/src/app.module.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/"

# Замена health.service.ts
Write-Host "📦 Загружаем health.service.ts..." -ForegroundColor Cyan
scp backend/src/health/health.service.ts "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/src/health/"

# Замена package.json и Dockerfile
Write-Host "📦 Загружаем package.json и Dockerfile..." -ForegroundColor Cyan
scp backend/package.json "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/"
scp backend/Dockerfile "${USERNAME}@${SERVER_HOST}:${REMOTE_PATH}/backend/"

Write-Host "✅ Все файлы загружены!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Следующие шаги на сервере:" -ForegroundColor Yellow
Write-Host "1. cd /opt/Nardist/backend"
Write-Host "2. rm -rf node_modules package-lock.json (если есть конфликты)"
Write-Host "3. npm install"
Write-Host "4. cd /opt/Nardist"
Write-Host "5. docker compose -f docker-compose.prod.yml build backend --no-cache"
Write-Host "6. docker compose -f docker-compose.prod.yml up -d backend"
Write-Host "7. docker compose -f docker-compose.prod.yml logs -f backend"
