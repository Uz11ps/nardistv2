# Быстрая настройка CI/CD

## Минимальные шаги для запуска CI/CD

### 1. Добавьте секреты в GitHub (обязательно!)

Перейдите: `https://github.com/Uz11ps/Nardist/settings/secrets/actions`

Добавьте 3 секрета:

| Name | Value | Пример |
|------|-------|--------|
| `SERVER_HOST` | Домен или IP сервера | `nardist.online` |
| `SERVER_USER` | Пользователь SSH | `root` |
| `SERVER_SSH_KEY` | Приватный SSH ключ | См. инструкцию ниже |

### 2. Получите SSH ключ

На сервере выполните:

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions -N ""
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Скопируйте приватный ключ
cat ~/.ssh/github_actions
```

Вставьте весь вывод (включая `-----BEGIN...` и `-----END...`) в секрет `SERVER_SSH_KEY`.

### 3. Запустите CI/CD

Сделайте любой коммит:

```bash
git commit --allow-empty -m "Trigger CI/CD"
git push origin main
```

### 4. Проверьте выполнение

Перейдите в **Actions** на GitHub и дождитесь завершения workflow.

## Что произойдет:

1. GitHub Actions соберет Docker образы
2. Образы будут запушены в `ghcr.io/uz11ps/nardist-backend:latest` и `ghcr.io/uz11ps/nardist-frontend:latest`
3. Автоматически подключится к серверу и задеплоит

## После первого успешного деплоя:

Обновите `.env` на сервере:

```env
BACKEND_IMAGE=ghcr.io/uz11ps/nardist-backend:latest
FRONTEND_IMAGE=ghcr.io/uz11ps/nardist-frontend:latest
```

Теперь каждый деплой будет использовать готовые образы (быстро!) вместо локальной сборки.

