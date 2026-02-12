@echo off
chcp 65001 > nul
title إيقاف السيرفرات

echo.
echo ================================
echo   إيقاف السيرفرات
echo ================================
echo.

echo ⏹️  جاري البحث عن العمليات...
echo.

REM إيقاف عمليات Node على المنافذ
echo [1] إيقاف الخادم الخلفي (Backend) على المنفذ 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":3000 "') do taskkill /PID %%a /F 2>nul
if errorlevel 1 (
    echo ✓ لا توجد عمليات على المنفذ 3000
) else (
    echo ✓ تم إيقاف الخادم الخلفي
)

echo.

echo [2] إيقاف الخادم الأمامي (Frontend) على المنفذ 8080...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8080 "') do taskkill /PID %%a /F 2>nul
if errorlevel 1 (
    echo ✓ لا توجد عمليات على المنفذ 8080
) else (
    echo ✓ تم إيقاف الخادم الأمامي
)

echo.
echo ✅ تم إيقاف جميع السيرفرات بنجاح!
echo.
pause
