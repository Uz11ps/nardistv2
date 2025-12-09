# Frontend - Telegram Mini App «Нарды»

React клиентское приложение для мини-приложения «Нарды».

## Технологии

- React 18
- TypeScript
- Vite
- Telegram Web Apps SDK
- Socket.IO Client
- Zustand (state management)
- Canvas/WebGL для игрового поля

## Установка

```bash
npm install
```

## Запуск

### Разработка

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5173`

### Production

```bash
npm run build
npm run preview
```

## Структура проекта

```
src/
├── main.tsx              # Точка входа
├── App.tsx               # Корневой компонент
├── components/           # Переиспользуемые компоненты
├── pages/                # Страницы приложения
├── hooks/                # React хуки
├── store/                # Zustand store
├── services/             # API сервисы
├── utils/                # Утилиты
├── types/                # TypeScript типы
└── styles/               # Стили
```

## Переменные окружения

Создайте файл `.env.local`:

```
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

