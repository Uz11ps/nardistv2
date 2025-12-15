# Настройка CI/CD - Пошаговая инструкция

## Шаг 1: Настройка секретов в GitHub

1. Перейдите в репозиторий: `https://github.com/Uz11ps/Nardist`
2. Откройте **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **New repository secret** и добавьте:

### Секрет 1: SERVER_HOST
- **Name:** `SERVER_HOST`
- **Secret:** `nardist.online` (или IP вашего сервера)

### Секрет 2: SERVER_USER
- **Name:** `SERVER_USER`
- **Secret:** `root` (или ваш пользователь для SSH)

### Секрет 3: SERVER_SSH_KEY
- **Name:** `SERVER_SSH_KEY`
- **Secret:** Приватный SSH ключ (см. инструкцию ниже)

## Шаг 2: Генерация SSH ключа для CI/CD

### На сервере выполните:

```bash
# Генерируем SSH ключ специально для GitHub Actions
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions

# Добавляем публичный ключ в authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# Показываем приватный ключ (скопируйте весь вывод)
cat ~/.ssh/github_actions
```

**Важно:** Скопируйте весь приватный ключ, включая строки:
```
-----BEGIN OPENSSH PRIVATE KEY-----
...
-----END OPENSSH PRIVATE KEY-----
```

Вставьте его в секрет `SERVER_SSH_KEY` в GitHub.

## Шаг 3: Проверка подключения

Проверьте SSH подключение с вашего компьютера:

```bash
ssh -i ~/.ssh/github_actions root@nardist.online
```

Если подключение работает, значит все настроено правильно.

## Шаг 4: Запуск CI/CD

После настройки секретов:

1. **Сделайте любой коммит и push:**

```bash
# На вашем локальном компьютере
cd C:\Users\1\Documents\GitHub\Nardist
git add .
git commit -m "Setup CI/CD"
git push origin main
```

2. **Проверьте выполнение workflow:**

- Перейдите в **Actions** на GitHub
- Вы увидите запущенный workflow "Deploy to Production"
- Дождитесь завершения всех шагов

## Что делает CI/CD:

1. ✅ **Собирает Docker образы** для backend и frontend
2. ✅ **Пушит образы** в GitHub Container Registry (`ghcr.io`)
3. ✅ **Подключается к серверу** по SSH
4. ✅ **Обновляет код** на сервере
5. ✅ **Скачивает готовые образы** из registry
6. ✅ **Запускает контейнеры** с новыми образами
7. ✅ **Применяет миграции** базы данных

## Проверка успешного деплоя

После завершения workflow проверьте:

```bash
# На сервере
cd /opt/Nardist
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f
```

## Автоматический деплой

После первой успешной настройки, каждый push в ветку `main` будет автоматически:
- Собирать новые образы
- Деплоить их на сервер

## Устранение проблем

### Ошибка: "Permission denied (publickey)"

**Решение:**
- Убедитесь, что публичный ключ добавлен в `~/.ssh/authorized_keys`
- Проверьте права: `chmod 600 ~/.ssh/authorized_keys`
- Убедитесь, что в секрете `SERVER_SSH_KEY` указан правильный приватный ключ

### Ошибка: "Connection refused"

**Решение:**
- Проверьте, что SSH сервис запущен: `systemctl status ssh`
- Проверьте firewall: `ufw status`
- Убедитесь, что порт 22 открыт: `ufw allow 22/tcp`

### Образы не собираются

**Решение:**
- Проверьте логи в GitHub Actions
- Убедитесь, что репозиторий не приватный (или настройте доступ к registry)
- Проверьте, что Dockerfile файлы корректны

## Проверка образов в GitHub Container Registry

После успешной сборки проверьте:

```
https://github.com/Uz11ps/Nardist/pkgs/container/nardist-backend
https://github.com/Uz11ps/Nardist/pkgs/container/nardist-frontend
```

Образы должны быть доступны для скачивания.

