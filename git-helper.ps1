# Git Helper Script - Simple Version
param([string]$Command = "status")

function Git-Command {
    param([string]$Cmd)
    Write-Host "🔧 Ejecutando: git $Cmd" -ForegroundColor Cyan
    & git $Cmd.Split(' ')
}

switch ($Command.ToLower()) {
    "status" { Git-Command "status" }
    "add" { Git-Command "add ." }
    "commit" { 
        $msg = Read-Host "Mensaje de commit"
        Git-Command "commit -m `"$msg`""
    }
    "push" { Git-Command "push" }
    "pull" { Git-Command "pull" }
    "log" { Git-Command "log --oneline -10" }
    "quick" {
        $msg = Read-Host "Mensaje de commit"
        Git-Command "add ."
        Git-Command "commit -m `"$msg`""
        Git-Command "push"
    }
    default {
        Write-Host "📋 Comandos: status, add, commit, push, pull, log, quick" -ForegroundColor Yellow
    }
}