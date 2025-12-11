@echo off
echo Starting Tiva AI Full Stack (Raindrop + Frontend)...
echo.

echo Starting Raindrop Backend...
start "Raindrop Backend" cmd /k "cd raindrop-backend && npm run dev"

timeout /t 3 /nobreak > nul

echo Starting Frontend...
start "Frontend" cmd /k "npm run dev"

echo.
echo Full stack started!
echo Frontend: http://localhost:3000
echo Raindrop Backend: http://localhost:5000
echo.
echo Press any key to exit...
pause > nul