@echo off
echo ==========================================
echo   Sultan Orders - Auto Deploy Tool
echo ==========================================
echo.

set /p commitMsg="Enter update message (Press Enter for default): "
if "%commitMsg%"=="" set commitMsg=General Update

echo.
echo [1/3] Adding files...
git add .

echo.
echo [2/3] Committing changes...
git commit -m "%commitMsg%"

echo.
echo [3/3] Pushing to GitHub...
git push

echo.
echo ==========================================
echo   DONE! Vercel will update in 1-2 mins.
echo ==========================================
pause
