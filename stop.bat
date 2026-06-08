@echo off
REM Stop the Madrasa Qurania server
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :4173 ^| findstr LISTENING') do (
    echo Stopping PID %%a on port 4173...
    taskkill /F /PID %%a >nul 2>&1
)
echo Done.
