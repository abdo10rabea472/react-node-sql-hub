@echo off
echo ========================================
echo    ElTahan Desktop App Launcher
echo ========================================
echo.

echo [1/3] Installing WhatsApp server dependencies...
cd whatsapp-server
call npm install
cd ..

echo.
echo [2/3] Installing Electron dependencies...
cd electron
call npm install
cd ..

echo.
echo [3/3] Starting Desktop App...
cd electron
call npx electron .
