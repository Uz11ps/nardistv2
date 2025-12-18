# Скрипт для отправки .env файла на сервер
# Использование: .\upload-env.ps1

$SERVER_IP = "89.104.65.118"
$SERVER_USER = "root"
$SERVER_PATH = "/opt/Nardist/.env"
$LOCAL_ENV_FILE = "backend\.env"

Write-Host "📤 Отправка .env файла на сервер..." -ForegroundColor Cyan

# Проверяем наличие файла
if (-not (Test-Path $LOCAL_ENV_FILE)) {
    Write-Host "❌ Файл $LOCAL_ENV_FILE не найден!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Файл найден: $LOCAL_ENV_FILE" -ForegroundColor Green

# Проверяем наличие scp (OpenSSH)
$scpPath = Get-Command scp -ErrorAction SilentlyContinue
if (-not $scpPath) {
    Write-Host "⚠️  scp не найден. Пробуем альтернативный способ..." -ForegroundColor Yellow
    
    # Альтернативный способ через SSH
    Write-Host "📝 Используйте следующую команду вручную:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "scp backend\.env root@89.104.65.118:/opt/Nardist/.env" -ForegroundColor White
    Write-Host ""
    Write-Host "Или установите OpenSSH:" -ForegroundColor Yellow
    Write-Host "Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0" -ForegroundColor White
    Write-Host ""
    
    # Попробуем через PowerShell SSH
    Write-Host "🔄 Пробуем отправить через PowerShell SSH..." -ForegroundColor Cyan
    
    $envContent = Get-Content $LOCAL_ENV_FILE -Raw
    $envContentEscaped = $envContent -replace '"', '\"' -replace '\$', '\$'
    
    $sshCommand = @"
cat > $SERVER_PATH << 'ENVEOF'
$envContent
ENVEOF
chmod 600 $SERVER_PATH
ls -la $SERVER_PATH
"@
    
    Write-Host "Выполните вручную:" -ForegroundColor Yellow
    Write-Host "ssh root@89.104.65.118 `"$sshCommand`"" -ForegroundColor White
    exit 0
}

# Используем scp
Write-Host "🚀 Отправка файла через scp..." -ForegroundColor Cyan
Write-Host "💡 Вам будет запрошен пароль: 9kwQ9fYCh0wArbSh" -ForegroundColor Yellow
Write-Host ""

$scpCommand = "scp `"$LOCAL_ENV_FILE`" ${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}"
Write-Host "Выполняем: $scpCommand" -ForegroundColor Gray

try {
    & scp $LOCAL_ENV_FILE "${SERVER_USER}@${SERVER_IP}:${SERVER_PATH}"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Файл успешно отправлен!" -ForegroundColor Green
        
        # Устанавливаем права доступа
        Write-Host "🔒 Установка прав доступа..." -ForegroundColor Cyan
        ssh "${SERVER_USER}@${SERVER_IP}" "chmod 600 ${SERVER_PATH}"
        
        Write-Host "✅ Готово! Файл .env создан на сервере." -ForegroundColor Green
    } else {
        Write-Host "❌ Ошибка при отправке файла" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Ошибка: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Попробуйте выполнить команду вручную:" -ForegroundColor Yellow
    Write-Host "scp backend\.env root@89.104.65.118:/opt/Nardist/.env" -ForegroundColor White
}

