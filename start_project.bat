@echo off
title VeriText NLP — Full-Stack Launcher
echo ========================================================
echo   Starting VeriText NLP Fake News Detection System...
echo ========================================================
echo.

echo [1/3] Starting Flask Backend API on http://127.0.0.1:5000 ...
start "VeriText Backend (Port 5000)" cmd /k "cd /d "%~dp0" && python backend/app.py"

echo [2/3] Starting React + Vite Frontend on http://127.0.0.1:8080 ...
start "VeriText Frontend (Port 8080)" cmd /k "cd /d "%~dp0frontend" && npm.cmd run dev"

echo [3/3] Waiting 4 seconds before opening browser...
timeout /t 4 /nobreak >nul
start "" "http://127.0.0.1:8080"

echo.
echo Both servers have been launched!
pause
