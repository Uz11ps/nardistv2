# Быстрый старт для развертывания

## Шаг 1: Подготовка сервера

### Установка Docker и Docker Compose

```bash
# Клонируйте репозиторий (если еще не клонирован)
cd /opt
sudo git clone https://github.com/Uz11ps/Nardist.git
cd Nardist
sudo chown -R $USER:$USER .

# Установите Docker
chmod +x scripts/install-docker.sh
sudo ./scripts/install-docker.sh

# Добавьте пользователя в группу docker (если нужно)
sudo usermod -aG docker $USER
newgrp docker  # Или перелогиньтесь

# Установите Docker Compose
chmod +x scripts/install-docker-compose.sh
sudo ./scripts/install-docker-compose.sh
```

Или используйте скрипт полной инициализации:

```bash
cd /opt/Nardist
chmod +x scripts/init-server.sh
sudo ./scripts/init-server.sh
```

## Шаг 2: Клонирование и настройка

```bash
cd /opt

# Если репозиторий уже существует, обновите его
if [ -d "Nardist" ]; then
    cd Nardist
    git pull origin main || git pull origin master
else
    sudo git clone https://github.com/Uz11ps/Nardist.git
    cd Nardist
    sudo chown -R $USER:$USER .
fi

# Создайте .env файл (если его нет)
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
    else
        # Создайте .env файл вручную
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
    fi
    nano .env  # Заполните все переменные
fi

# Установите Docker Compose (если нужно)
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    chmod +x scripts/install-docker-compose.sh
    ./scripts/install-docker-compose.sh
fi
```

## Шаг 3: Первоначальный запуск (без SSL)

```bash
# Используйте временную HTTP конфигурацию
cp nginx/conf.d/default-http.conf nginx/conf.d/default.conf

# Запустите сервисы
docker-compose -f docker-compose.prod.yml up -d

# Подождите 15 секунд
sleep 15
```

## Шаг 4: Получение SSL сертификата

```bash
# Замените email на свой email
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email your-email@example.com \
    --agree-tos \
    --no-eff-email \
    -d nardist.online \
    -d www.nardist.online
```

## Шаг 5: Настройка Nginx с SSL

```bash
# Обновите конфигурацию Nginx с вашим доменом
./scripts/setup-nginx-domain.sh nardist.online

# Или вручную отредактируйте nginx/conf.d/default.conf
# Замените ${DOMAIN_NAME} на ваш домен

# Перезапустите Nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## Шаг 6: Применение миграций

```bash
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy
```

## Готово! 🎉

Ваше приложение должно быть доступно по адресу: `https://nardist.online`

## Настройка CI/CD

1. Добавьте секреты в GitHub (Settings → Secrets):
   - `SERVER_HOST` - IP или домен сервера
   - `SERVER_USER` - пользователь для SSH
   - `SERVER_SSH_KEY` - приватный SSH ключ

2. После каждого push в `main` приложение будет автоматически обновляться.

## Полезные команды

```bash
# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f

# Перезапуск сервисов
docker-compose -f docker-compose.prod.yml restart

# Создание бэкапа БД
./scripts/backup-db.sh

# Обновление SSL сертификата
./scripts/renew-ssl.sh
```

