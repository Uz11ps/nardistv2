# Руководство администратора

## Доступ к админ-панели

Админ-панель доступна через API endpoints `/admin/*`. Для доступа требуется JWT токен авторизованного пользователя.

## Управление пользователями

### Получение списка пользователей

```bash
GET /admin/users?page=1&limit=20
```

### Блокировка пользователя

```bash
PUT /admin/users/:id/ban
```

### Разблокировка пользователя

```bash
PUT /admin/users/:id/unban
```

## Управление турнирами

### Создание турнира

```bash
POST /admin/tournaments
Content-Type: application/json

{
  "name": "Название турнира",
  "description": "Описание",
  "mode": "SHORT",
  "format": "BRACKET",
  "startDate": "2025-12-15T10:00:00Z",
  "maxParticipants": 32
}
```

### Запуск турнира

```bash
PUT /admin/tournaments/:id/start
```

### Завершение турнира

```bash
PUT /admin/tournaments/:id/finish
```

## Управление статьями академии

### Получение всех статей

```bash
GET /admin/articles
```

### Создание статьи

```bash
POST /admin/articles
Content-Type: application/json

{
  "title": "Заголовок статьи",
  "content": "Содержание статьи",
  "category": "strategy",
  "isPaid": false,
  "priceCoin": 0
}
```

### Обновление статьи

```bash
PUT /admin/articles/:id
Content-Type: application/json

{
  "title": "Новый заголовок",
  "isPublished": true
}
```

### Удаление статьи

```bash
DELETE /admin/articles/:id
```

## Управление скинами

### Получение всех скинов

```bash
GET /admin/skins
```

### Создание скина

```bash
POST /admin/skins
Content-Type: application/json

{
  "name": "Название скина",
  "type": "BOARD",
  "previewUrl": "https://example.com/preview.png",
  "priceCoin": 100
}
```

## Мониторинг системы

### Проверка статуса базы данных

```bash
docker-compose exec postgres pg_isready -U nardist
```

### Проверка Redis

```bash
docker-compose exec redis redis-cli ping
```

### Просмотр логов

```bash
# Все логи
docker-compose logs -f

# Логи backend
docker-compose logs -f backend

# Последние 100 строк
docker-compose logs --tail=100 backend
```

## Работа с базой данных

### Prisma Studio (GUI)

```bash
cd backend
npx prisma studio
```

Откроется веб-интерфейс на `http://localhost:5555`

### Выполнение SQL запросов

```bash
docker-compose exec postgres psql -U nardist nardist_db
```

### Создание миграции

```bash
cd backend
npx prisma migrate dev --name migration_name
```

### Применение миграций в production

```bash
cd backend
npx prisma migrate deploy
```

## Резервное копирование

### Экспорт базы данных

```bash
docker-compose exec postgres pg_dump -U nardist nardist_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### Импорт базы данных

```bash
docker-compose exec -T postgres psql -U nardist nardist_db < backup.sql
```

## Обновление приложения

1. Создайте резервную копию базы данных
2. Остановите сервисы: `docker-compose down`
3. Обновите код: `git pull`
4. Примените миграции (если есть): `npx prisma migrate deploy`
5. Пересоберите и запустите: `docker-compose up -d --build`

## Безопасность

### Рекомендации

1. Используйте сильные пароли для базы данных
2. Храните секреты в переменных окружения, не коммитьте их в Git
3. Регулярно обновляйте зависимости: `npm audit fix`
4. Используйте HTTPS для production
5. Настройте rate limiting для API
6. Регулярно создавайте резервные копии

### Проверка безопасности

```bash
# Проверка уязвимостей в зависимостях
cd backend && npm audit
cd ../frontend && npm audit
```

