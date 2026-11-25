@echo off
TITLE Tourism Demand Analysis and Smart Travel Planning System
echo ====================================================================
echo Starting Tourism Demand Analysis and Smart Travel Planning System...
echo ====================================================================

REM Locate Python
set PY=python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python was not found in PATH.
    pause
    exit /b 1
)

cd /d "%~dp0"
echo Starting web server at http://127.0.0.1:8000 ...
python run_server.py
pause