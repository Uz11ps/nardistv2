# Быстрая настройка HTTP (без SSL)

Если порт 80 заблокирован провайдером или нужно временно запустить без SSL:

## Вариант 1: Использовать другой порт (например, 8080)

```bash
cd /opt/Nardist

# Измените docker-compose.prod.yml
nano docker-compose.prod.yml

# Найдите секцию nginx и измените порты:
#   ports:
#     - "8080:80"  # Вместо "80:80"
#     - "443:443"

# Перезапустите
docker compose -f docker-compose.prod.yml up -d nginx

# Теперь доступно по: http://nardist.online:8080
```

## Вариант 2: Временная HTTP конфигурация без редиректа на HTTPS

```bash
cd /opt/Nardist

# Создайте временную HTTP конфигурацию
cat > nginx/conf.d/default.conf << 'EOF'
# HTTP server - временная конфигурация без SSL
server {
    listen 80;
    server_name nardist.online www.nardist.online;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Frontend
    location / {
        proxy_pass http://frontend:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # WebSocket для игр
    location /socket.io {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }
}
EOF

# Перезапустите nginx
docker compose -f docker-compose.prod.yml restart nginx

# Проверьте логи
docker compose -f docker-compose.prod.yml logs nginx --tail=20
```

## Вариант 3: Проверка firewall провайдера

Если используете облачный сервис (AWS, GCP, Azure, DigitalOcean и т.д.):

1. **AWS**: Проверьте Security Groups - порт 80 должен быть открыт для 0.0.0.0/0
2. **GCP**: Проверьте Firewall Rules
3. **Azure**: Проверьте Network Security Groups
4. **DigitalOcean**: Проверьте Cloud Firewalls

## Проверка работы

```bash
# Проверьте статус контейнеров
docker compose -f docker-compose.prod.yml ps

# Проверьте логи
docker compose -f docker-compose.prod.yml logs nginx
docker compose -f docker-compose.prod.yml logs backend
docker compose -f docker-compose.prod.yml logs frontend

# Проверьте доступность изнутри контейнера
docker compose -f docker-compose.prod.yml exec nginx curl -I http://localhost

# Проверьте доступность с хоста
curl -I http://localhost:80
```

## После исправления firewall

Когда порт 80 будет доступен извне, восстановите HTTPS конфигурацию:

```bash
cd /opt/Nardist
git checkout nginx/conf.d/default.conf
docker compose -f docker-compose.prod.yml restart nginx

# И получите SSL сертификат (после 18:35 UTC)
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email vvlad1001@gmail.com \
    --agree-tos \
    --no-eff-email \
    -d nardist.online \
    -d www.nardist.online
```

