# Итоговое описание проекта Telegram Mini App «Нарды»

## Обзор проекта

Telegram Mini App «Нарды» - полнофункциональное мини-приложение для игры в нарды (короткие и длинные) с расширенным функционалом: турниры, рейтинги, реферальная система, экономика, город с пассивным доходом, подписка и раздел обучения.

## Реализованный функционал

### Backend (NestJS)

✅ **Аутентификация**
- Авторизация через Telegram initData
- JWT токены для сессий
- Автоматическое создание пользователей

✅ **Игровая логика**
- Короткие нарды (полная реализация правил)
- Длинные нарды (полная реализация правил)
- Валидация ходов
- Серверный RNG для бросков кубиков
- Система Elo рейтинга

✅ **WebSocket**
- Real-time соединение для игры
- Переподключение при разрыве
- Синхронизация состояния игры
- Таймеры ходов

✅ **API модули**
- Профиль пользователя
- Рейтинговая система (Elo)
- Турниры
- Реферальная система
- История игр с реплеями
- Квесты (ежедневные/недельные)
- Город и пассивный доход
- Подписка
- Академия/обучение

✅ **Админ-панель**
- Управление пользователями
- Управление турнирами
- Управление статьями
- Управление скинами

### Frontend (React/Vite)

✅ **Интеграция с Telegram**
- Telegram Web Apps SDK
- Автоматическая авторизация
- Адаптация под мобильные устройства

✅ **Страницы**
- Главная страница
- Страница игры
- Профиль пользователя

✅ **Компоненты**
- Игровое поле (Canvas)
- Навигация
- Интеграция с WebSocket

✅ **State Management**
- Zustand для управления состоянием
- Интеграция с API
- WebSocket сервис

## Структура проекта

```
Nardist/
├── backend/                 # NestJS backend
│   ├── src/
│   │   ├── auth/          # Аутентификация
│   │   ├── users/          # Пользователи
│   │   ├── games/          # Игровая логика
│   │   ├── ratings/        # Рейтинги
│   │   ├── tournaments/    # Турниры
│   │   ├── referrals/      # Рефералы
│   │   ├── game-history/   # История игр
│   │   ├── quests/         # Квесты
│   │   ├── city/           # Город
│   │   ├── subscription/   # Подписка
│   │   ├── academy/        # Академия
│   │   └── admin/          # Админ-панель
│   └── prisma/             # Prisma схема
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/     # Компоненты
│   │   ├── pages/          # Страницы
│   │   ├── services/       # API сервисы
│   │   ├── store/          # State management
│   │   └── hooks/          # React хуки
├── docker-compose.yml       # Docker конфигурация
├── DEPLOYMENT.md           # Инструкция по развертыванию
├── ADMIN_GUIDE.md          # Руководство администратора
└── TESTING_CHECKLIST.md    # Чек-лист тестирования
```

## Технологический стек

### Backend
- **Framework**: NestJS
- **ORM**: Prisma
- **Database**: PostgreSQL
- **Cache**: Redis
- **WebSocket**: Socket.IO
- **Auth**: JWT

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **State**: Zustand
- **HTTP Client**: Axios
- **WebSocket**: Socket.IO Client
- **Telegram SDK**: @twa-dev/sdk

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose

## База данных

Схема Prisma включает следующие модели:
- User (пользователи)
- Rating (рейтинги)
- GameHistory (история игр)
- Tournament (турниры)
- Quest (квесты)
- CityBuilding (здания города)
- Subscription (подписки)
- AcademyArticle (статьи академии)
- Skin (скины)

## API Endpoints

### Аутентификация
- `POST /auth/telegram` - Авторизация через Telegram

### Пользователи
- `GET /users/profile` - Получить профиль
- `PUT /users/profile` - Обновить профиль
- `GET /users/stats` - Статистика

### Игра
- WebSocket namespace `/game`
- `join-room` - Присоединиться к комнате
- `game-action` - Отправить действие

### Рейтинги
- `GET /ratings/leaderboard` - Таблица лидеров

### Турниры
- `GET /tournaments` - Список турниров
- `POST /tournaments/:id/join` - Присоединиться

### Рефералы
- `GET /referrals/stats` - Статистика рефералов
- `POST /referrals/use` - Использовать код

### История игр
- `GET /game-history` - История игр
- `GET /game-history/:id` - Реплей игры

### Квесты
- `GET /quests` - Список квестов
- `POST /quests/progress` - Обновить прогресс

### Город
- `GET /city` - Здания города
- `POST /city/collect` - Собрать доход
- `POST /city/upgrade` - Улучшить здание

### Подписка
- `GET /subscription` - Проверить подписку
- `POST /subscription` - Создать подписку

### Академия
- `GET /academy/articles` - Список статей
- `GET /academy/articles/:id` - Статья

### Админ
- `GET /admin/users` - Список пользователей
- `PUT /admin/users/:id/ban` - Забанить
- `POST /admin/tournaments` - Создать турнир
- `POST /admin/articles` - Создать статью
- `POST /admin/skins` - Создать скин

## Развертывание

Проект готов к развертыванию через Docker Compose. Подробные инструкции в файле `DEPLOYMENT.md`.

### Быстрый старт

1. Настроить переменные окружения
2. Запустить: `docker-compose up -d`
3. Выполнить миграции: `npx prisma migrate deploy`
4. Настроить Telegram Bot

## Документация

- **DEPLOYMENT.md** - Инструкция по развертыванию
- **ADMIN_GUIDE.md** - Руководство администратора
- **TESTING_CHECKLIST.md** - Чек-лист тестирования
- **README.md** - Общая информация о проекте

## Следующие шаги

1. Создание дизайна в Figma (задача design)
2. Тестирование всех модулей
3. Настройка production окружения
4. Оптимизация производительности
5. Добавление дополнительных функций по требованию

## Примечания

- Дизайн в Figma не включен в текущую реализацию (зависит от дизайнера)
- Некоторые функции требуют доработки после тестирования
- Рекомендуется провести нагрузочное тестирование перед production

