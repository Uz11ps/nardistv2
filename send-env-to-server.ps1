# Скрипт для отправки .env файла на сервер
# Автоматически создаст директорию если её нет

$SERVER_IP = "89.104.65.118"
$SERVER_USER = "root"
$SERVER_PASSWORD = "9kwQ9fYCh0wArbSh"
$SERVER_DIR = "/opt/Nardist"
$SERVER_FILE = "$SERVER_DIR/.env"
$LOCAL_FILE = "backend\.env"

Write-Host "📤 Отправка .env файла на сервер $SERVER_IP..." -ForegroundColor Cyan

# Проверяем наличие локального файла
if (-not (Test-Path $LOCAL_FILE)) {
    Write-Host "❌ Файл $LOCAL_FILE не найден!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Локальный файл найден: $LOCAL_FILE" -ForegroundColor Green

# Создаем команду для создания директории и отправки файла
$createDirCmd = "mkdir -p $SERVER_DIR"
$chmodCmd = "chmod 600 $SERVER_FILE"

Write-Host ""
Write-Host "📝 Выполните следующие команды в PowerShell:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Создать директорию (если её нет):" -ForegroundColor Cyan
Write-Host "   ssh root@89.104.65.118 `"mkdir -p /opt/Nardist`"" -ForegroundColor White
Write-Host ""
Write-Host "2. Отправить файл:" -ForegroundColor Cyan
Write-Host "   scp backend\.env root@89.104.65.118:/opt/Nardist/.env" -ForegroundColor White
Write-Host "   (Пароль: 9kwQ9fYCh0wArbSh)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Установить права доступа:" -ForegroundColor Cyan
Write-Host "   ssh root@89.104.65.118 `"chmod 600 /opt/Nardist/.env`"" -ForegroundColor White
Write-Host ""
Write-Host "4. Проверить файл:" -ForegroundColor Cyan
Write-Host "   ssh root@89.104.65.118 `"ls -la /opt/Nardist/.env`"" -ForegroundColor White
Write-Host ""

# Альтернативный способ - через одну команду SSH
Write-Host "---" -ForegroundColor Gray
Write-Host "Альтернатива: Отправить содержимое через SSH (одна команда):" -ForegroundColor Yellow
Write-Host ""

$envContent = Get-Content $LOCAL_FILE -Raw -Encoding UTF8
$envContentEscaped = $envContent -replace '`', '``' -replace '"', '`"' -replace '\$', '`$'

$sshCommand = @"
mkdir -p $SERVER_DIR && cat > $SERVER_FILE << 'ENVEOF'
$envContent
ENVEOF
chmod 600 $SERVER_FILE && ls -la $SERVER_FILE
"@

Write-Host "Выполните:" -ForegroundColor Cyan
Write-Host "ssh root@89.104.65.118 @'" -ForegroundColor White
Write-Host $sshCommand -ForegroundColor White
Write-Host "'@ " -ForegroundColor White

