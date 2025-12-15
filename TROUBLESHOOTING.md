# Устранение неполадок

## Проблема: Docker не установлен

Если при установке Docker Compose возникает ошибка "Command 'docker' not found":

### Решение: Установить Docker

```bash
# Используйте скрипт установки
cd /opt/Nardist
chmod +x scripts/install-docker.sh
sudo ./scripts/install-docker.sh

# Или установите вручную
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh

# Добавьте пользователя в группу docker
sudo usermod -aG docker $USER
newgrp docker  # Или перелогиньтесь
```

## Проблема: Ошибка 504 при скачивании Docker Compose

Если при скачивании docker-compose получаете HTML с ошибкой 504:

```bash
# Удалите поврежденный файл
sudo rm -f /usr/local/bin/docker-compose

# Установите Docker Compose используя скрипт
cd /opt/Nardist
chmod +x scripts/install-docker-compose.sh
sudo ./scripts/install-docker-compose.sh
```

## Проблема: Конфликт при `git pull`

Если при обновлении возникает ошибка "Your local changes would be overwritten":

### Решение 1: Сохранить локальные изменения (рекомендуется)

```bash
cd /opt/Nardist
git stash
git pull origin main
git stash pop
```

### Решение 2: Откатить локальные изменения

```bash
cd /opt/Nardist
git reset --hard HEAD
git pull origin main
```

### Решение 3: Использовать скрипт обновления

```bash
cd /opt/Nardist
chmod +x scripts/update-from-git.sh
./scripts/update-from-git.sh
```

## Проблема: `docker-compose: command not found`

### Решение 1: Установка Docker Compose

```bash
# Установите Docker Compose используя скрипт
chmod +x scripts/install-docker-compose.sh
./scripts/install-docker-compose.sh
```

### Решение 2: Использование Docker Compose plugin (рекомендуется)

В новых версиях Docker Compose встроен как плагин. Используйте:

```bash
docker compose version  # Проверка
docker compose -f docker-compose.prod.yml up -d  # Использование
```

### Решение 3: Ручная установка

```bash
# Установка Docker Compose как плагин
mkdir -p /usr/libexec/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-$(uname -m)" -o /usr/libexec/docker/cli-plugins/docker-compose
chmod +x /usr/libexec/docker/cli-plugins/docker-compose

# Или установка как отдельная команда
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

## Проблема: `.env.example: No such file or directory`

Файл `.env.example` должен быть в корне проекта. Если его нет:

1. Создайте файл `.env` вручную:

```bash
cat > .env << 'EOF'
# Database
POSTGRES_USER=nardist
POSTGRES_PASSWORD=your_secure_password_here_change_this
POSTGRES_DB=nardist_db

# Backend
JWT_SECRET=your_jwt_secret_key_here_min_32_chars_change_this
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
NODE_ENV=production
PORT=3000

# Frontend
VITE_API_URL=https://nardist.online
VITE_WS_URL=https://nardist.online
FRONTEND_URL=https://nardist.online

# Domain
DOMAIN_NAME=nardist.online
SSL_EMAIL=your-email@example.com
EOF
```

2. Отредактируйте файл и заполните все переменные:

```bash
nano .env
```

## Проблема: Репозиторий уже существует

Если репозиторий уже клонирован, просто обновите его:

```bash
cd /opt/Nardist
git pull origin main  # или master
```

## Проблема: Права доступа

Если возникают проблемы с правами:

```bash
cd /opt/Nardist
sudo chown -R $USER:$USER .
chmod +x deploy.sh scripts/*.sh
```

## Проверка установки Docker и Docker Compose

```bash
# Проверка Docker
docker --version

# Проверка Docker Compose (новая версия)
docker compose version

# Проверка docker-compose (старая версия)
docker-compose --version
```

## Быстрый старт после исправления проблем

```bash
cd /opt/Nardist

# 1. Создайте .env файл (если его нет)
if [ ! -f .env ]; then
    # Создайте .env файл вручную или скопируйте из примера
    nano .env
fi

# 2. Установите Docker Compose (если нужно)
./scripts/install-docker-compose.sh

# 3. Запустите деплой
./deploy.sh
```

## Дополнительная помощь

Если проблемы сохраняются:

1. Проверьте логи: `docker compose -f docker-compose.prod.yml logs`
2. Проверьте статус контейнеров: `docker compose -f docker-compose.prod.yml ps`
3. Проверьте версию Docker: `docker --version`
4. Проверьте версию системы: `cat /etc/os-release`

