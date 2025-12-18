# Исправление проблем с правами доступа Docker

## Проблема: `permission denied` при остановке контейнеров

Эта ошибка возникает когда:
- Контейнеры запущены от одного пользователя (например, root)
- Команды выполняются от другого пользователя
- Пользователь не в группе `docker`

## Решение 1: Использовать sudo (быстрое исправление)

```bash
# Остановить все контейнеры проекта
cd /opt/Nardist
sudo docker compose -f docker-compose.prod.yml down

# Или по отдельности
sudo docker stop nardist_postgres_prod nardist_redis_prod nardist_backend_prod nardist_frontend_prod nardist_nginx_prod
sudo docker rm nardist_postgres_prod nardist_redis_prod nardist_backend_prod nardist_frontend_prod nardist_nginx_prod
```

## Решение 2: Добавить пользователя в группу docker (постоянное решение)

```bash
# Проверьте текущего пользователя
whoami

# Добавьте пользователя в группу docker
sudo usermod -aG docker $USER

# Или для конкретного пользователя (например, root)
sudo usermod -aG docker root

# Примените изменения (перелогиньтесь или выполните)
newgrp docker

# Проверьте что пользователь в группе
groups
```

## Решение 3: Проверить владельца контейнеров

```bash
# Посмотрите кто запустил контейнеры
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}"

# Проверьте владельца Docker socket
ls -la /var/run/docker.sock

# Если нужно, измените права (ОСТОРОЖНО!)
sudo chmod 666 /var/run/docker.sock
# Или лучше добавьте пользователя в группу docker (Решение 2)
```

## Решение 4: Исправить .env файл (если переменные не установлены)

```bash
cd /opt/Nardist

# Проверьте что .env существует
ls -la .env

# Если файл пустой или отсутствует, создайте его
nano .env

# Добавьте все необходимые переменные:
# POSTGRES_PASSWORD=ваш_пароль
# JWT_SECRET=ваш_секрет
# TELEGRAM_BOT_TOKEN=ваш_токен
# SSL_EMAIL=ваш_email
# DOMAIN_NAME=nardist.online
```

## Полное исправление (выполните по порядку)

```bash
cd /opt/Nardist

# 1. Остановите все контейнеры через sudo
sudo docker compose -f docker-compose.prod.yml down

# 2. Проверьте .env файл
cat .env | grep -v PASSWORD | grep -v SECRET | grep -v TOKEN

# 3. Если переменные отсутствуют, создайте/обновите .env
# (см. CREATE_ENV_ON_SERVER.md)

# 4. Добавьте пользователя в группу docker (если еще не добавлен)
sudo usermod -aG docker $USER
newgrp docker

# 5. Проверьте что теперь можно выполнять команды без sudo
docker ps

# 6. Запустите контейнеры заново
docker compose -f docker-compose.prod.yml up -d
```

## Проверка после исправления

```bash
# Проверьте статус контейнеров
docker compose -f docker-compose.prod.yml ps

# Проверьте логи если что-то не работает
docker compose -f docker-compose.prod.yml logs --tail 50

# Проверьте что порты открыты
sudo netstat -tuln | grep -E ':(80|443|3000|5432|6379)'
```

## Если проблема сохраняется

1. **Проверьте что Docker запущен:**
   ```bash
   sudo systemctl status docker
   ```

2. **Перезапустите Docker:**
   ```bash
   sudo systemctl restart docker
   ```

3. **Проверьте логи Docker:**
   ```bash
   sudo journalctl -u docker.service --tail 50
   ```

4. **Убедитесь что пользователь в группе docker:**
   ```bash
   groups | grep docker
   ```
   Если группы нет, выполните `newgrp docker` или перелогиньтесь.

