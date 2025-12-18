$ServerIP = "89.104.65.118"
$User = "root"
$Password = "9kwQ9fYCh0wArbSh"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Деплой Nardist на сервер" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Функция для выполнения SSH команд
function Invoke-SSHCommand {
    param(
        [string]$Command
    )
    
    $sshCommand = "sshpass -p '$Password' ssh -o StrictHostKeyChecking=no ${User}@${ServerIP} '$Command'"
    
    try {
        if (Get-Command sshpass -ErrorAction SilentlyContinue) {
            bash -c $sshCommand
        } else {
            Write-Host "sshpass не установлен. Выполните команду вручную:" -ForegroundColor Yellow
            Write-Host "ssh ${User}@${ServerIP}" -ForegroundColor Yellow
            Write-Host "Затем выполните на сервере:" -ForegroundColor Yellow
            Write-Host $Command -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "Ошибка выполнения SSH команды: $_" -ForegroundColor Red
        return $false
    }
}

# Проверка наличия sshpass
if (-not (Get-Command sshpass -ErrorAction SilentlyContinue)) {
    Write-Host "`nВНИМАНИЕ: sshpass не установлен!" -ForegroundColor Yellow
    Write-Host "Установите его или выполните команды вручную." -ForegroundColor Yellow
    Write-Host "`nКоманды для выполнения на сервере:" -ForegroundColor Cyan
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "ssh ${User}@${ServerIP}" -ForegroundColor White
    Write-Host "`nЗатем выполните:" -ForegroundColor Cyan
    Write-Host "cd /opt/nardist || mkdir -p /opt/nardist && cd /opt/nardist" -ForegroundColor White
    Write-Host "git clone https://github.com/Uz11ps/nardistv2.git . || git pull" -ForegroundColor White
    Write-Host "chmod +x infra/deploy.sh" -ForegroundColor White
    Write-Host "./infra/deploy.sh" -ForegroundColor White
    Write-Host "=========================================" -ForegroundColor Cyan
    Write-Host "`nИли используйте команду ниже для прямого выполнения:" -ForegroundColor Yellow
    Write-Host "ssh ${User}@${ServerIP} 'bash -s' < infra/deploy.sh" -ForegroundColor White
    exit
}

Write-Host "`n1. Подключение к серверу..." -ForegroundColor Green
$testConnection = Invoke-SSHCommand "echo 'Connection test'"
if (-not $testConnection) {
    Write-Host "Не удалось подключиться к серверу" -ForegroundColor Red
    exit 1
}

Write-Host "`n2. Подготовка директории..." -ForegroundColor Green
Invoke-SSHCommand "mkdir -p /opt/nardist && cd /opt/nardist && pwd"

Write-Host "`n3. Клонирование/обновление репозитория..." -ForegroundColor Green
Invoke-SSHCommand "cd /opt/nardist && if [ -d .git ]; then git pull; else git clone https://github.com/Uz11ps/nardistv2.git .; fi"

Write-Host "`n4. Запуск скрипта деплоя..." -ForegroundColor Green
Write-Host "ВНИМАНИЕ: Скрипт запросит токен Telegram бота!" -ForegroundColor Yellow

# Копируем скрипт на сервер
$deployScript = Get-Content "infra/deploy.sh" -Raw
$tempFile = [System.IO.Path]::GetTempFileName()
Set-Content -Path $tempFile -Value $deployScript

$scpCommand = "sshpass -p '$Password' scp -o StrictHostKeyChecking=no $tempFile ${User}@${ServerIP}:/tmp/deploy.sh"
bash -c $scpCommand

Invoke-SSHCommand "chmod +x /tmp/deploy.sh && cd /opt/nardist && bash /tmp/deploy.sh"

Write-Host "`n=========================================" -ForegroundColor Cyan
Write-Host "Деплой завершен!" -ForegroundColor Green
Write-Host "Проверьте статус:" -ForegroundColor Cyan
Write-Host "ssh ${User}@${ServerIP} 'docker ps'" -ForegroundColor White
Write-Host "=========================================" -ForegroundColor Cyan
