# Настройка GitHub Packages для CI/CD

## Проблема

Если вы видите ошибку:
```
denied: installation not allowed to Create organization package
```

Это означает, что GitHub Actions не имеет прав для создания пакетов в GitHub Container Registry.

## Решение

### Вариант 1: Настройка прав в репозитории (Рекомендуется)

1. Перейдите в настройки репозитория: `https://github.com/Uz11ps/Nardist/settings/actions`
2. Прокрутите до раздела **"Workflow permissions"**
3. Выберите **"Read and write permissions"**
4. Убедитесь, что включено **"Allow GitHub Actions to create and approve pull requests"**
5. Сохраните изменения

### Вариант 2: Настройка через Personal Access Token (если Вариант 1 не работает)

1. Создайте Personal Access Token (PAT):
   - Перейдите: `https://github.com/settings/tokens`
   - Нажмите **"Generate new token (classic)"**
   - Выберите scope: `write:packages`, `read:packages`, `delete:packages`
   - Скопируйте токен

2. Добавьте токен как секрет:
   - Перейдите: `https://github.com/Uz11ps/Nardist/settings/secrets/actions`
   - Создайте секрет: `GITHUB_TOKEN` (или `GHCR_TOKEN`)
   - Вставьте ваш PAT

3. Обновите workflow (если нужно):
   ```yaml
   password: ${{ secrets.GHCR_TOKEN || secrets.GITHUB_TOKEN }}
   ```

### Вариант 3: Использование публичного репозитория

Если репозиторий приватный, убедитесь что:
- В настройках репозитория включен доступ к GitHub Packages
- Или сделайте репозиторий публичным (временно для тестирования)

## Проверка

После настройки прав:

1. Сделайте новый коммит и push
2. Проверьте выполнение workflow в Actions
3. После успешной сборки проверьте пакеты:
   - `https://github.com/Uz11ps/Nardist/pkgs/container/nardist-backend`
   - `https://github.com/Uz11ps/Nardist/pkgs/container/nardist-frontend`

## Дополнительная информация

- GitHub Container Registry использует формат: `ghcr.io/OWNER/IMAGE_NAME`
- Для организации: `ghcr.io/ORGANIZATION/IMAGE_NAME`
- Для пользователя: `ghcr.io/USERNAME/IMAGE_NAME`

В нашем случае используется: `ghcr.io/Uz11ps/nardist-backend:latest`

