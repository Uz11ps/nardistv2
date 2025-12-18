# Инструкция по полной очистке сервера

## Быстрая очистка и редеплой

Выполните на сервере:

```bash
cd /opt/Nardist
git pull origin main
chmod +x scripts/full-server-cleanup.sh
chmod +x scripts/cleanup-and-redeploy.sh

# Вариант 1: Только очистка
bash scripts/full-server-cleanup.sh

# Вариант 2: Очистка + автоматический редеплой
bash scripts/cleanup-and-redeploy.sh
```

## Ручная очистка (пошагово)

### 1. Остановить все контейнеры
```bash
cd /opt/Nardist
docker compose -f docker-compose.prod.yml down
docker stop $(docker ps -aq) 2>/dev/null || true
```

### 2. Удалить все контейнеры
```bash
docker rm -f $(docker ps -aq) 2>/dev/null || true
```

### 3. Удалить образы проекта
```bash
docker images | grep -E "nardist|backend|frontend" | awk '{print $3}' | xargs -r docker rmi -f
```

### 4. Очистить Docker систему
```bash
docker system prune -af --volumes
docker builder prune -af
```

### 5. Удалить node_modules
```bash
rm -rf /opt/Nardist/node_modules
rm -rf /opt/Nardist/backend/node_modules
rm -rf /opt/Nardist/frontend/node_modules
rm -f /opt/Nardist/backend/package-lock.json
```

### 6. Обновить проект из Git
```bash
cd /opt/Nardist
git pull origin main
```

### 7. Установить зависимости
```bash
cd /opt/Nardist/backend
npm install --legacy-peer-deps
```

### 8. Собрать и запустить
```bash
cd /opt/Nardist
docker compose -f docker-compose.prod.yml build --no-cache backend
docker compose -f docker-compose.prod.yml up -d
```

### 9. Проверить логи
```bash
docker compose -f docker-compose.prod.yml logs -f backend
```
