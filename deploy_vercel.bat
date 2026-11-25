@echo off
title Deploy TourisMetrics to Vercel
echo =====================================================================
echo  TourisMetrics - Automated Vercel Production Deployment
echo =====================================================================
echo.
cd /d "%~dp0"

echo [1/2] Verifying Vercel Authentication...
call npx.cmd vercel whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo -----------------------------------------------------------------
    echo  No active Vercel login found.
    echo  Launching Vercel Login...
    echo  - Use arrow keys to select your login method (e.g. GitHub or Email).
    echo  - Your browser will open to authenticate.
    echo -----------------------------------------------------------------
    echo.
    call npx.cmd vercel login
    if %errorlevel% neq 0 (
        echo.
        echo [ERROR] Vercel login did not complete. Please try again.
        pause
        exit /b %errorlevel%
    )
)

echo.
echo [2/2] Deploying TourisMetrics to Vercel Production...
echo (Press Enter for any default prompts: Set up and deploy? Yes)
echo.
call npx.cmd vercel --prod

echo.
echo =====================================================================
echo  Deployment finished! Your live website URL is shown above.
echo =====================================================================
pause
