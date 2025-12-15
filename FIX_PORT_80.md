# Исправление проблемы с портом 80

## Проблема

Ошибка: `failed to bind host port 0.0.0.0:80/tcp: address already in use`

Это означает, что порт 80 уже занят на сервере (скорее всего системным nginx или другим сервисом).

## Решение

### Вариант 1: Остановить системный nginx (Рекомендуется)

```bash
# Проверьте, что занимает порт 80
sudo lsof -i :80
# или
sudo netstat -tulpn | grep :80

# Остановите системный nginx (если он запущен)
sudo systemctl stop nginx
sudo systemctl disable nginx

# Или если используется другой веб-сервер
sudo systemctl stop apache2  # для Apache
```

### Вариант 2: Удалить существующий контейнер nginx

```bash
cd /opt/Nardist

# Проверьте запущенные контейнеры
docker ps -a | grep nginx

# Остановите и удалите старый контейнер nginx
docker stop nardist_nginx_prod 2>/dev/null || true
docker rm nardist_nginx_prod 2>/dev/null || true

# Перезапустите все контейнеры
docker compose -f docker-compose.prod.yml up -d
```

### Вариант 3: Использовать другой порт (временно)

Если нужно временно использовать другой порт, измените `docker-compose.prod.yml`:

```yaml
nginx:
  ports:
    - "8080:80"  # Вместо "80:80"
    - "443:443"
```

Но это не рекомендуется для production, так как нужно будет обращаться через `http://nardist.online:8080`.

## После исправления

После освобождения порта 80:

```bash
cd /opt/Nardist
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs nginx
```

## Проверка

Убедитесь, что nginx запущен:

```bash
docker compose -f docker-compose.prod.yml ps nginx
```

Должен быть статус `Up`.

