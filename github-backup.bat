@echo off
echo ===================================
echo GitHub Backup - Trading Dashboard
echo ===================================

cd C:\TradingDashboard

echo.
echo Step 1: Adding all changes...
git add .

echo.
echo Step 2: Enter your commit message in Notepad.
echo A Notepad window will open. Type your message, save, and close Notepad.
echo.

rem Create a temporary file for the commit message
set msg_file=%TEMP%\commit_msg.txt

rem Open Notepad for editing the commit message
if exist "%msg_file%" del "%msg_file%"
notepad "%msg_file%"

echo.
echo Step 3: Committing changes...
git commit -F "%msg_file%"

echo.
echo Step 4: Pushing to GitHub...
git push origin main

echo.
echo Backup complete!
echo ===================================
pause