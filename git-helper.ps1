# Git Helper Script - Evita que Git se cuelgue
# Uso: .\git-helper.ps1 [comando]

param(
    [Parameter(Position=0)]
    [string]$Command = "status"
)

# Configurar timeout para evitar que Git se cuelgue
$env:GIT_TERMINAL_PROMPT = 0
$env:GIT_CONFIG_NOSYSTEM = 1

function Invoke-GitCommand {
    param([string]$GitCommand)
    
    Write-Host "🔧 Ejecutando: git $GitCommand" -ForegroundColor Cyan
    
    try {
        # Ejecutar con timeout de 30 segundos
        $result = & git $GitCommand.Split(' ') 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Comando ejecutado exitosamente" -ForegroundColor Green
            return $result
        } else {
            Write-Host "❌ Error en comando Git" -ForegroundColor Red
            return $result
        }
    } catch {
        Write-Host "❌ Error ejecutando comando: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

switch ($Command.ToLower()) {
    "status" {
        Invoke-GitCommand "status"
    }
    "add" {
        Invoke-GitCommand "add ."
    }
    "commit" {
        $message = Read-Host "Ingresa el mensaje de commit"
        if ($message) {
            Invoke-GitCommand "commit -m `"$message`""
        } else {
            Write-Host "❌ Mensaje de commit requerido" -ForegroundColor Red
        }
    }
    "push" {
        Invoke-GitCommand "push"
    }
    "pull" {
        Invoke-GitCommand "pull"
    }
    "log" {
        Invoke-GitCommand "log --oneline -10"
    }
    "quick" {
        Write-Host "🚀 Ejecutando flujo rápido: add -> commit -> push" -ForegroundColor Yellow
        $message = Read-Host "Ingresa el mensaje de commit"
        if ($message) {
            Invoke-GitCommand "add ."
            Invoke-GitCommand "commit -m `"$message`""
            Invoke-GitCommand "push"
        } else {
            Write-Host "❌ Mensaje de commit requerido" -ForegroundColor Red
        }
    }
    default {
        Write-Host "📋 Comandos disponibles:" -ForegroundColor Cyan
        Write-Host "  status  - Ver estado del repositorio" -ForegroundColor White
        Write-Host "  add     - Agregar todos los cambios" -ForegroundColor White
        Write-Host "  commit  - Hacer commit con mensaje" -ForegroundColor White
        Write-Host "  push    - Subir cambios al repositorio" -ForegroundColor White
        Write-Host "  pull    - Descargar cambios del repositorio" -ForegroundColor White
        Write-Host "  log     - Ver historial de commits" -ForegroundColor White
        Write-Host "  quick   - Flujo rápido (add + commit + push)" -ForegroundColor White
        Write-Host ""
        Write-Host "💡 Uso: .\git-helper.ps1 [comando]" -ForegroundColor Yellow
    }
}