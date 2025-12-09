# Backend - Telegram Mini App «Нарды»

NestJS серверное приложение для мини-приложения «Нарды».

## Технологии

- NestJS
- Prisma (ORM)
- PostgreSQL
- Redis
- Socket.IO (WebSocket)
- JWT для аутентификации

## Установка

```bash
npm install
```

## Настройка базы данных

1. Скопируйте `.env.example` в `.env` и заполните переменные окружения
2. Запустите миграции:

```bash
npm run prisma:migrate
```

3. Сгенерируйте Prisma Client:

```bash
npm run prisma:generate
```

## Запуск

### Разработка

```bash
npm run start:dev
```

### Production

```bash
npm run build
npm run start:prod
```

## Структура проекта

```
src/
├── main.ts                 # Точка входа
├── app.module.ts          # Корневой модуль
├── auth/                  # Аутентификация
├── users/                 # Пользователи
├── games/                 # Игровая логика
├── tournaments/           # Турниры
├── ratings/               # Рейтинги
├── referrals/             # Рефералы
├── quests/                # Квесты
├── city/                  # Город и пассивный доход
├── subscription/          # Подписка
├── academy/               # Академия/обучение
├── admin/                 # Админ-панель
└── common/                # Общие модули
```

