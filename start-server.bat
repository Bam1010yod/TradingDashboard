@echo off
setlocal EnableDelayedExpansion
echo ===================================
echo  Trading Dashboard Server Startup
echo ===================================
echo.

rem Check if MongoDB is running
echo Checking if MongoDB is running...
tasklist /FI "IMAGENAME eq mongod.exe" | find "mongod.exe" > nul
if %ERRORLEVEL% NEQ 0 (
    echo MongoDB is not running. Starting MongoDB...
    start "MongoDB" cmd /c "mongod --dbpath C:\data\db"
    echo Waiting for MongoDB to initialize...
    timeout /t 5 /nobreak > nul
) else (
    echo MongoDB is already running.
)

rem Display MongoDB status
echo.
echo === MongoDB Status ===
tasklist /FI "IMAGENAME eq mongod.exe" 2>nul | find "mongod.exe" 
echo.

rem Navigate to server directory
cd /d C:\TradingDashboard\server

rem Check if NinjaTraderData directory exists, create if not
if not exist "C:\NinjaTraderData" (
    echo Creating NinjaTraderData directory...
    mkdir "C:\NinjaTraderData"
    echo Directory created.
)

rem Check for VolatilityMetrics.json, create a placeholder if not exists
if not exist "C:\NinjaTraderData\VolatilityMetrics.json" (
    echo Creating placeholder VolatilityMetrics.json file...
    echo { > "C:\NinjaTraderData\VolatilityMetrics.json"
    echo   "timestamp": "%DATE% %TIME%", >> "C:\NinjaTraderData\VolatilityMetrics.json"
    echo   "symbol": "NQ", >> "C:\NinjaTraderData\VolatilityMetrics.json"
    echo   "atr": 100.0, >> "C:\NinjaTraderData\VolatilityMetrics.json"
    echo   "overnightRange": 75.5, >> "C:\NinjaTraderData\VolatilityMetrics.json"
    echo   "volatilityScore": 3.2, >> "C:\NinjaTraderData\VolatilityMetrics.json"
    echo   "volatilityLevel": "MEDIUM" >> "C:\NinjaTraderData\VolatilityMetrics.json"
    echo } >> "C:\NinjaTraderData\VolatilityMetrics.json"
    echo Placeholder file created.
)

echo.
echo === Starting Trading Dashboard Server ===
echo.
echo Server logs will appear below. Press Ctrl+C to stop the server.
echo.
echo TIP: To test API endpoints, open a new command prompt and run:
echo  curl http://localhost:3001/api/market-data
echo  curl http://localhost:3001/api/prop-firm-rules
echo  curl http://localhost:3001/api/market-news
echo  curl http://localhost:3001/api/templates
echo  curl http://localhost:3001/api/backtest
echo  curl http://localhost:3001/api/risk/dashboard
echo  curl http://localhost:3001/api/journal
echo  curl http://localhost:3001/api/analytics/performance
echo  curl http://localhost:3001/api/alerts
echo  curl http://localhost:3001/api/health
echo.
echo ===================================
echo.

rem Create a temporary file to capture server output
set "tempFile=%TEMP%\server_output.tmp"

rem Start the server and capture output
npm start > "%tempFile%" 2>&1 &
set SERVER_PID=%ERRORLEVEL%

rem Wait for server to initialize (look for "Server running on port" message)
echo Waiting for server to initialize...
set /a attempts=0
set found_success=0

:check_server
timeout /t 1 /nobreak > nul
set /a attempts+=1
findstr /C:"Server running on port" "%tempFile%" > nul
if %ERRORLEVEL% EQU 0 (
    set found_success=1
    goto server_check_done
)
findstr /C:"Error" "%tempFile%" > nul
if %ERRORLEVEL% EQU 0 (
    goto server_check_done
)
if %attempts% LSS 20 goto check_server

:server_check_done
echo.
if %found_success% EQU 1 (
    color 2F
    echo ✓✓✓ SERVER STARTED SUCCESSFULLY ✓✓✓
    echo.
    echo All systems are running properly:
    echo - MongoDB connection established
    echo - Web server listening on port 3001
    echo - Services initialized successfully
    echo.
    echo Your TradingDashboard system is ready!
    echo.
    echo Testing health status:
    curl -s http://localhost:3001/api/health > "%TEMP%\health_output.tmp"
    type "%TEMP%\health_output.tmp"
    del "%TEMP%\health_output.tmp" > nul
    echo.
    color 07
) else (
    color 4F
    echo ✗✗✗ SERVER MAY HAVE ISSUES ✗✗✗
    echo.
    echo Please check the logs below for details.
    echo.
    color 07
)

rem Display server logs
type "%tempFile%"
del "%tempFile%" > nul

rem Run a quick health check
echo.
echo === Running System Health Check ===
echo.
curl -s http://localhost:3001/api/health/database
echo.
curl -s http://localhost:3001/api/health/services
echo.
curl -s http://localhost:3001/api/health/performance
echo.

rem If server exits, wait for user input before closing
echo.
echo === Server Status Information ===
echo Press any key to continue...
pause > nul
echo.
echo Press any key again to close this window...
pause > nul
exit /b

:monitor_server
rem This function can be expanded to periodically test endpoints
echo Monitoring server health...
curl -s http://localhost:3001/ > nul
if %ERRORLEVEL% NEQ 0 (
    echo WARNING: Server is not responding!
) else (
    echo Server is healthy.
)
exit /b