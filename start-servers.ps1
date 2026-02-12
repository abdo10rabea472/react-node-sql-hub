# سكريبت لتشغيل كل من Backend و Frontend
# اضغط على PowerShell وشغّل: .\start-servers.ps1

Write-Host "================================" -ForegroundColor Cyan
Write-Host "  بدء تشغيل السيرفرات" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# تشغيل الخادم الخلفي في نافذة جديدة
Write-Host "🚀 بدء تشغيل الخادم الخلفي (Backend) على المنفذ 3000..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "server"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; `$env:JWT_SECRET='your-secret-key-here'; node index.js" -NoNewWindow

# انتظر قليلاً قبل تشغيل Frontend
Start-Sleep -Seconds 2

# تشغيل الخادم الأمامي في نافذة جديدة
Write-Host "🚀 بدء تشغيل الخادم الأمامي (Frontend) على المنفذ 8080..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev"

Write-Host ""
Write-Host "✅ تم بدء كل السيرفرات!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 الروابط:" -ForegroundColor Cyan
Write-Host "   Frontend:  http://localhost:8080/" -ForegroundColor White
Write-Host "   Backend:   http://localhost:3000/" -ForegroundColor White
Write-Host ""
Write-Host "⏹️  لإيقاف السيرفرات: اضغط Ctrl+C في كل نافذة" -ForegroundColor Magenta
Write-Host "================================" -ForegroundColor Cyan
