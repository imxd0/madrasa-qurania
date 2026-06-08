@echo off
REM Start the Madrasa Qurania server (detached, survives terminal close)
set NODE_ENV=development
set PORT=4173
cd /d "%~dp0"
start "Madrasa Qurania" /B cmd /c "node server.mjs > logs\server.log 2>&1"
echo Server starting on http://localhost:%PORT%
echo Logs: %~dp0logs\server.log
