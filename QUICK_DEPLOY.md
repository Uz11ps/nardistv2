# Быстрый деплой (если Docker уже установлен)

Если Docker уже установлен на сервере, выполните:

```bash
cd /opt/nardist
git pull
chmod +x infra/deploy.sh

# Пропустите установку Docker в скрипте, установите только недостающие пакеты
apt-get update
apt-get install -y git certbot python3-certbot-nginx

# Запустите деплой
./infra/deploy.sh
```

Или выполните деплой вручную без установки Docker:

```bash
cd /opt/nardist

# Создайте .env файл если его нет
if [ ! -f .env ]; then
    read -p "Enter Telegram Bot Token: " TELEGRAM_BOT_TOKEN
    POSTGRES_PASSWORD=$(openssl rand -hex 16)
    JWT_SECRET=$(openssl rand -hex 32)
    
    cat > .env <<EOF
POSTGRES_USER=nardist
POSTGRES_PASSWORD=$POSTGRES_PASSWORD
POSTGRES_DB=nardist_db
JWT_SECRET=$JWT_SECRET
TELEGRAM_BOT_TOKEN=$TELEGRAM_BOT_TOKEN
EOF
fi

# SSL сертификат
if [ ! -d "/etc/letsencrypt/live/nardist.online" ]; then
    systemctl stop nginx 2>/dev/null || true
    certbot certonly --standalone -d nardist.online --non-interactive --agree-tos --email admin@nardist.online
fi

# Запуск контейнеров
docker compose -f infra/docker-compose.prod.yml up -d --build
```
