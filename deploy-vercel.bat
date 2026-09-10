@echo off
title Deploy IELTS Speaking Mastery to Vercel
echo ========================================================
echo   Deploying IELTS Speaking Band 8+ Platform to Vercel
echo ========================================================
echo.
cd /d "C:\IELTS Preparation Website"
echo Running Vercel CLI...
echo (If this is your first time, Vercel will open a browser tab to log in.)
echo.
npx vercel
echo.
echo ========================================================
echo To promote to production URL, you can run: npx vercel --prod
echo ========================================================
pause
