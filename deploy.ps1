param(
    [switch]$Force
)

$PROJECT_DIR = "C:\Users\prota\OneDrive\Desktop\Ero Musa 2\eromusa-app"
$LOG_FILE = "$PROJECT_DIR\deploy.log"
$TIMESTAMP = Get-Date -Format "yyyy-MM-dd HH:mm:ss"

function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $line = "[$TIMESTAMP] [$Level] $Message"
    Write-Host $line
    Add-Content -Path $LOG_FILE -Value $line
}

Write-Log "=== INICIANDO PULL + DEPLOY ==="

# 1. Git pull
Set-Location $PROJECT_DIR
Write-Log "Fazendo git pull..."
$pullOutput = git pull origin master 2>&1
$pullExitCode = $LASTEXITCODE
Write-Log "Git pull: $pullOutput"

if ($pullExitCode -ne 0) {
    Write-Log "Erro no git pull (exit code: $pullExitCode)" "ERROR"
    exit 1
}

# Check if there were actual changes
$hasChanges = $pullOutput -match "Updating" -or $pullOutput -match "Fast-forward" -or $pullOutput -match "changed" -or $Force
if (-not $hasChanges) {
    Write-Log "Nenhuma mudanca encontrada. Pulando deploy."
    Write-Log "=== FINALIZADO (sem mudancas) ==="
    exit 0
}

Write-Log "Mudancas detectadas! Prosseguindo com deploy..."

# 2. Vercel deploy (CLI ja esta autenticado como protaculos)
Write-Log "Iniciando deploy na Vercel..."
$deployOutput = npx vercel --prod 2>&1
$deployExitCode = $LASTEXITCODE
Write-Log "Deploy: $deployOutput"

if ($deployExitCode -ne 0) {
    Write-Log "Erro no deploy Vercel (exit code: $deployExitCode)" "ERROR"
    exit 1
}

Write-Log "Deploy concluido com sucesso!"
Write-Log "=== PULL + DEPLOY FINALIZADO COM SUCESSO ==="
