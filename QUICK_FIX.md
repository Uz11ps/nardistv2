# Быстрое исправление проблем

## Проблема: Переменные окружения не загружаются

Если видите предупреждения `WARN[0000] The "POSTGRES_PASSWORD" variable is not set`:

1. Убедитесь, что файл `.env` существует и заполнен:

```bash
cd /opt/Nardist
cat .env  # Проверьте содержимое
```

2. Если файл пустой или не существует, создайте его:

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

nano .env  # Отредактируйте и заполните все переменные
```

## Проблема: Образы не найдены

Если видите ошибку `pull access denied for nardist-frontend`:

Это нормально! Образы будут собраны локально. Просто запустите деплой снова:

```bash
cd /opt/Nardist
./deploy.sh
```

Скрипт теперь сначала соберет образы backend и frontend, а затем запустит контейнеры.

## Проверка после деплоя

```bash
# Проверьте статус контейнеров
docker compose -f docker-compose.prod.yml ps

# Проверьте логи
docker compose -f docker-compose.prod.yml logs -f

# Проверьте конкретный сервис
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend
```

