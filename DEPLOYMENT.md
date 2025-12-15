# Руководство по развертыванию

## Требования

- Сервер с Ubuntu 20.04+ или Debian 11+
- Docker и Docker Compose установлены
- Домен настроен и указывает на IP сервера
- SSH доступ к серверу

## Подготовка сервера

### 1. Установка Docker и Docker Compose

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Добавление пользователя в группу docker
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Клонирование репозитория

```bash
cd /opt
sudo git clone https://github.com/Uz11ps/Nardist.git
cd Nardist
sudo chown -R $USER:$USER .
```

## Настройка окружения

### 1. Создание файла .env

```bash
cp .env.example .env
nano .env
```

Заполните все необходимые переменные:

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
VITE_API_URL=https://api.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Domain
DOMAIN_NAME=yourdomain.com
SSL_EMAIL=your-email@example.com
```

### 2. Генерация секретных ключей

```bash
# Генерация JWT_SECRET (32+ символов)
openssl rand -base64 32

# Генерация пароля для базы данных
openssl rand -base64 24
```

## Первоначальное развертывание

### 1. Запуск без SSL (для получения сертификата)

```bash
# Используем временную конфигурацию Nginx
cp nginx/conf.d/default-http.conf nginx/conf.d/default.conf

# Запуск сервисов
docker-compose -f docker-compose.prod.yml up -d

# Ожидание готовности сервисов
sleep 15
```

### 2. Получение SSL сертификата

```bash
# Запуск certbot для получения сертификата
docker-compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email your-email@example.com \
    --agree-tos \
    --no-eff-email \
    -d yourdomain.com \
    -d www.yourdomain.com
```

### 3. Настройка Nginx с SSL

```bash
# Замена временной конфигурации на SSL
cp nginx/conf.d/default.conf nginx/conf.d/default.conf.old
# Обновите nginx/conf.d/default.conf с вашим доменом
# Или используйте скрипт:
./scripts/setup-ssl.sh yourdomain.com your-email@example.com

# Перезапуск Nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### 4. Запуск миграций базы данных

```bash
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

## Настройка CI/CD с GitHub Actions

### 1. Настройка секретов в GitHub

Перейдите в Settings → Secrets and variables → Actions и добавьте:

- `SERVER_HOST` - IP адрес или домен вашего сервера
- `SERVER_USER` - имя пользователя для SSH (обычно `root` или ваш пользователь)
- `SERVER_SSH_KEY` - приватный SSH ключ для доступа к серверу

### 2. Генерация SSH ключа

```bash
# На сервере
ssh-keygen -t ed25519 -C "github-actions"
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys

# Скопируйте приватный ключ (~/.ssh/id_ed25519) в GitHub Secrets как SERVER_SSH_KEY
```

### 3. Настройка автоматического деплоя

После настройки секретов, каждый push в ветку `main` или `master` будет автоматически развертывать приложение.

## Ручной деплой

```bash
# Использование скрипта деплоя
chmod +x deploy.sh
./deploy.sh
```

Или вручную:

```bash
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy
```

## Резервное копирование

### Создание бэкапа базы данных

```bash
chmod +x scripts/backup-db.sh
./scripts/backup-db.sh
```

Бэкапы сохраняются в директории `./backups/`

### Восстановление из бэкапа

```bash
chmod +x scripts/restore-db.sh
./scripts/restore-db.sh backups/nardist_db_20241211_120000.sql
```

## Обновление SSL сертификата

SSL сертификаты Let's Encrypt действительны 90 дней. Для автоматического обновления добавьте в crontab:

```bash
# Редактирование crontab
crontab -e

# Добавление задачи обновления (каждый месяц)
0 0 1 * * cd /opt/Nardist && docker-compose -f docker-compose.prod.yml run --rm certbot renew && docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
```

## Мониторинг и логи

### Просмотр логов

```bash
# Все сервисы
docker-compose -f docker-compose.prod.yml logs -f

# Конкретный сервис
docker-compose -f docker-compose.prod.yml logs -f backend
docker-compose -f docker-compose.prod.yml logs -f frontend
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### Проверка статуса

```bash
docker-compose -f docker-compose.prod.yml ps
```

## Обновление приложения

### Автоматическое (через CI/CD)

Просто сделайте push в ветку `main` или `master`.

### Ручное обновление

```bash
# Обновление кода
git pull origin main

# Пересборка и перезапуск
docker-compose -f docker-compose.prod.yml up -d --build

# Применение миграций (если есть)
docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy
```

## Устранение неполадок

### Проблемы с SSL

```bash
# Проверка сертификата
docker-compose -f docker-compose.prod.yml exec nginx ls -la /etc/letsencrypt/live/

# Перезапуск Nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

### Проблемы с базой данных

```bash
# Проверка подключения
docker-compose -f docker-compose.prod.yml exec postgres psql -U nardist -d nardist_db -c "SELECT 1;"

# Просмотр логов
docker-compose -f docker-compose.prod.yml logs postgres
```

### Проблемы с бэкендом

```bash
# Перезапуск бэкенда
docker-compose -f docker-compose.prod.yml restart backend

# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f backend
```

## Безопасность

1. **Измените все пароли по умолчанию** в `.env`
2. **Используйте сильные пароли** (минимум 32 символа для JWT_SECRET)
3. **Ограничьте доступ к серверу** через firewall:
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```
4. **Регулярно обновляйте систему и Docker**
5. **Настройте автоматические бэкапы базы данных**

## Производительность

### Оптимизация Nginx

Настройки уже включены в `nginx/nginx.conf`:
- Gzip сжатие
- Кэширование статических файлов
- HTTP/2 поддержка

### Оптимизация Docker

```bash
# Очистка неиспользуемых ресурсов
docker system prune -a

# Просмотр использования ресурсов
docker stats
```

## Поддержка

При возникновении проблем проверьте:
1. Логи сервисов
2. Статус контейнеров
3. Настройки firewall
4. DNS записи домена

