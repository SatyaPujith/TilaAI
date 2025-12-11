@echo off
echo Starting Tiva AI Raindrop Backend...
echo.

cd raindrop-backend

echo Checking if dependencies are installed...
if not exist node_modules (
    echo Installing dependencies...
    npm install
)

echo.
echo Starting Raindrop backend server...
echo Backend will be available at: http://localhost:5000
echo Platform: Raindrop
echo Infrastructure: Vultr
echo.

npm run dev