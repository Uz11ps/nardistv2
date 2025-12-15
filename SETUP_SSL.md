# Настройка SSL сертификата

## Проблема

При попытке получить SSL сертификат возникает ошибка:
```
/var/www/certbot does not exist or is not a directory
```

## Решение

### Шаг 1: Создайте директорию для certbot

```bash
cd /opt/Nardist

# Создайте директорию на хосте
mkdir -p ./certbot/www

# Убедитесь, что nginx может писать в эту директорию
chmod -R 755 ./certbot
```

### Шаг 2: Обновите docker-compose.prod.yml

Добавьте volume для certbot www:

```yaml
certbot:
  volumes:
    - certbot_data:/etc/letsencrypt
    - ./certbot/www:/var/www/certbot:rw  # Добавьте эту строку
    - ./nginx/conf.d:/etc/nginx/conf.d:ro
```

### Шаг 3: Используйте временную HTTP конфигурацию

Перед получением сертификата используйте HTTP конфигурацию:

```bash
# Создайте временную HTTP конфигурацию
cat > nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name nardist.online www.nardist.online;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$host$request_uri;
    }
}
EOF

# Перезапустите nginx
docker compose -f docker-compose.prod.yml restart nginx
```

### Шаг 4: Получите SSL сертификат

```bash
# Создайте директорию в контейнере nginx
docker compose -f docker-compose.prod.yml exec nginx mkdir -p /var/www/certbot

# Получите сертификат
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email your-email@example.com \
    --agree-tos \
    --no-eff-email \
    -d nardist.online \
    -d www.nardist.online
```

### Шаг 5: Восстановите HTTPS конфигурацию

После успешного получения сертификата:

```bash
cd /opt/Nardist
git checkout nginx/conf.d/default.conf

# Перезапустите nginx
docker compose -f docker-compose.prod.yml restart nginx
```

## Альтернативный способ (проще)

Используйте standalone режим вместо webroot:

```bash
# Остановите nginx временно
docker compose -f docker-compose.prod.yml stop nginx

# Получите сертификат в standalone режиме
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
    --standalone \
    --email your-email@example.com \
    --agree-tos \
    --no-eff-email \
    -d nardist.online \
    -d www.nardist.online

# Запустите nginx обратно
docker compose -f docker-compose.prod.yml start nginx
```

## Проверка

После получения сертификата проверьте:

```bash
# Проверьте наличие сертификата
docker compose -f docker-compose.prod.yml exec nginx ls -la /etc/letsencrypt/live/nardist.online/

# Проверьте логи nginx
docker compose -f docker-compose.prod.yml logs nginx

# Проверьте доступность HTTPS
curl -I https://nardist.online
```

