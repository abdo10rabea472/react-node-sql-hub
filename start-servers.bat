@echo off
chcp 65001 > nul
title تشغيل سيرفرات التطبيق

echo.
echo ================================
echo   بدء تشغيل السيرفرات
echo ================================
echo.

REM تشغيل الخادم الخلفي
echo [1/2] بدء تشغيل الخادم الخلفي (Backend) على المنفذ 3000...
cd server
start "Backend Server" cmd /k "set JWT_SECRET=your-secret-key-here && node index.js"

REM انتظر قليلاً
timeout /t 2 /nobreak

REM تشغيل الخادم الأمامي
echo [2/2] بدء تشغيل الخادم الأمامي (Frontend) على المنفذ 8080...
cd ..
start "Frontend Server" cmd /k "npm run dev"

echo.
echo ✅ تم بدء كل السيرفرات!
echo.
echo 📍 الروابط:
echo    Frontend:  http://localhost:8080/
echo    Backend:   http://localhost:3000/
echo.
echo ⏹️  لإيقاف السيرفرات: اضغط Ctrl+C في كل نافذة
echo ================================
echo.

pause
