# Полная очистка сервера от проекта

Этот документ содержит команды для полной очистки сервера от проекта Nardist перед повторной установкой.

## ⚠️ ВНИМАНИЕ

**Эти команды удалят ВСЕ данные проекта, включая:**
- Базу данных PostgreSQL (все данные будут потеряны!)
- Данные Redis
- SSL сертификаты
- Все контейнеры и образы
- Директорию проекта

## Способ 1: Автоматическая очистка (рекомендуется)

```bash
# Загрузите скрипт на сервер
scp scripts/cleanup-server.sh user@your-server:/tmp/

# Подключитесь к серверу
ssh user@your-server

# Сделайте скрипт исполняемым и запустите
chmod +x /tmp/cleanup-server.sh
sudo /tmp/cleanup-server.sh
```

## Способ 2: Ручная очистка (пошагово)

### Шаг 1: Подключитесь к серверу

```bash
ssh user@your-server
```

### Шаг 2: Перейдите в директорию проекта

```bash
cd /opt/Nardist
```

### Шаг 3: Остановите и удалите все контейнеры

```bash
# Определите команду docker compose
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Остановите все контейнеры
$DOCKER_COMPOSE -f docker-compose.prod.yml down --remove-orphans

# Принудительно удалите контейнеры по имени
docker rm -f nardist_backend_prod nardist_frontend_prod nardist_postgres_prod \
             nardist_redis_prod nardist_nginx_prod nardist_certbot 2>/dev/null || true
```

### Шаг 4: Удалите все volumes (база данных, redis, certbot)

```bash
# Удалите volumes по имени
docker volume rm nardist_postgres_data nardist_redis_data \
                 nardist_certbot_data nardist_certbot_www 2>/dev/null || true

# Или удалите все volumes проекта
docker volume ls | grep nardist | awk '{print $2}' | xargs docker volume rm 2>/dev/null || true
```

### Шаг 5: Удалите образы проекта

```bash
# Удалите локальные образы
docker rmi nardist-backend:latest nardist-frontend:latest 2>/dev/null || true

# Удалите образы из GitHub Container Registry (если были скачаны)
docker rmi ghcr.io/uz11ps/nardist-backend:latest \
           ghcr.io/uz11ps/nardist-frontend:latest 2>/dev/null || true

# Удалите все образы связанные с проектом
docker images | grep -E "nardist|ghcr.io/uz11ps/nardist" | awk '{print $3}' | xargs docker rmi -f 2>/dev/null || true
```

### Шаг 6: Удалите сети Docker

```bash
# Удалите сеть проекта
docker network rm nardist_network 2>/dev/null || true

# Очистите неиспользуемые сети
docker network prune -f
```

### Шаг 7: Сохраните .env файл (опционально, но рекомендуется)

```bash
# Создайте резервную копию .env
mkdir -p ~/nardist-backup-$(date +%Y%m%d)
cp /opt/Nardist/.env ~/nardist-backup-$(date +%Y%m%d)/.env 2>/dev/null || echo ".env не найден"
```

### Шаг 8: Удалите директорию проекта

```bash
# Выйдите из директории проекта
cd /

# Удалите директорию проекта
sudo rm -rf /opt/Nardist
```

### Шаг 9: Очистите неиспользуемые Docker ресурсы

```bash
# Полная очистка Docker (удалит все неиспользуемые контейнеры, образы, volumes, сети)
docker system prune -af --volumes
```

## Проверка очистки

После выполнения команд проверьте, что все удалено:

```bash
# Проверьте контейнеры
docker ps -a | grep nardist
# Должно быть пусто

# Проверьте volumes
docker volume ls | grep nardist
# Должно быть пусто

# Проверьте образы
docker images | grep nardist
# Должно быть пусто

# Проверьте сети
docker network ls | grep nardist
# Должно быть пусто

# Проверьте директорию
ls -la /opt/Nardist
# Должна быть ошибка "No such file or directory"
```

## Повторная установка

После очистки вы можете установить проект заново:

### 1. Клонируйте репозиторий

```bash
cd /opt
sudo git clone https://github.com/Uz11ps/Nardist.git
sudo chown -R $USER:$USER Nardist
cd Nardist
```

### 2. Создайте .env файл

```bash
cp .env.example .env
nano .env
```

Заполните все необходимые переменные (или восстановите из резервной копии).

### 3. Запустите деплой

**Вариант A: Ручной деплой**
```bash
./deploy.sh
```

**Вариант B: Через GitHub Actions**
- Убедитесь, что в репозитории настроены secrets:
  - `SERVER_HOST` - IP адрес сервера
  - `SERVER_USER` - пользователь для SSH
  - `SERVER_SSH_KEY` - приватный SSH ключ
- Сделайте push в main ветку или запустите workflow вручную

## Все команды одной строкой (для копирования)

```bash
cd /opt/Nardist && \
docker compose -f docker-compose.prod.yml down --remove-orphans && \
docker rm -f nardist_backend_prod nardist_frontend_prod nardist_postgres_prod nardist_redis_prod nardist_nginx_prod nardist_certbot 2>/dev/null || true && \
docker volume rm nardist_postgres_data nardist_redis_data nardist_certbot_data nardist_certbot_www 2>/dev/null || true && \
docker rmi nardist-backend:latest nardist-frontend:latest ghcr.io/uz11ps/nardist-backend:latest ghcr.io/uz11ps/nardist-frontend:latest 2>/dev/null || true && \
docker network rm nardist_network 2>/dev/null || true && \
cd / && \
sudo rm -rf /opt/Nardist && \
docker system prune -af --volumes
```

## Примечания

- Если у вас есть важные данные в базе, сделайте резервную копию перед очисткой
- SSL сертификаты можно получить заново через certbot
- После очистки все настройки нужно будет настроить заново
