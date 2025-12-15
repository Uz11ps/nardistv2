# Исправление проблемы с получением SSL сертификата

## Проблема

Let's Encrypt не может подключиться к порту 80:
```
Connection refused
```

Это означает, что порт 80 заблокирован firewall или не открыт для внешних подключений.

## Решение

### Шаг 1: Проверьте и откройте порты в firewall

```bash
# Проверьте статус firewall
sudo ufw status

# Если firewall активен, откройте порты 80 и 443
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Или если используете iptables
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
sudo iptables-save
```

### Шаг 2: Проверьте, что домен указывает на правильный IP

```bash
# Узнайте IP вашего сервера
curl ifconfig.me
# или
hostname -I

# Проверьте DNS записи
nslookup nardist.online
dig nardist.online

# Должен вернуться IP вашего сервера
```

### Шаг 3: Убедитесь, что порт 80 слушается

```bash
# Проверьте, что порт 80 открыт
sudo netstat -tulpn | grep :80
# или
sudo ss -tulpn | grep :80

# Должен быть виден процесс, слушающий порт 80
```

### Шаг 4: Используйте webroot метод вместо standalone

Standalone требует остановки nginx. Лучше использовать webroot:

```bash
cd /opt/Nardist

# Убедитесь, что nginx запущен
docker compose -f docker-compose.prod.yml up -d nginx

# Создайте директорию для certbot
docker compose -f docker-compose.prod.yml exec nginx mkdir -p /var/www/certbot

# Получите сертификат через webroot (nginx должен быть запущен)
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email vvlad1001@gmail.com \
    --agree-tos \
    --no-eff-email \
    -d nardist.online \
    -d www.nardist.online

# Перезапустите nginx
docker compose -f docker-compose.prod.yml restart nginx
```

### Шаг 5: Проверьте доступность порта 80 извне

```bash
# С другого компьютера или используя онлайн сервис:
# https://www.yougetsignal.com/tools/open-ports/
# Введите IP вашего сервера и порт 80

# Или локально проверьте:
curl -I http://nardist.online
```

## Альтернатива: Использование Cloudflare или другого прокси

Если у вас проблемы с firewall, можно использовать Cloudflare для получения SSL сертификата или использовать их прокси.

## После открытия портов

После открытия портов 80 и 443 повторите попытку получения сертификата.

