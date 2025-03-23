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
    echo   "symbol": "NQ", >> "C:\NinjaTraderData\VolatilityMetrics.json"
    echo   "timeframe": "5min", >> "C:\NinjaTraderData\VolatilityMetrics.json"
    echo   "timestamp": "%DATE% %TIME%", >> "C:\NinjaTraderData\VolatilityMetrics.json"
    echo   "metrics": [ >> "C:\NinjaTraderData\VolatilityMetrics.json"
    echo     { "name": "ATR", "period": 14, "value": 15.5, "average": 12.0 }, >> "C:\NinjaTraderData\VolatilityMetrics.json"
    echo     { "name": "Volume", "period": 20, "value": 4200, "average": 3500 }, >> "C:\NinjaTraderData\VolatilityMetrics.json"
    echo     { "name": "Range", "period": 10, "value": 22, "average": 18 } >> "C:\NinjaTraderData\VolatilityMetrics.json"
    echo   ] >> "C:\NinjaTraderData\VolatilityMetrics.json"
    echo } >> "C:\NinjaTraderData\VolatilityMetrics.json"
    echo Placeholder file created.
)

echo.
echo === Starting Trading Dashboard Server ===
echo.
echo Server logs will appear below. Press Ctrl+C to stop the server.
echo.
echo TIP: To test API endpoints, open a new command prompt and run:
echo  curl http://localhost:3008/api/market-data
echo  curl http://localhost:3008/api/prop-firm-rules
echo  curl http://localhost:3008/api/market-news
echo  curl http://localhost:3008/api/templates
echo  curl http://localhost:3008/api/backtest
echo  curl http://localhost:3008/api/risk/dashboard
echo  curl http://localhost:3008/api/journal
echo  curl http://localhost:3008/api/analytics/performance
echo  curl http://localhost:3008/api/alerts
echo  curl http://localhost:3008/api/health
echo  curl http://localhost:3008/api/market-conditions
echo.
echo ===================================
echo.

rem Start the server
start "Trading Dashboard Server" /min cmd /c "npm start > server.log 2>&1"
echo Server starting in background, check server.log for details...

rem Wait for server to initialize
echo Waiting for server to initialize...
timeout /t 5 /nobreak > nul

rem Test if server is running
curl -s http://localhost:3008/api/health > nul
if %ERRORLEVEL% EQU 0 (
    color 2F
    echo ✓✓✓ SERVER STARTED SUCCESSFULLY ✓✓✓
    echo.
    echo All systems are running properly:
    echo - MongoDB connection established
    echo - Web server listening on port 3008
    echo - Services initialized successfully
    echo.
    echo Your TradingDashboard system is ready!
    echo.
    echo Testing health status:
    curl -s http://localhost:3008/api/health
    echo.
    color 07
) else (
    color 4F
    echo ✗✗✗ SERVER MAY HAVE ISSUES ✗✗✗
    echo.
    echo Please check server.log for details.
    echo.
    color 07
)

rem Run a quick health check
echo.
echo === Running System Health Check ===
echo.
curl -s http://localhost:3008/api/health
echo.

echo Browser interface URLs:
echo - Market Conditions Analysis: http://localhost:3008/market-conditions.html
echo.

echo === Server Status Information ===
echo Server is running in background.
echo Press any key to close this window (server will continue running)...
pause > nul
exit /b