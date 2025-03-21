@echo off
echo Generating project status...

set STATUS_FILE=C:\TradingDashboard\project-status.md

rem Create or overwrite the status file
echo # TradingDashboard Project Status > %STATUS_FILE%
echo Last updated: %date% %time% >> %STATUS_FILE%
echo. >> %STATUS_FILE%
echo ## Project Description >> %STATUS_FILE%
echo This is a trading system for recommending Flazh Infinity parameters and ATM settings based on market conditions for NinjaTrader 8, focusing on NQ futures. >> %STATUS_FILE%
echo. >> %STATUS_FILE%

echo ## Instructions for Assistants >> %STATUS_FILE%
echo IMPORTANT - Please read these notes carefully before helping: >> %STATUS_FILE%
echo. >> %STATUS_FILE%
echo - I am not a coder and get confused easily with technical jargon >> %STATUS_FILE%
echo - When sharing code changes, please provide complete files rather than snippets to replace >> %STATUS_FILE%
echo - Take things slow and easy, focusing on one task at a time >> %STATUS_FILE%
echo - Do not overload me with multiple blocks of code all at once >> %STATUS_FILE%
echo - Always include the exact full file path when I need to create new files >> %STATUS_FILE%
echo - Be explicit about file locations and command line instructions >> %STATUS_FILE%
echo - After completing a task, I will show you a list of newly created files to verify correct locations >> %STATUS_FILE%
echo - After task completion, we will run system tests to ensure everything is functioning properly >> %STATUS_FILE%
echo. >> %STATUS_FILE%

echo ## Post-Task Verification >> %STATUS_FILE%
echo For each completed task: >> %STATUS_FILE%
echo 1. Run 'dir [new_directory] /s /b' to verify new files are in the correct location >> %STATUS_FILE%
echo 2. Run appropriate system tests (when applicable): >> %STATUS_FILE%
echo    - For server components: 'npm test' or 'node server.js' to verify functionality >> %STATUS_FILE%
echo    - For database updates: Verify MongoDB connections and data integrity >> %STATUS_FILE%
echo    - For API endpoints: Test with Postman or curl commands >> %STATUS_FILE%
echo. >> %STATUS_FILE%

echo ## Project Structure >> %STATUS_FILE%
echo The project is organized in a modular architecture with server components and integration with NinjaTrader. >> %STATUS_FILE%
echo. >> %STATUS_FILE%

echo ## Completed Components >> %STATUS_FILE%
echo - [x] Project repository and structure setup >> %STATUS_FILE%
echo - [x] Express server with basic routing >> %STATUS_FILE%
echo - [x] MongoDB connection and integration >> %STATUS_FILE%
echo - [x] Template model schemas (ATM and Flazh) >> %STATUS_FILE%
echo - [x] Basic API endpoints for template management >> %STATUS_FILE%
echo - [x] GitHub backup integration >> %STATUS_FILE%
echo - [x] MarketDataExporter indicator for NinjaTrader (preexisting) >> %STATUS_FILE%
echo - [x] Market data service for integration with NinjaTrader >> %STATUS_FILE%
echo - [x] Prop firm monitoring service >> %STATUS_FILE%
echo - [x] Market news monitoring service >> %STATUS_FILE%
echo - [x] Backtesting module for strategy testing >> %STATUS_FILE%
echo - [x] Risk management dashboard API >> %STATUS_FILE%
echo - [x] Trading journal integration >> %STATUS_FILE%
echo - [x] Performance analytics >> %STATUS_FILE%
echo - [x] Alert system >> %STATUS_FILE%
echo - [x] System health monitoring >> %STATUS_FILE%
echo. >> %STATUS_FILE%

echo ## In Progress >> %STATUS_FILE%
echo - [ ] Template import and validation functionality >> %STATUS_FILE%
echo - [ ] Trading session analysis components >> %STATUS_FILE%
echo - [ ] Parameter optimization logic >> %STATUS_FILE%
echo - [ ] React dashboard with control buttons >> %STATUS_FILE%
echo - [ ] Integration of market data, prop firm rules, and news into recommendation engine >> %STATUS_FILE%
echo. >> %STATUS_FILE%

echo ## Next Steps >> %STATUS_FILE%
echo 1. Create test XML files to verify template import functionality >> %STATUS_FILE%
echo 2. Implement market condition analysis for different trading sessions >> %STATUS_FILE%
echo 3. Develop parameter recommendation algorithms >> %STATUS_FILE%
echo 4. Begin building React frontend with control buttons for NinjaTrader interaction >> %STATUS_FILE%
echo 5. Connect market data, prop firm rules, and news services to the recommendation engine >> %STATUS_FILE%
echo. >> %STATUS_FILE%

