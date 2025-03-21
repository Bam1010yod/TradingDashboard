@echo off
echo ===================================
echo  Trading Dashboard Server Shutdown
echo ===================================
echo.

echo Stopping Trading Dashboard Node.js server processes...

rem More targeted approach to stop only our server
wmic process where "commandline like '%%TradingDashboard\\server%%'" call terminate > nul 2>&1
if %ERRORLEVEL% EQU 0 (
    color 2F
    echo ✓ Trading Dashboard server stopped successfully.
    color 07
) else (
    echo No Trading Dashboard server processes were found.
    
    rem Fallback to user confirmation for killing all Node processes
    echo.
    echo Would you like to stop ALL Node.js processes? (Y/N)
    echo WARNING: This will affect other Node.js applications.
    set /p STOP_ALL_NODE="Enter Y or N: "
    
    if /i "%STOP_ALL_NODE%" EQU "Y" (
        taskkill /F /IM node.exe 2>nul
        if %ERRORLEVEL% EQU 0 (
            color 2F
            echo ✓ All Node.js processes stopped.
            color 07
        ) else (
            echo No Node.js processes were running.
        )
    )
)

echo.
echo Would you like to stop MongoDB as well? (Y/N)
set /p STOP_MONGO="Enter Y or N: "

if /i "%STOP_MONGO%" EQU "Y" (
    echo.
    echo Stopping MongoDB...
    taskkill /F /IM mongod.exe 2>nul
    if %ERRORLEVEL% EQU 0 (
        color 2F
        echo ✓ MongoDB stopped successfully.
        color 07
    ) else (
        echo No MongoDB processes were running.
    )
) else (
    echo.
    echo MongoDB will continue running in the background.
    echo (This allows for faster startup next time)
)

echo.
echo ===================================
echo  System Shutdown Complete
echo ===================================
echo.
echo All TradingDashboard components have been shut down.
echo Thank you for using TradingDashboard!
echo.
pause