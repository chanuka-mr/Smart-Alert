@echo off
echo Starting Smart Alert Application Servers...

echo Starting Backend Server...
start "Backend Server" cmd /k "cd /d E:\Studies\ITP Project\Smart-Alert\BACKEND && npm start"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd /d E:\Studies\ITP Project\Smart-Alert\frontend && npm start"

echo Both servers are starting...
echo Backend will be available at: http://localhost:5000
echo Frontend will be available at: http://localhost:3000
echo.
echo Press any key to exit...
pause >nul
