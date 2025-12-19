# Нарды - Telegram Mini App

MVP приложения для игры в нарды через Telegram Mini App.

## Технологии

- **Backend**: Laravel 10 (PHP 8.2)
- **Frontend**: React + TypeScript + Vite
- **База данных**: PostgreSQL
- **Кэш**: Redis
- **Инфраструктура**: Docker Compose

## Быстрый старт

1. Скопируйте `.env.example` в `.env` и заполните настройки:
```bash
cp .env.example .env
```

2. Установите токен Telegram бота в `.env`:
```
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

3. Запустите контейнеры:
```bash
docker-compose up -d
```

4. Установите зависимости и выполните миграции:
```bash
docker-compose exec php composer install
docker-compose exec php php artisan key:generate
docker-compose exec php php artisan migrate
```

5. Соберите фронтенд:
```bash
npm install
npm run build
```

6. Приложение доступно по адресу `http://localhost`

## API Endpoints

- `POST /api/auth/login` - Авторизация через Telegram initData
- `GET /api/games` - Список игр
- `POST /api/games` - Создать игру
- `GET /api/games/{id}` - Получить состояние игры
- `POST /api/games/{id}/join` - Присоединиться к игре
- `POST /api/games/{id}/roll-dice` - Бросить кости
- `POST /api/games/{id}/move` - Сделать ход

## Структура проекта

```
├── app/
│   ├── Http/
│   │   ├── Controllers/    # API контроллеры
│   │   └── Middleware/     # Middleware для валидации Telegram
│   ├── Models/             # Eloquent модели
│   └── Services/           # Игровая логика
├── database/
│   └── migrations/         # Миграции БД
├── src/                    # React фронтенд
│   ├── components/         # React компоненты
│   └── services/           # API клиент
└── docker/                 # Docker конфигурация
```

## Развертывание

Запустите скрипт деплоя:
```bash
chmod +x deploy.sh
./deploy.sh
```

## Примечания

- Базовая реализация правил нард (полная логика требует доработки)
- WebSocket для реал-тайма будет добавлен в следующей версии
- Требуется настройка Telegram бота и Mini App в BotFather

