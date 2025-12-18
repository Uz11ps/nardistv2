# Инструкция по деплою Nardist

## Вариант 1: Автоматический деплой (рекомендуется)

Выполните в PowerShell:

```powershell
.\deploy.ps1
```

**Примечание**: Если у вас не установлен `sshpass`, скрипт покажет команды для ручного выполнения.

## Вариант 2: Ручной деплой через SSH

### Шаг 1: Подключитесь к серверу

```bash
ssh root@89.104.65.118
```

Пароль: `9kwQ9fYCh0wArbSh`

### Шаг 2: Выполните команды на сервере

```bash
# Перейдите в директорию проекта
cd /opt/nardist

# Если директория не существует или пуста, клонируйте репозиторий
if [ ! -d ".git" ]; then
    git clone https://github.com/Uz11ps/nardistv2.git .
fi

# Обновите репозиторий если он уже существует
git pull

# Сделайте скрипт исполняемым
chmod +x infra/deploy.sh

# Запустите деплой
./infra/deploy.sh
```

### Шаг 3: Введите токен Telegram бота

Скрипт запросит токен Telegram бота. Получите его у [@BotFather](https://t.me/BotFather) в Telegram.

## Вариант 3: Деплой с предустановленным токеном

Если вы хотите установить токен заранее:

```bash
ssh root@89.104.65.118

cd /opt/nardist
git clone https://github.com/Uz11ps/nardistv2.git . || git pull

# Установите токен как переменную окружения
export TELEGRAM_BOT_TOKEN="ваш_токен_бота"

# Запустите деплой
chmod +x infra/deploy.sh
./infra/deploy.sh
```

## Проверка статуса после деплоя

После завершения деплоя проверьте статус контейнеров:

```bash
ssh root@89.104.65.118
cd /opt/nardist
docker-compose -f infra/docker-compose.prod.yml ps
```

Проверьте логи:

```bash
docker-compose -f infra/docker-compose.prod.yml logs -f
```

## Доступ к приложению

После успешного деплоя приложение будет доступно по адресам:

- **Frontend**: https://nardist.online
- **API**: https://nardist.online/api
- **WebSocket**: wss://nardist.online/socket.io/

## Устранение проблем

### Если контейнеры не запускаются:

```bash
# Проверьте логи
docker-compose -f infra/docker-compose.prod.yml logs

# Перезапустите контейнеры
docker-compose -f infra/docker-compose.prod.yml restart

# Пересоберите и перезапустите
docker-compose -f infra/docker-compose.prod.yml up -d --build
```

### Если SSL сертификат не получен:

```bash
# Получите сертификат вручную
certbot certonly --standalone -d nardist.online --non-interactive --agree-tos --email admin@nardist.online

# Перезапустите nginx
docker-compose -f infra/docker-compose.prod.yml restart nginx
```

### Если база данных не работает:

```bash
# Проверьте подключение к БД
docker-compose -f infra/docker-compose.prod.yml exec backend npx prisma migrate status

# Выполните миграции вручную
docker-compose -f infra/docker-compose.prod.yml exec backend npx prisma migrate deploy
```

## Обновление приложения

Для обновления кода:

```bash
ssh root@89.104.65.118
cd /opt/nardist
git pull
docker-compose -f infra/docker-compose.prod.yml up -d --build
```
