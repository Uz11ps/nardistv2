# Как создать .env файл на сервере

## Вариант 1: Автоматически через GitHub Actions (Рекомендуется) ✅

Workflow уже настроен для автоматического создания `.env` из GitHub Secrets при деплое.

### Шаги:

1. **Добавьте секреты в GitHub:**
   - Перейдите: `Settings` → `Secrets and variables` → `Actions` → `New repository secret`
   - Добавьте следующие секреты:
     - `POSTGRES_PASSWORD` - пароль для PostgreSQL (минимум 16 символов)
     - `JWT_SECRET` - секретный ключ для JWT (минимум 32 символа)
     - `TELEGRAM_BOT_TOKEN` - токен вашего Telegram бота
     - `SSL_EMAIL` - email для SSL сертификата Let's Encrypt

2. **Запустите деплой:**
   - При первом деплое workflow автоматически создаст `.env` файл на сервере
   - Файл будет создан в `/opt/Nardist/.env`

---

## Вариант 2: Использовать скрипт generate-env.sh

### Шаги:

1. **Подключитесь к серверу по SSH:**
   ```bash
   ssh root@your-server-ip
   ```

2. **Перейдите в директорию проекта:**
   ```bash
   cd /opt/Nardist
   ```

3. **Запустите скрипт генерации:**
   ```bash
   chmod +x scripts/generate-env.sh
   ./scripts/generate-env.sh
   ```

4. **Отредактируйте файл и заполните недостающие значения:**
   ```bash
   nano .env
   ```
   
   Обязательно заполните:
   - `TELEGRAM_BOT_TOKEN` - токен вашего Telegram бота
   - `SSL_EMAIL` - ваш email для SSL сертификата

---

## Вариант 3: Создать вручную через SSH

### Шаги:

1. **Подключитесь к серверу:**
   ```bash
   ssh root@your-server-ip
   ```

2. **Перейдите в директорию проекта:**
   ```bash
   cd /opt/Nardist
   ```

3. **Создайте файл .env:**
   ```bash
   nano .env
   ```

4. **Вставьте следующий шаблон:**
   ```bash
   # Database
   POSTGRES_USER=nardist
   POSTGRES_PASSWORD=your_secure_password_here_change_this
   POSTGRES_DB=nardist_db
   
   # Backend
   JWT_SECRET=your_jwt_secret_key_here_min_32_chars_change_this
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
   
   # Docker Images (optional - for GitHub Container Registry)
   BACKEND_IMAGE=ghcr.io/uz11ps/nardist-backend:latest
   FRONTEND_IMAGE=ghcr.io/uz11ps/nardist-frontend:latest
   ```

5. **Сгенерируйте безопасные пароли:**
   ```bash
   # Генерация POSTGRES_PASSWORD (24 символа)
   openssl rand -base64 24 | tr -d "=+/" | cut -c1-24
   
   # Генерация JWT_SECRET (48 символов)
   openssl rand -base64 48 | tr -d "=+/" | cut -c1-48
   ```

6. **Сохраните файл:**
   - В nano: `Ctrl+O` (сохранить), `Enter` (подтвердить), `Ctrl+X` (выйти)

---

## Вариант 4: Через команду cat (быстрый способ)

```bash
cd /opt/Nardist

cat > .env << 'EOF'
# Database
POSTGRES_USER=nardist
POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-24)
POSTGRES_DB=nardist_db

# Backend
JWT_SECRET=$(openssl rand -base64 48 | tr -d "=+/" | cut -c1-48)
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

# Docker Images
BACKEND_IMAGE=ghcr.io/uz11ps/nardist-backend:latest
FRONTEND_IMAGE=ghcr.io/uz11ps/nardist-frontend:latest
EOF

# Генерируем пароли и заменяем их в файле
POSTGRES_PASS=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-24)
JWT_SEC=$(openssl rand -base64 48 | tr -d "=+/" | cut -c1-48)

sed -i "s/POSTGRES_PASSWORD=.*/POSTGRES_PASSWORD=${POSTGRES_PASS}/" .env
sed -i "s/JWT_SECRET=.*/JWT_SECRET=${JWT_SEC}/" .env

# Отредактируйте файл и заполните недостающие значения
nano .env
```

---

## Проверка созданного файла

После создания `.env` файла проверьте его:

```bash
# Проверьте что файл существует
ls -la .env

# Проверьте содержимое (БЕЗ показа паролей)
cat .env | grep -v PASSWORD | grep -v SECRET | grep -v TOKEN

# Проверьте права доступа (должны быть 600 - только для владельца)
chmod 600 .env
ls -la .env
```

---

## Важные замечания

1. **Безопасность:**
   - Никогда не коммитьте `.env` в Git репозиторий
   - Установите права доступа: `chmod 600 .env`
   - Не делитесь содержимым `.env` файла

2. **Обязательные поля:**
   - `POSTGRES_PASSWORD` - минимум 16 символов
   - `JWT_SECRET` - минимум 32 символа
   - `TELEGRAM_BOT_TOKEN` - токен от @BotFather
   - `SSL_EMAIL` - реальный email для Let's Encrypt

3. **После создания .env:**
   - Перезапустите контейнеры: `docker compose -f docker-compose.prod.yml restart`
   - Или выполните полный деплой через GitHub Actions

---

## Получение Telegram Bot Token

1. Откройте Telegram и найдите [@BotFather](https://t.me/BotFather)
2. Отправьте команду `/newbot`
3. Следуйте инструкциям для создания бота
4. Скопируйте полученный токен в `TELEGRAM_BOT_TOKEN`

---

## Что делать если .env уже существует?

Если `.env` файл уже существует на сервере:
- Workflow **НЕ будет** перезаписывать его автоматически
- Вы можете отредактировать его вручную: `nano /opt/Nardist/.env`
- Или создать резервную копию и пересоздать:
  ```bash
  cp .env .env.backup
  rm .env
  # Затем используйте один из вариантов выше
  ```

