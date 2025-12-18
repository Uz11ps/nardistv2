# Nardist - Telegram Mini App

Telegram Mini App для игры в нарды (короткие и длинные) с полным функционалом MVP.

## Технологический стек

- **Backend**: NestJS, PostgreSQL, Redis, Socket.IO
- **Frontend**: React, TypeScript, Vite, Telegram Web Apps SDK
- **DevOps**: Docker, Docker Compose, Nginx

## Структура проекта

```
├── backend/          # NestJS backend
├── frontend/         # React frontend
├── infra/            # Docker и Nginx конфигурации
└── docker-compose.yml
```

## Быстрый старт

### Локальная разработка

```bash
# Запуск всех сервисов
docker-compose up -d

# Backend будет доступен на http://localhost:3000
# Frontend будет доступен на http://localhost:5173
```

### Деплой на продакшн

См. `infra/deploy.sh` для инструкций по развертыванию на сервере.

## Разработка

### Backend

```bash
cd backend
npm install
npm run start:dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Лицензия

Proprietary
