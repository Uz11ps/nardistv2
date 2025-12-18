# 🚀 Быстрый деплой на сервер

## Рекомендуемый способ (самый быстрый)

Выполните на сервере:

```bash
ssh root@89.104.65.118

# На сервере:
cd /opt/Nardist
git pull origin main
chmod +x scripts/build-preinstall-deps.sh
bash scripts/build-preinstall-deps.sh
```

Этот способ:
- ⚡ Устанавливает зависимости на сервере (быстрее чем в Docker)
- 🏗️ Собирает приложение локально
- 🐳 Создает минималистичный Docker образ (только копирует готовые файлы)
- ⏱️ Занимает 2-5 минут вместо 10+ минут

## Альтернативные способы

### Способ 2: BuildKit с кэшем
```bash
cd /opt/Nardist
git pull origin main
chmod +x scripts/build-with-buildkit.sh
bash scripts/build-with-buildkit.sh
```

### Способ 3: Стандартный Docker (медленный)
```bash
cd /opt/Nardist
git pull origin main
docker compose -f docker-compose.prod.yml build --no-cache backend
docker compose -f docker-compose.prod.yml up -d backend
```

## Если сборка все еще медленная

1. **Используйте зеркало npm:**
   ```bash
   npm config set registry https://registry.npmmirror.com/
   ```

2. **Очистите Docker кэш:**
   ```bash
   docker system prune -af
   ```

3. **Проверьте скорость интернета:**
   ```bash
   curl -o /dev/null -s -w "Speed: %{speed_download} bytes/sec\n" https://registry.npmjs.org/
   ```