echo ## Environment Setup >> %STATUS_FILE%
echo - Node.js server at C:\TradingDashboard\server >> %STATUS_FILE%
echo - MongoDB running locally at mongodb://localhost:27017/trading-dashboard >> %STATUS_FILE%
echo - NinjaTrader with MarketDataExporter indicator installed >> %STATUS_FILE%
echo - MarketDataExporter writes to C:\NinjaTraderData\VolatilityMetrics.json >> %STATUS_FILE%
echo - Requires the database to be running for full functionality >> %STATUS_FILE%
echo. >> %STATUS_FILE%

echo ## System Test Commands >> %STATUS_FILE%
echo ```text >> %STATUS_FILE%
echo # Start MongoDB (if not running as a service) >> %STATUS_FILE%
echo mongod --dbpath C:\data\db >> %STATUS_FILE%
echo. >> %STATUS_FILE%
echo # Start the server >> %STATUS_FILE%
echo cd C:\TradingDashboard\server >> %STATUS_FILE%
echo npm start >> %STATUS_FILE%
echo. >> %STATUS_FILE%
echo # Test API endpoints >> %STATUS_FILE%
echo curl http://localhost:3001/api/templates >> %STATUS_FILE%
echo. >> %STATUS_FILE%
echo # Test market data service >> %STATUS_FILE%
echo curl http://localhost:3001/api/market-data >> %STATUS_FILE%
echo. >> %STATUS_FILE%
echo # Test prop firm rules >> %STATUS_FILE%
echo curl http://localhost:3001/api/prop-firm-rules >> %STATUS_FILE%
echo. >> %STATUS_FILE%
echo # Test market news >> %STATUS_FILE%
echo curl http://localhost:3001/api/market-news >> %STATUS_FILE%
echo. >> %STATUS_FILE%
echo # Test backtesting module >> %STATUS_FILE%
echo curl http://localhost:3001/api/backtest >> %STATUS_FILE%
echo. >> %STATUS_FILE%
echo # Test risk management >> %STATUS_FILE%
echo curl http://localhost:3001/api/risk/dashboard >> %STATUS_FILE%
echo. >> %STATUS_FILE%
echo # Test trading journal >> %STATUS_FILE%
echo curl http://localhost:3001/api/journal >> %STATUS_FILE%
echo. >> %STATUS_FILE%
echo # Test performance analytics >> %STATUS_FILE%
echo curl http://localhost:3001/api/analytics/performance >> %STATUS_FILE%
echo. >> %STATUS_FILE%
echo # Test alert system >> %STATUS_FILE%
echo curl http://localhost:3001/api/alerts >> %STATUS_FILE%
echo. >> %STATUS_FILE%
echo # Test system health >> %STATUS_FILE%
echo curl http://localhost:3001/api/health >> %STATUS_FILE%
echo ``` >> %STATUS_FILE%
echo. >> %STATUS_FILE%

echo ## Current Directory Structure >> %STATUS_FILE%
echo ```text >> %STATUS_FILE%
dir C:\TradingDashboard\server /b >> %STATUS_FILE%
echo. >> %STATUS_FILE%
echo server\config: >> %STATUS_FILE%
dir C:\TradingDashboard\server\config /b >> %STATUS_FILE%
echo. >> %STATUS_FILE%
echo server\models: >> %STATUS_FILE%
dir C:\TradingDashboard\server\models /b >> %STATUS_FILE%
echo. >> %STATUS_FILE%
echo server\routes: >> %STATUS_FILE%
dir C:\TradingDashboard\server\routes /b >> %STATUS_FILE%
echo. >> %STATUS_FILE%
echo server\services: >> %STATUS_FILE%
dir C:\TradingDashboard\server\services /b >> %STATUS_FILE%
echo. >> %STATUS_FILE%
echo server\test: >> %STATUS_FILE%
dir C:\TradingDashboard\server\test /b >> %STATUS_FILE%
echo. >> %STATUS_FILE%
echo server\utils: >> %STATUS_FILE%
dir C:\TradingDashboard\server\utils /b >> %STATUS_FILE%
echo ``` >> %STATUS_FILE%

echo Status file generated at %STATUS_FILE%
echo.
echo Opening status file...
start notepad %STATUS_FILE%

echo.
echo You can share this status file with the next assistant to help them understand the project.
echo.
echo ---------------------------------------
echo Post-Task Verification Instructions:
echo ---------------------------------------
echo 1. After completing a task, run: dir C:\TradingDashboard\[new_directory] /s /b
echo    to verify files are in the correct location
echo.
echo 2. Test the system when applicable:
echo    - Start MongoDB: mongod --dbpath C:\data\db
echo    - Start server: cd C:\TradingDashboard\server ^& npm start
echo    - Test API: curl http://localhost:3001/api/templates
echo ---------------------------------------
echo.
pause