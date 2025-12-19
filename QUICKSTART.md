# Быстрый запуск

## 1. Настройка окружения

```bash
# Скопируйте .env.example в .env
cp .env.example .env

# Отредактируйте .env и добавьте токен Telegram бота:
# TELEGRAM_BOT_TOKEN=your_bot_token_here
```

## 2. Запуск через Docker Compose

```bash
# Соберите и запустите контейнеры
docker-compose up -d --build

# Установите PHP зависимости
docker-compose exec php composer install

# Сгенерируйте ключ приложения
docker-compose exec php php artisan key:generate

# Выполните миграции
docker-compose exec php php artisan migrate

# Установите Node зависимости и соберите фронтенд
npm install
npm run build
```

## 3. Или используйте Makefile

```bash
make deploy
```

## 4. Проверка работы

Приложение доступно по адресу: `http://localhost`

API endpoints:
- `POST /api/auth/login` - Авторизация
- `GET /api/games` - Список игр
- `POST /api/games` - Создать игру

## 5. Настройка Telegram бота

1. Создайте бота через @BotFather
2. Получите токен бота
3. Добавьте токен в `.env` файл
4. Настройте Mini App в BotFather:
   - `/newapp` - создайте новое приложение
   - Укажите URL вашего сервера (например, `https://yourdomain.com`)

## Структура проекта

- `app/` - Laravel backend
- `src/` - React frontend
- `docker/` - Docker конфигурация
- `database/migrations/` - Миграции БД

## Полезные команды

```bash
# Просмотр логов
docker-compose logs -f

# Выполнение команд в PHP контейнере
docker-compose exec php php artisan [command]

# Перезапуск сервисов
docker-compose restart

# Остановка всех сервисов
docker-compose down
```

