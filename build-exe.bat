@echo off
echo ========================================
echo    ElTahan - Build EXE
echo ========================================
echo.

echo [1/4] Building React app...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed!
    pause
    exit /b 1
)

echo.
echo [2/4] Installing WhatsApp server dependencies...
cd whatsapp-server
call npm install --production
cd ..

echo.
echo [3/4] Installing Electron builder...
cd electron
call npm install
call npm install electron-builder --save-dev

echo.
echo [4/4] Building EXE...
call npx electron-builder --win portable

echo.
echo ========================================
echo    Done! EXE is in: electron\release\
echo ========================================
pause
