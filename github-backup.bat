@echo off
echo ===================================
echo GitHub Backup - Trading Dashboard
echo ===================================

cd C:\TradingDashboard

echo.
echo Step 1: Adding all changes...
git add .

echo.
echo Step 2: Enter your commit message:
set /p commit_msg="Commit message: "

echo.
echo Step 3: Committing changes...
git commit -m "%commit_msg%"

echo.
echo Step 4: Pushing to GitHub...
git push origin main

echo.
echo Backup complete!
echo ===================================
pause