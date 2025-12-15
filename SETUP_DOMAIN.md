# Настройка домена nardist.online

## Быстрая настройка

После клонирования репозитория и настройки `.env` файла выполните:

```bash
# 1. Запустите сервисы с временной HTTP конфигурацией
cp nginx/conf.d/default-http.conf nginx/conf.d/default.conf
docker-compose -f docker-compose.prod.yml up -d

# 2. Подождите 15 секунд для запуска сервисов
sleep 15

# 3. Получите SSL сертификат (замените email на свой)
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email your-email@example.com \
    --agree-tos \
    --no-eff-email \
    -d nardist.online \
    -d www.nardist.online

# 4. Настройте Nginx с SSL
./scripts/setup-nginx-domain.sh nardist.online

# 5. Перезапустите Nginx
docker-compose -f docker-compose.prod.yml restart nginx

# 6. Примените миграции БД
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy
```

## Настройка DNS

Убедитесь, что DNS записи настроены правильно:

```
A     @              -> IP_вашего_сервера
A     www            -> IP_вашего_сервера
```

## Проверка работы

После настройки проверьте:

1. **HTTP редирект на HTTPS**: `http://nardist.online` должен перенаправлять на `https://nardist.online`
2. **SSL сертификат**: `https://nardist.online` должен открываться без ошибок безопасности
3. **Frontend**: Должна открываться главная страница приложения
4. **API**: `https://nardist.online/api/health` (если есть такой endpoint)
5. **WebSocket**: Должен работать через `wss://nardist.online/socket.io`

## Переменные окружения для production

В файле `.env` должны быть установлены:

```env
DOMAIN_NAME=nardist.online
FRONTEND_URL=https://nardist.online
VITE_API_URL=https://nardist.online
VITE_WS_URL=https://nardist.online
SSL_EMAIL=your-email@example.com
```

## Обновление SSL сертификата

SSL сертификаты Let's Encrypt действительны 90 дней. Для автоматического обновления:

```bash
# Добавьте в crontab
crontab -e

# Добавьте строку:
0 0 1 * * cd /opt/Nardist && docker-compose -f docker-compose.prod.yml run --rm certbot renew && docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

Или используйте скрипт:

```bash
./scripts/renew-ssl.sh
```

