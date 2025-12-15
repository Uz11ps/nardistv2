# Настройка GitHub Actions для CI/CD

## Необходимые секреты

Для работы автоматического деплоя через GitHub Actions нужно настроить следующие секреты:

### 1. SERVER_HOST
IP адрес или домен вашего сервера

**Пример:** `nardist.online` или `123.45.67.89`

### 2. SERVER_USER
Имя пользователя для SSH подключения к серверу

**Пример:** `root` или `ubuntu` или ваш пользователь

### 3. SERVER_SSH_KEY
Приватный SSH ключ для доступа к серверу

## Пошаговая инструкция

### Шаг 1: Генерация SSH ключа на сервере

Выполните на вашем сервере:

```bash
# Генерируем SSH ключ (если еще нет)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_actions

# Или используйте существующий ключ
# Если ключа нет, создайте новый:
ssh-keygen -t ed25519 -C "github-actions-deploy"
# Нажмите Enter для всех вопросов (или укажите путь, например: /root/.ssh/github_actions)
```

### Шаг 2: Добавление публичного ключа на сервер

```bash
# Добавьте публичный ключ в authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys

# Или если использовали стандартный путь:
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys

# Установите правильные права
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

### Шаг 3: Получение приватного ключа

```bash
# Покажите приватный ключ (скопируйте весь вывод)
cat ~/.ssh/github_actions

# Или если использовали стандартный путь:
cat ~/.ssh/id_ed25519
```

**Важно:** Скопируйте весь ключ, включая строки `-----BEGIN OPENSSH PRIVATE KEY-----` и `-----END OPENSSH PRIVATE KEY-----`

### Шаг 4: Настройка секретов в GitHub

1. Перейдите в ваш репозиторий на GitHub: `https://github.com/Uz11ps/Nardist`

2. Откройте **Settings** → **Secrets and variables** → **Actions**

3. Нажмите **New repository secret** для каждого секрета:

#### Секрет 1: SERVER_HOST
- **Name:** `SERVER_HOST`
- **Secret:** `nardist.online` (или IP вашего сервера)

#### Секрет 2: SERVER_USER
- **Name:** `SERVER_USER`
- **Secret:** `root` (или ваш пользователь)

#### Секрет 3: SERVER_SSH_KEY
- **Name:** `SERVER_SSH_KEY`
- **Secret:** Вставьте приватный SSH ключ (весь ключ целиком)

### Шаг 5: Проверка подключения

Проверьте SSH подключение с вашего компьютера:

```bash
# Замените на ваши данные
ssh -i ~/.ssh/github_actions root@nardist.online

# Или если используете стандартный ключ:
ssh root@nardist.online
```

Если подключение работает, значит все настроено правильно.

## Альтернативный способ: Использование существующего SSH ключа

Если у вас уже есть SSH ключ на сервере:

```bash
# Покажите существующий приватный ключ
cat ~/.ssh/id_rsa
# или
cat ~/.ssh/id_ed25519

# Убедитесь, что публичный ключ в authorized_keys
cat ~/.ssh/authorized_keys
```

## Проверка работы CI/CD

После настройки секретов:

1. Сделайте любой коммит и push в ветку `main`:
```bash
git add .
git commit -m "Test CI/CD"
git push origin main
```

2. Перейдите в **Actions** на GitHub и проверьте, что workflow запустился

3. Проверьте логи выполнения - должны быть видны шаги:
   - Checkout code
   - Set up Docker Buildx
   - Log in to Container Registry
   - Build and push backend image
   - Build and push frontend image
   - Deploy to server

## Устранение проблем

### Ошибка: "Permission denied (publickey)"

**Решение:**
- Убедитесь, что публичный ключ добавлен в `~/.ssh/authorized_keys` на сервере
- Проверьте права доступа: `chmod 600 ~/.ssh/authorized_keys`
- Убедитесь, что в секрете `SERVER_SSH_KEY` указан правильный приватный ключ

### Ошибка: "Host key verification failed"

**Решение:**
- Добавьте сервер в known_hosts на GitHub Actions (можно использовать `StrictHostKeyChecking=no` в workflow, но это менее безопасно)
- Или добавьте fingerprint сервера в known_hosts

### Ошибка: "Connection refused"

**Решение:**
- Проверьте, что SSH сервис запущен на сервере: `systemctl status ssh`
- Проверьте firewall: `ufw status`
- Убедитесь, что порт 22 открыт: `ufw allow 22/tcp`

## Безопасность

⚠️ **Важные рекомендации:**

1. **Никогда не коммитьте приватные ключи в репозиторий**
2. Используйте отдельный SSH ключ только для CI/CD
3. Регулярно ротируйте ключи (меняйте их периодически)
4. Ограничьте права ключа только необходимыми операциями
5. Используйте ключи с паролем (passphrase) для дополнительной безопасности

## Дополнительные настройки (опционально)

### Ограничение прав SSH ключа

Можно создать пользователя только для деплоя:

```bash
# На сервере
adduser deployer
usermod -aG docker deployer

# Создайте ключ для этого пользователя
su - deployer
ssh-keygen -t ed25519 -C "github-actions"
cat ~/.ssh/id_ed25519.pub >> ~/.ssh/authorized_keys

# Используйте deployer в SERVER_USER секрете
```

### Использование SSH config

Можно настроить SSH config для упрощения подключения (опционально).

