# Оптимизация сборки Docker образов

## Проблема: Медленная сборка

Если сборка Docker образов занимает слишком много времени (>10 минут), это обычно связано с установкой npm зависимостей.

## Решение: Использование package-lock.json

`package-lock.json` файлы значительно ускоряют установку зависимостей, так как npm точно знает какие версии устанавливать.

### Шаг 1: Генерация package-lock.json файлов

Выполните локально на вашем компьютере (не на сервере):

```bash
# Для backend
cd backend
npm install --package-lock-only --legacy-peer-deps
cd ..

# Для frontend
cd frontend
npm install --package-lock-only
cd ..
```

Или используйте скрипт:

```bash
chmod +x scripts/generate-package-locks.sh
./scripts/generate-package-locks.sh
```

### Шаг 2: Закоммитьте package-lock.json файлы

```bash
git add backend/package-lock.json frontend/package-lock.json
git commit -m "Add package-lock.json files for faster builds"
git push origin main
```

### Шаг 3: Обновите код на сервере

```bash
cd /opt/Nardist
git pull origin main
./deploy.sh
```

## Альтернативное решение: Использование готовых образов

Если сборка все еще медленная, можно использовать готовые образы из GitHub Container Registry:

1. В GitHub Actions образы уже собираются и пушатся в registry
2. На сервере можно просто их скачивать вместо сборки

Обновите `.env` файл:

```env
BACKEND_IMAGE=ghcr.io/uz11ps/nardist-backend:latest
FRONTEND_IMAGE=ghcr.io/uz11ps/nardist-frontend:latest
```

И используйте `docker-compose pull` вместо `docker-compose build`.

## Дополнительные оптимизации

### Использование BuildKit

BuildKit уже включен в `deploy.sh`, но можно проверить:

```bash
export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1
```

### Использование Docker Build Cache

Docker автоматически кэширует слои. При повторных сборках будут использоваться кэшированные слои.

### Использование .dockerignore

Убедитесь, что `.dockerignore` файлы исключают ненужные файлы:
- `node_modules`
- `.git`
- `dist`
- тестовые файлы

## Ожидаемое время сборки

- **С package-lock.json**: 2-5 минут
- **Без package-lock.json**: 10-30+ минут
- **С кэшем Docker**: 1-2 минуты (повторные сборки)

