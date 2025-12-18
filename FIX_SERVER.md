# Команды для исправления на сервере

Выполните эти команды на сервере по порядку:

## 1. Подключитесь к серверу

```bash
ssh root@89.104.65.118
# Пароль: 9kwQ9fYCh0wArbSh
```

## 2. Перейдите в директорию проекта

```bash
cd /opt/Nardist
```

## 3. Остановите и удалите все старые контейнеры

```bash
# Остановить все контейнеры с nardist в имени
sudo docker ps -a --filter "name=nardist" --format "{{.ID}}" | xargs -r sudo docker kill 2>/dev/null || true

# Удалить все контейнеры с nardist в имени
sudo docker ps -a --filter "name=nardist" --format "{{.ID}}" | xargs -r sudo docker rm -f 2>/dev/null || true

# Проверить что все удалено
sudo docker ps -a | grep nardist
```

## 4. Загрузите переменные окружения

```bash
cd /opt/Nardist
set -a
source .env
set +a
```

## 5. Запустите все контейнеры заново

```bash
cd /opt/Nardist

# Определить команду docker compose
if command -v docker &> /dev/null && docker compose version &> /dev/null; then
  DOCKER_COMPOSE="docker compose"
else
  DOCKER_COMPOSE="docker-compose"
fi

# Запустить все контейнеры
sudo $DOCKER_COMPOSE -f docker-compose.prod.yml up -d --force-recreate
```

## 6. Проверьте статус контейнеров

```bash
sudo docker ps
sudo docker compose -f docker-compose.prod.yml ps
```

## 7. Проверьте логи если что-то не работает

```bash
# Логи nginx
sudo docker logs nardist_nginx_prod --tail 50

# Логи backend
sudo docker logs nardist_backend_prod --tail 50

# Логи frontend
sudo docker logs nardist_frontend_prod --tail 50
```

## 8. Если порты все еще заняты

```bash
# Проверить что использует порт 80
sudo lsof -i :80
sudo ss -tlnp | grep :80

# Убить процесс на порту 80 (если не docker)
sudo lsof -ti :80 | xargs sudo kill -9 2>/dev/null || true
```

## Быстрый вариант (все команды одной строкой)

```bash
cd /opt/Nardist && \
sudo docker ps -a --filter "name=nardist" --format "{{.ID}}" | xargs -r sudo docker kill 2>/dev/null || true && \
sudo docker ps -a --filter "name=nardist" --format "{{.ID}}" | xargs -r sudo docker rm -f 2>/dev/null || true && \
sudo docker compose -f docker-compose.prod.yml up -d --force-recreate && \
sudo docker ps
```

## Если docker compose не работает

```bash
# Использовать docker-compose вместо docker compose
cd /opt/Nardist
sudo docker-compose -f docker-compose.prod.yml up -d --force-recreate
```

