# Устранение проблем с SSH подключением в CI/CD

## Проблема: SSH timeout

Если вы видите ошибку:
```
dial tcp ***:22: i/o timeout
```

Это означает, что GitHub Actions не может подключиться к серверу по SSH.

## Решения

### 1. Проверьте доступность сервера

```bash
# С вашего компьютера проверьте SSH подключение
ssh -v root@nardist.online

# Или с IP адреса
ssh -v root@89.104.65.118
```

### 2. Проверьте firewall на сервере

```bash
# На сервере проверьте, что порт 22 открыт
sudo ufw status
sudo ufw allow 22/tcp

# Или для iptables
sudo iptables -L -n | grep 22
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
```

### 3. Проверьте Security Groups (если используете облачный сервис)

Если используете AWS, GCP, Azure, DigitalOcean и т.д.:

- **AWS**: Проверьте Security Groups - порт 22 должен быть открыт для 0.0.0.0/0 или для IP GitHub Actions
- **GCP**: Проверьте Firewall Rules
- **Azure**: Проверьте Network Security Groups
- **DigitalOcean**: Проверьте Cloud Firewalls

### 4. Проверьте SSH сервис на сервере

```bash
# Проверьте статус SSH
sudo systemctl status ssh
# или
sudo systemctl status sshd

# Убедитесь, что SSH запущен
sudo systemctl start ssh
sudo systemctl enable ssh
```

### 5. Проверьте SSH ключ в GitHub Secrets

1. Перейдите: `https://github.com/Uz11ps/Nardist/settings/secrets/actions`
2. Проверьте секрет `SERVER_SSH_KEY`
3. Убедитесь, что ключ правильный (включая `-----BEGIN` и `-----END`)

### 6. Проверьте формат SSH ключа

SSH ключ должен быть в формате OpenSSH:

```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

Или в старом формате:

```
-----BEGIN RSA PRIVATE KEY-----
...
-----END RSA PRIVATE KEY-----
```

### 7. Проверьте, что публичный ключ добавлен на сервер

```bash
# На сервере проверьте authorized_keys
cat ~/.ssh/authorized_keys

# Должен быть публичный ключ, соответствующий приватному ключу в GitHub Secrets
```

### 8. Альтернатива: Используйте пароль вместо ключа (не рекомендуется)

Если ключ не работает, можно временно использовать пароль:

1. Добавьте секрет `SERVER_PASSWORD` в GitHub
2. Измените workflow на использование пароля вместо ключа

Но это небезопасно, лучше исправить проблему с ключом.

### 9. Проверьте логи SSH на сервере

```bash
# Проверьте логи SSH для отладки
sudo tail -f /var/log/auth.log
# или
sudo journalctl -u ssh -f

# Попробуйте подключиться с GitHub Actions и посмотрите логи
```

### 10. Временное решение: Ручной деплой

Если SSH не работает, можно временно деплоить вручную:

```bash
cd /opt/Nardist
git pull origin main
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

## Проверка после исправления

После исправления проблем проверьте подключение:

```bash
# С вашего компьютера
ssh -i ~/.ssh/github_actions root@nardist.online

# Если подключение работает, значит проблема была в настройках GitHub Actions
```

## Рекомендации

1. **Всегда используйте SSH ключи**, а не пароли
2. **Ограничьте доступ** - разрешите SSH только с определенных IP (если возможно)
3. **Используйте fail2ban** для защиты от брутфорса
4. **Регулярно обновляйте** SSH сервер

