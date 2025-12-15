# Быстрый старт для развертывания

## Шаг 1: Подготовка сервера

```bash
# На сервере выполните:
curl -fsSL https://raw.githubusercontent.com/yourusername/nardist/main/scripts/init-server.sh | sudo bash
```

Или вручную:

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## Шаг 2: Клонирование и настройка

```bash
cd /opt
sudo git clone https://github.com/yourusername/nardist.git
cd nardist
sudo chown -R $USER:$USER .

# Создайте .env файл
cp .env.example .env
nano .env  # Заполните все переменные
```

## Шаг 3: Первоначальный запуск (без SSL)

```bash
# Используйте временную HTTP конфигурацию
cp nginx/conf.d/default-http.conf nginx/conf.d/default.conf

# Запустите сервисы
docker-compose -f docker-compose.prod.yml up -d

# Подождите 15 секунд
sleep 15
```

## Шаг 4: Получение SSL сертификата

```bash
# Замените yourdomain.com и email на свои данные
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email your-email@example.com \
    --agree-tos \
    --no-eff-email \
    -d yourdomain.com \
    -d www.yourdomain.com
```

## Шаг 5: Настройка Nginx с SSL

```bash
# Обновите конфигурацию Nginx с вашим доменом
./scripts/setup-nginx-domain.sh yourdomain.com

# Или вручную отредактируйте nginx/conf.d/default.conf
# Замените ${DOMAIN_NAME} на ваш домен

# Перезапустите Nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## Шаг 6: Применение миграций

```bash
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy
```

## Готово! 🎉

Ваше приложение должно быть доступно по адресу: `https://yourdomain.com`

## Настройка CI/CD

1. Добавьте секреты в GitHub (Settings → Secrets):
   - `SERVER_HOST` - IP или домен сервера
   - `SERVER_USER` - пользователь для SSH
   - `SERVER_SSH_KEY` - приватный SSH ключ

2. После каждого push в `main` приложение будет автоматически обновляться.

## Полезные команды

```bash
# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f

# Перезапуск сервисов
docker-compose -f docker-compose.prod.yml restart

# Создание бэкапа БД
./scripts/backup-db.sh

# Обновление SSL сертификата
./scripts/renew-ssl.sh
```

