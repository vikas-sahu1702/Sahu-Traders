@echo off
title Sahu Traders ERP Runner
echo ==============================================
echo        SAHU TRADERS ERP SYSTEM RUNNER         
echo ==============================================
echo.

echo Checking Node.js installation...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js (v18+) and try again.
    pause
    exit /b
)
echo [OK] Node.js is installed.
echo.

echo ==============================================
echo STEP 1: Setting up and starting Backend Server
echo ==============================================
echo.
cd backend
if not exist node_modules (
    echo [INFO] Installing Backend Dependencies (this may take a minute)...
    call npm install
) else (
    echo [INFO] Backend dependencies already installed.
)
echo [INFO] Starting Backend Server in a new window...
start cmd /k "title Sahu Traders ERP - Backend && npm run dev"
cd ..
echo.

echo ==============================================
echo STEP 2: Setting up and starting Frontend Client
echo ==============================================
echo.
cd frontend
if not exist node_modules (
    echo [INFO] Installing Frontend Dependencies (this may take a minute)...
    call npm install
) else (
    echo [INFO] Frontend dependencies already installed.
)
echo [INFO] Starting Frontend Client in a new window...
start cmd /k "title Sahu Traders ERP - Frontend && npm run dev"
cd ..
echo.

echo ==============================================
echo SUCCESS: Both servers are starting up!
echo ==============================================
echo Backend will run on: http://localhost:5000
echo Frontend will run on: http://localhost:3000
echo.
echo Login with default Admin credentials:
echo Email: admin@sahutraders.com
echo Password: Admin@123
echo.
pause
