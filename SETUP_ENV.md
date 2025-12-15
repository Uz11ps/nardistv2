# Настройка .env файла

## Автоматическая генерация .env файла

Выполните на сервере:

```bash
cd /opt/Nardist
chmod +x scripts/generate-env.sh
./scripts/generate-env.sh
```

Скрипт автоматически:
- Сгенерирует безопасные пароли для POSTGRES_PASSWORD и JWT_SECRET
- Создаст .env файл с правильными значениями для production
- Предложит отредактировать файл для заполнения TELEGRAM_BOT_TOKEN и SSL_EMAIL

## Ручное создание .env файла

Если хотите создать вручную:

```bash
cd /opt/Nardist

# Генерируем безопасные пароли
POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-24)
JWT_SECRET=$(openssl rand -base64 48 | tr -d "=+/" | cut -c1-48)

cat > .env << EOF
# Database
POSTGRES_USER=nardist
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=nardist_db

# Backend
JWT_SECRET=${JWT_SECRET}
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

# Отредактируйте файл
nano .env
```

## Обязательные поля для заполнения

После создания .env файла обязательно заполните:

1. **TELEGRAM_BOT_TOKEN** - токен вашего Telegram бота (получите у @BotFather)
2. **SSL_EMAIL** - ваш email для получения SSL сертификата Let's Encrypt

## Проверка .env файла

```bash
# Проверьте, что все переменные установлены
cd /opt/Nardist
source .env
echo "POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:0:10}..."
echo "JWT_SECRET: ${JWT_SECRET:0:10}..."
echo "DOMAIN_NAME: $DOMAIN_NAME"
echo "SSL_EMAIL: $SSL_EMAIL"
```

