@echo off
title Deploy TourisMetrics to Vercel
echo =====================================================================
echo  TourisMetrics - Automated Vercel Production Deployment
echo =====================================================================
echo.
echo  This script will deploy your full-stack tourism demand analysis and
echo  smart travel planning platform directly to Vercel.
echo.
echo  If this is your first time deploying:
echo   1. Vercel will prompt you to log in via your web browser.
echo   2. Press Enter to accept the default project settings.
echo   3. Vercel will build and output your live production URL!
echo.
echo =====================================================================
echo.
cd /d "%~dp0"
call npx.cmd vercel --prod
echo.
echo =====================================================================
echo  Deployment complete! Check the production URL above.
echo =====================================================================
pause
