# Telegram Mini App «Нарды»

Мини-приложение для Telegram с игрой в нарды (короткие и длинные), включающее турниры, рейтинги, реферальную систему, экономику и другие функции.

## Структура проекта

Проект организован как монорепозиторий:

- `frontend/` - React/Vite клиентское приложение
- `backend/` - NestJS серверное приложение
- `docker-compose.yml` - конфигурация для локальной разработки

## Технологический стек

### Frontend
- TypeScript
- React + Vite
- Telegram Web Apps SDK
- Canvas/WebGL для игрового поля

### Backend
- Node.js
- NestJS
- Prisma (ORM)
- PostgreSQL
- Redis
- Socket.IO (WebSocket)

### Инфраструктура
- Docker
- Docker Compose

## Быстрый старт

### Требования
- Node.js 18+
- Docker и Docker Compose
- Git

### Установка

1. Клонируйте репозиторий
2. Установите зависимости:
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

3. Настройте переменные окружения (см. `.env.example` в каждой директории)

4. Запустите через Docker Compose:
```bash
docker-compose up -d
```

## Разработка

Подробные инструкции по разработке находятся в соответствующих директориях:
- `backend/README.md`
- `frontend/README.md`

## Лицензия

Проект разработан по договору №_0018_ для ООО «АРКРА».

