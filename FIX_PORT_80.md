# Решение проблемы с занятым портом 80

## Проблема
```
Error: failed to bind host port 0.0.0.0:80/tcp: address already in use
```

## Решение

### 1. Проверьте, что использует порт 80

```bash
# Проверка процессов на порту 80
sudo lsof -i :80
# или
sudo netstat -tulpn | grep :80
# или
sudo ss -tulpn | grep :80
```

### 2. Варианты решения

#### Вариант A: Остановить системный nginx/apache (если установлен)

```bash
# Если это системный nginx
sudo systemctl stop nginx
sudo systemctl disable nginx  # отключить автозапуск

# Если это apache
sudo systemctl stop apache2
sudo systemctl disable apache2

# Если это другой веб-сервер
sudo systemctl list-units --type=service | grep -E 'nginx|apache|httpd'
```

#### Вариант B: Остановить другие Docker контейнеры на порту 80

```bash
# Проверить все контейнеры
docker ps -a

# Остановить контейнер, использующий порт 80
docker stop <container_id>
docker rm <container_id>

# Или остановить все контейнеры
docker stop $(docker ps -q)
```

#### Вариант C: Остановить старый контейнер nardist_nginx_prod

```bash
# Проверить существующие контейнеры
docker ps -a | grep nginx

# Остановить и удалить старый контейнер
docker stop nardist_nginx_prod
docker rm nardist_nginx_prod

# Или через docker-compose
cd /opt/Nardist
docker compose -f docker-compose.prod.yml down
```

### 3. После освобождения порта - запустить заново

```bash
cd /opt/Nardist
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml logs -f
```

### 4. Если нужно временно использовать другой порт (НЕ рекомендуется для production)

Можно изменить в `docker-compose.prod.yml`:
```yaml
nginx:
  ports:
    - "8080:80"  # временно использовать 8080 вместо 80
    - "443:443"
```

Но это потребует изменения DNS/прокси настройки.
