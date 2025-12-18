# Быстрое исправление проблемы с правами Docker

## Проблема
```
permission denied: cannot stop container
```

## Быстрое решение (выполните на сервере)

```bash
cd /opt/Nardist

# 1. Остановите все контейнеры через sudo
sudo docker compose -f docker-compose.prod.yml down

# 2. Проверьте .env файл (должен содержать все переменные)
cat .env

# 3. Если переменные отсутствуют, создайте файл вручную:
nano .env
# Добавьте все переменные (см. CREATE_ENV_ON_SERVER.md)

# 4. Запустите контейнеры заново
sudo docker compose -f docker-compose.prod.yml up -d

# 5. Проверьте статус
sudo docker compose -f docker-compose.prod.yml ps
```

## Постоянное решение (чтобы не использовать sudo каждый раз)

```bash
# Добавьте пользователя в группу docker
sudo usermod -aG docker $USER

# Примените изменения
newgrp docker

# Проверьте
docker ps  # Теперь должно работать без sudo
```

## Если .env файл отсутствует или пустой

Выполните на сервере:

```bash
cd /opt/Nardist

cat > .env << 'EOF'
# Database
POSTGRES_USER=nardist
POSTGRES_PASSWORD=ваш_безопасный_пароль_минимум_16_символов
POSTGRES_DB=nardist_db

# Backend
JWT_SECRET=ваш_jwt_секрет_минимум_32_символа
TELEGRAM_BOT_TOKEN=ваш_токен_от_BotFather
NODE_ENV=production
PORT=3000

# Frontend
VITE_API_URL=https://nardist.online
VITE_WS_URL=https://nardist.online
FRONTEND_URL=https://nardist.online

# Domain
DOMAIN_NAME=nardist.online
SSL_EMAIL=ваш_email@example.com

# Docker Images
BACKEND_IMAGE=ghcr.io/uz11ps/nardist-backend:latest
FRONTEND_IMAGE=ghcr.io/uz11ps/nardist-frontend:latest
EOF

# Установите безопасные права
chmod 600 .env
```

**Важно:** Замените `ваш_безопасный_пароль`, `ваш_jwt_секрет`, `ваш_токен_от_BotFather`, `ваш_email@example.com` на реальные значения!

## Генерация безопасных паролей

```bash
# POSTGRES_PASSWORD (24 символа)
openssl rand -base64 24 | tr -d "=+/" | cut -c1-24

# JWT_SECRET (48 символов)
openssl rand -base64 48 | tr -d "=+/" | cut -c1-48
```

