# Инструкция по развертыванию Telegram Mini App «Нарды»

## Требования

- Node.js 18+
- Docker и Docker Compose
- PostgreSQL 15+
- Redis 7+
- Telegram Bot Token (от @BotFather)

## Подготовка

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd Nardist
```

### 2. Настройка переменных окружения

#### Backend (.env)

Создайте файл `backend/.env`:

```env
# Database
DATABASE_URL="postgresql://nardist:nardist_password@postgres:5432/nardist_db?schema=public"

# Redis
REDIS_URL="redis://redis:6379"

# JWT
JWT_SECRET="your-secret-key-change-in-production-min-32-chars"
JWT_EXPIRES_IN="7d"

# Telegram Bot
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"
TELEGRAM_BOT_SECRET="your-telegram-bot-secret"

# Server
PORT=3000
NODE_ENV=production

# CORS
FRONTEND_URL="https://your-domain.com"
```

#### Frontend (.env.local)

Создайте файл `frontend/.env.local`:

```env
VITE_API_URL=https://api.your-domain.com
VITE_WS_URL=wss://api.your-domain.com
```

## Развертывание через Docker Compose

### 1. Запуск всех сервисов

```bash
docker-compose up -d
```

### 2. Выполнение миграций базы данных

```bash
cd backend
npm install
npx prisma migrate deploy
npx prisma generate
```

### 3. Проверка статуса

```bash
docker-compose ps
```

## Ручное развертывание

### Backend

1. Установка зависимостей:
```bash
cd backend
npm install
```

2. Настройка базы данных:
```bash
npx prisma migrate deploy
npx prisma generate
```

3. Запуск:
```bash
npm run build
npm run start:prod
```

### Frontend

1. Установка зависимостей:
```bash
cd frontend
npm install
```

2. Сборка:
```bash
npm run build
```

3. Размещение файлов из `dist/` на веб-сервере (Nginx/Apache)

## Настройка Telegram Bot

1. Создайте бота через [@BotFather](https://t.me/BotFather)
2. Получите токен бота
3. Настройте Web App:
   - Используйте команду `/newapp` в @BotFather
   - Укажите URL вашего фронтенда
   - Укажите название и описание приложения

4. Добавьте токен в `backend/.env`:
```env
TELEGRAM_BOT_TOKEN="your-bot-token"
```

## Настройка Nginx (для production)

Пример конфигурации `/etc/nginx/sites-available/nardist`:

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Frontend
    location / {
        root /var/www/nardist/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

## SSL сертификат (HTTPS)

Используйте Let's Encrypt:

```bash
sudo certbot --nginx -d your-domain.com
```

## Мониторинг

### Логи

```bash
# Все сервисы
docker-compose logs -f

# Только backend
docker-compose logs -f backend

# Только frontend
docker-compose logs -f frontend
```

### База данных

```bash
# Prisma Studio
cd backend
npx prisma studio
```

## Обновление

1. Остановите сервисы:
```bash
docker-compose down
```

2. Обновите код:
```bash
git pull
```

3. Пересоберите образы:
```bash
docker-compose build
```

4. Запустите миграции (если есть):
```bash
cd backend
npx prisma migrate deploy
```

5. Запустите сервисы:
```bash
docker-compose up -d
```

## Резервное копирование

### База данных

```bash
docker-compose exec postgres pg_dump -U nardist nardist_db > backup.sql
```

### Восстановление

```bash
docker-compose exec -T postgres psql -U nardist nardist_db < backup.sql
```

## Устранение неполадок

### Backend не запускается

1. Проверьте логи: `docker-compose logs backend`
2. Проверьте переменные окружения
3. Убедитесь, что база данных доступна

### Frontend не подключается к API

1. Проверьте `VITE_API_URL` в `.env.local`
2. Проверьте CORS настройки в backend
3. Убедитесь, что backend запущен

### WebSocket не работает

1. Проверьте настройки прокси в Nginx
2. Убедитесь, что порт 3000 открыт
3. Проверьте логи WebSocket: `docker-compose logs backend`

