# Чеклист после успешного CI/CD деплоя

## ✅ Что уже сделано:

1. ✅ CI/CD настроен и работает
2. ✅ Docker образы собираются и пушатся в GitHub Container Registry
3. ✅ Автоматический деплой на сервер настроен

## 🔍 Проверка текущего состояния

### 1. Проверьте образы в GitHub Container Registry

Перейдите и убедитесь, что образы опубликованы:
- Backend: `https://github.com/Uz11ps/Nardist/pkgs/container/nardist-backend`
- Frontend: `https://github.com/Uz11ps/Nardist/pkgs/container/nardist-frontend`

### 2. Проверьте статус контейнеров на сервере

Подключитесь к серверу и выполните:

```bash
ssh root@nardist.online
cd /opt/Nardist

# Проверьте статус контейнеров
docker compose -f docker-compose.prod.yml ps

# Проверьте логи
docker compose -f docker-compose.prod.yml logs --tail=50
```

### 3. Проверьте доступность приложения

Откройте в браузере:
- `https://nardist.online` - должен открыться frontend
- `https://nardist.online/api/health` - должен вернуть статус backend (если есть такой endpoint)

## 📋 Следующие шаги

### Шаг 1: Настройка переменных окружения на сервере

Убедитесь, что файл `.env` на сервере заполнен правильно:

```bash
cd /opt/Nardist
nano .env
```

Проверьте следующие переменные:

```env
# Database
POSTGRES_USER=nardist
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=nardist_db

# Backend
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
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

# Docker Images (для использования готовых образов)
BACKEND_IMAGE=ghcr.io/uz11ps/nardist-backend:latest
FRONTEND_IMAGE=ghcr.io/uz11ps/nardist-frontend:latest
```

### Шаг 2: Настройка SSL сертификата (если еще не настроен)

Если SSL сертификат еще не получен:

```bash
cd /opt/Nardist

# Убедитесь, что домен указывает на сервер
# Затем получите сертификат
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email your-email@example.com \
    --agree-tos \
    --no-eff-email \
    -d nardist.online \
    -d www.nardist.online

# Перезапустите nginx
docker compose -f docker-compose.prod.yml restart nginx
```

### Шаг 3: Применение миграций базы данных

```bash
cd /opt/Nardist
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

### Шаг 4: Проверка работы приложения

1. **Проверьте логи backend:**
   ```bash
   docker compose -f docker-compose.prod.yml logs -f backend
   ```

2. **Проверьте логи frontend:**
   ```bash
   docker compose -f docker-compose.prod.yml logs -f frontend
   ```

3. **Проверьте логи nginx:**
   ```bash
   docker compose -f docker-compose.prod.yml logs -f nginx
   ```

4. **Проверьте подключение к базе данных:**
   ```bash
   docker compose -f docker-compose.prod.yml exec backend npx prisma studio
   # Или просто проверьте подключение:
   docker compose -f docker-compose.prod.yml exec backend node -e "console.log('DB check')"
   ```

### Шаг 5: Настройка автоматического обновления SSL

Добавьте в crontab для автоматического обновления SSL сертификатов:

```bash
crontab -e

# Добавьте строку:
0 0 1 * * cd /opt/Nardist && docker compose -f docker-compose.prod.yml run --rm certbot renew && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## 🚀 Автоматические обновления

Теперь каждый раз, когда вы делаете `git push origin main`, автоматически:

1. ✅ Собираются новые Docker образы
2. ✅ Образы пушатся в GitHub Container Registry
3. ✅ Код обновляется на сервере
4. ✅ Образы скачиваются из registry
5. ✅ Контейнеры перезапускаются с новыми образами
6. ✅ Применяются миграции базы данных

## 🔧 Полезные команды для управления

### Перезапуск всех сервисов:
```bash
cd /opt/Nardist
docker compose -f docker-compose.prod.yml restart
```

### Остановка всех сервисов:
```bash
docker compose -f docker-compose.prod.yml down
```

### Запуск всех сервисов:
```bash
docker compose -f docker-compose.prod.yml up -d
```

### Просмотр использования ресурсов:
```bash
docker stats
```

### Очистка неиспользуемых образов:
```bash
docker system prune -a
```

## 📊 Мониторинг

### Проверка здоровья сервисов:
```bash
# Проверка статуса
docker compose -f docker-compose.prod.yml ps

# Проверка использования диска
df -h

# Проверка использования памяти
free -h

# Проверка логов ошибок
docker compose -f docker-compose.prod.yml logs | grep -i error
```

## 🐛 Устранение проблем

### Если приложение не работает:

1. **Проверьте логи:**
   ```bash
   docker compose -f docker-compose.prod.yml logs
   ```

2. **Проверьте статус контейнеров:**
   ```bash
   docker compose -f docker-compose.prod.yml ps
   ```

3. **Перезапустите контейнеры:**
   ```bash
   docker compose -f docker-compose.prod.yml restart
   ```

4. **Проверьте переменные окружения:**
   ```bash
   docker compose -f docker-compose.prod.yml exec backend env | grep -E "(DATABASE|JWT|TELEGRAM)"
   ```

### Если SSL не работает:

1. Проверьте, что домен указывает на сервер:
   ```bash
   nslookup nardist.online
   ```

2. Проверьте, что порты 80 и 443 открыты:
   ```bash
   ufw status
   ```

3. Перезапустите nginx:
   ```bash
   docker compose -f docker-compose.prod.yml restart nginx
   ```

## ✅ Готово!

После выполнения всех шагов ваше приложение должно быть полностью развернуто и работать на `https://nardist.online`.

