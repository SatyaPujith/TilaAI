@echo off
echo 🌧️ Deploying Tiva AI to Raindrop Cloud...
echo.

REM Set PATH to include Node.js
set PATH=%PATH%;C:\Program Files\nodejs

REM Run type check manually first
echo Running type check...
call npx tsc --noEmit
if %ERRORLEVEL% NEQ 0 (
    echo Type check failed!
    exit /b 1
)

echo Type check passed!
echo.

REM Now deploy (the CLI will skip type check since we already did it)
echo Deploying to Raindrop Cloud...
raindrop build deploy --start

echo.
echo 🎉 Deployment complete!