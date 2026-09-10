@echo off
title IELTS Speaking Band 8+ Mastery Platform
echo ===================================================
echo  Starting IELTS Speaking Band 8+ Mastery Platform
echo  Target: Band 8.5+ Simulation
echo ===================================================
cd /d "C:\IELTS Preparation Website"
start "" http://localhost:3000
node server.js
pause
