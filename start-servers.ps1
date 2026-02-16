# Standard Header
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  STODIO PHP + REACT STARTER" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan

# 1. Start PHP
Write-Host "[1/2] Starting PHP on http://localhost:8000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot\api'; php -S localhost:8000 index.php"

# 2. Start React (Vite)
Write-Host "[2/2] Starting React on http://localhost:8080..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PSScriptRoot'; npm run dev"

Write-Host ""
Write-Host "Done! Please use http://localhost:8080" -ForegroundColor Green
Write-Host "Login: admin@stodio.com / admin"
