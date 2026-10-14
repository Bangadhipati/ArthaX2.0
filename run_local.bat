@echo off
title ArthaX 2.0 Local Launcher
echo ========================================================
echo        Starting ArthaX 2.0 Full-Stack Environment
echo ========================================================
echo.

echo Starting FastAPI Backend on http://localhost:8000 ...
start "ArthaX Backend" cmd /k "cd /d "%~dp0backend" && python main.py"

echo Starting React Frontend on http://localhost:5173 ...
start "ArthaX Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Both services are booting up in separate windows!
echo Frontend: http://localhost:5173/
echo Backend:  http://localhost:8000/
echo ========================================================
