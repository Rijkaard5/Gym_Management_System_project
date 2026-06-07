@echo off
echo.
echo ============================================
echo   GymPro - Starting Setup...
echo ============================================
echo.

cd /d "%~dp0backend"

echo [1/2] Installing dependencies...
call npm install
if errorlevel 1 (
    echo ERROR: npm install failed. Is Node.js installed?
    echo Download from: https://nodejs.org
    pause
    exit /b 1
)

echo.
echo [2/2] Starting server...
echo.
echo ============================================
echo   Open your browser at: http://localhost:3000
echo ============================================
echo.
node server.js
pause
