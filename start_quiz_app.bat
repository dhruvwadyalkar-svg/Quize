@echo off
title QuizzPulse Live Assessment Engine Launcher
echo =======================================================
echo   🚀 Starting QuizzPulse Backend & Frontend & Public Tunnel
echo =======================================================
echo.

start "QuizzPulse Backend Server" /min cmd /c "cd /d %~dp0backend && npm run dev"
start "QuizzPulse Frontend Web App" /min cmd /c "cd /d %~dp0frontend && npm run dev"

echo.
echo ✅ Backend and Frontend servers launched in background!
echo 🌐 Local Web App Link:    http://localhost:5173
echo 📱 Network Devices Link:  http://10.178.22.35:5173
echo 🌍 Public Live Link:     https://quizzpulse-live.loca.lt
echo.
echo Press any key to close this launcher window.
pause
