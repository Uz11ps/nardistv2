# Инструкция по замене файлов через SCP

## Подготовка

1. Убедитесь, что все файлы переписаны локально
2. Соберите все измененные файлы в одну директорию

## Команды для замены файлов через SCP

### Вариант 1: Замена отдельных файлов

```bash
# Замените USERNAME, HOST и PATH на ваши данные
USERNAME="root"
HOST="89.104.65.118"
REMOTE_PATH="/opt/Nardist"

# Замена сервисов (все переписаны)
scp backend/src/auth/auth.service.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/auth/
scp backend/src/users/users.service.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/users/
scp backend/src/referrals/referrals.service.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/referrals/
scp backend/src/subscription/subscription.service.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/subscription/
scp backend/src/tournaments/tournaments.service.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/tournaments/
scp backend/src/game-history/game-history.service.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/game-history/
scp backend/src/inventory/inventory.service.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/inventory/
scp backend/src/economy/economy.service.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/economy/
scp backend/src/ratings/ratings.service.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/ratings/
scp backend/src/academy/academy.service.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/academy/
scp backend/src/quests/quests.service.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/quests/
scp backend/src/city/city.service.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/city/
scp backend/src/resources/resources.service.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/resources/
scp backend/src/districts/districts.service.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/districts/
scp backend/src/clans/clans.service.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/clans/
scp backend/src/market/market.service.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/market/
scp backend/src/sieges/sieges.service.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/sieges/
scp backend/src/businesses/businesses.service.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/businesses/
scp backend/src/admin/admin.service.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/admin/

# Замена модулей (все обновлены)
scp backend/src/auth/auth.module.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/auth/
scp backend/src/users/users.module.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/users/
scp backend/src/referrals/referrals.module.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/referrals/
scp backend/src/subscription/subscription.module.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/subscription/
scp backend/src/tournaments/tournaments.module.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/tournaments/
scp backend/src/game-history/game-history.module.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/game-history/
scp backend/src/inventory/inventory.module.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/inventory/
scp backend/src/economy/economy.module.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/economy/
scp backend/src/ratings/ratings.module.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/ratings/
scp backend/src/academy/academy.module.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/academy/
scp backend/src/quests/quests.module.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/quests/
scp backend/src/city/city.module.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/city/
scp backend/src/resources/resources.module.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/resources/
scp backend/src/districts/districts.module.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/districts/
scp backend/src/clans/clans.module.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/clans/
scp backend/src/market/market.module.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/market/
scp backend/src/sieges/sieges.module.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/sieges/
scp backend/src/businesses/businesses.module.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/businesses/
scp backend/src/admin/admin.module.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/admin/
scp backend/src/health/health.module.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/health/

# Замена DatabaseService и модуля
scp backend/src/database/database.service.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/database/
scp backend/src/database/database.module.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/database/

# Замена app.module.ts
scp backend/src/app.module.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/

# Замена health.service.ts
scp backend/src/health/health.service.ts ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/health/
```

### Вариант 2: Массовая замена через rsync (рекомендуется)

```bash
USERNAME="root"
HOST="89.104.65.118"
REMOTE_PATH="/opt/Nardist"

# Синхронизация всех измененных файлов
rsync -avz --progress \
  backend/src/auth/ \
  backend/src/users/ \
  backend/src/referrals/ \
  backend/src/subscription/ \
  backend/src/tournaments/ \
  backend/src/game-history/ \
  backend/src/inventory/ \
  backend/src/economy/ \
  backend/src/ratings/ \
  backend/src/academy/ \
  backend/src/quests/ \
  backend/src/city/ \
  backend/src/resources/ \
  backend/src/districts/ \
  backend/src/clans/ \
  backend/src/market/ \
  backend/src/sieges/ \
  backend/src/businesses/ \
  backend/src/admin/ \
  backend/src/database/ \
  backend/src/app.module.ts \
  backend/src/health/health.service.ts \
  ${USERNAME}@${HOST}:${REMOTE_PATH}/backend/src/
```

### Вариант 3: Использование Git (самый простой способ)

```bash
# На сервере
cd /opt/Nardist
git pull origin main

# Или если нужно применить изменения из локальной ветки
git fetch origin
git merge origin/main
```

## После замены файлов на сервере

1. Установите зависимости:
```bash
cd /opt/Nardist/backend
npm install
```

2. Пересоберите Docker образ:
```bash
cd /opt/Nardist
docker compose -f docker-compose.prod.yml build backend --no-cache
```

3. Перезапустите контейнеры:
```bash
docker compose -f docker-compose.prod.yml up -d backend
```

4. Проверьте логи:
```bash
docker compose -f docker-compose.prod.yml logs -f backend
```

## Важно

- Убедитесь, что все модули обновлены (заменены PrismaModule на DatabaseModule)
- Проверьте, что все сервисы используют DatabaseService вместо PrismaService
- Удалите старые файлы Prisma (prisma/ директория и src/prisma/)
- Проверьте, что package.json обновлен (удалены Prisma зависимости, добавлен pg)
