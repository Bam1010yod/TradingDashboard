@echo off
chcp 65001 > nul
echo Generating project status with automated checks...

set PROJECT_ROOT=C:\TradingDashboard
set SERVER_DIR=%PROJECT_ROOT%\server
set STATUS_FILE=%PROJECT_ROOT%\project-status.md
set TEMP_STATUS_FILE=%PROJECT_ROOT%\project-status-temp.md

rem Initialize completion flags (0=not started, 1=in progress, 2=completed)
set COMP_SYSTEM_TESTING=0
set COMP_ALGORITHM_REFINE=0
set COMP_DOCUMENTATION=0
set COMP_MULTI_INSTRUMENT=0
set COMP_DATA_ARCHIVING=0
set COMP_MOBILE_ACCESS=0

echo Checking for completed tasks...

rem Check for comprehensive system testing with real market data
if exist "%SERVER_DIR%\test\real\*.*" (
    if exist "%SERVER_DIR%\test\comprehensiveMarketTest.js" (
        if exist "%SERVER_DIR%\test\results\*.*" (
            set COMP_SYSTEM_TESTING=2
            echo [✓] Found evidence of completed comprehensive system testing
        ) else (
            set COMP_SYSTEM_TESTING=1
            echo [~] System testing appears to be in progress
        )
    )
)

rem Check for algorithm refinement
if exist "%SERVER_DIR%\test\compareRecommendationPerformance.js" (
    if exist "%SERVER_DIR%\test\parameterOptimizationTest.js" (
        if exist "%SERVER_DIR%\test\results\optimization_*.json" (
            set COMP_ALGORITHM_REFINE=2
            echo [✓] Found evidence of completed algorithm refinement
        ) else (
            set COMP_ALGORITHM_REFINE=1
            echo [~] Algorithm refinement appears to be in progress
        )
    )
)

rem Check for user documentation
if exist "%PROJECT_ROOT%\docs\user-guide.md" (
    set COMP_DOCUMENTATION=2
    echo [✓] Found evidence of completed user documentation
) else (
    if exist "%PROJECT_ROOT%\docs\*.*" (
        set COMP_DOCUMENTATION=1
        echo [~] Documentation appears to be in progress
    )
)

rem Check for multi-instrument support
if exist "%SERVER_DIR%\models\instruments.js" (
    set COMP_MULTI_INSTRUMENT=2
    echo [✓] Found evidence of completed multi-instrument support
) else (
    if exist "%SERVER_DIR%\routes\instruments.js" (
        set COMP_MULTI_INSTRUMENT=1
        echo [~] Multi-instrument support appears to be in progress
    )
)

rem Check for data archiving routines
if exist "%SERVER_DIR%\services\dataArchiveService.js" (
    set COMP_DATA_ARCHIVING=2
    echo [✓] Found evidence of completed data archiving routines
) else (
    if exist "%SERVER_DIR%\utils\archiving.js" (
        set COMP_DATA_ARCHIVING=1
        echo [~] Data archiving appears to be in progress
    )
)

rem Check for mobile access and notifications
if exist "%SERVER_DIR%\services\mobileNotificationService.js" (
    if exist "%PROJECT_ROOT%\public\mobile\*.*" (
        set COMP_MOBILE_ACCESS=2
        echo [✓] Found evidence of completed mobile access and notifications
    ) else (
        set COMP_MOBILE_ACCESS=1
        echo [~] Mobile access appears to be in progress
    )
)

echo.
echo Creating status file...

rem Create the status file as a temporary file first to avoid conflicts
echo # TradingDashboard Project Status > %TEMP_STATUS_FILE%
echo Last updated: %date% %time% >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%
echo ## Project Description >> %TEMP_STATUS_FILE%
echo This is a trading system for recommending Flazh Infinity parameters and ATM settings based on market conditions for NinjaTrader 8, focusing on NQ futures. >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%

echo ## Instructions for Assistants >> %TEMP_STATUS_FILE%
echo IMPORTANT - Please read these notes carefully before helping: >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%
echo - I am not a coder and get confused easily with technical jargon >> %TEMP_STATUS_FILE%
echo - When sharing code changes, please provide complete files rather than snippets to replace >> %TEMP_STATUS_FILE%
echo - Take things slow and easy, focusing on one task at a time >> %TEMP_STATUS_FILE%
echo - Do not overload me with multiple blocks of code all at once >> %TEMP_STATUS_FILE%
echo - Always include the exact full file path when I need to create new files >> %TEMP_STATUS_FILE%
echo - Be explicit about file locations and command line instructions >> %TEMP_STATUS_FILE%
echo - After completing a task, I will show you a list of newly created files to verify correct locations >> %TEMP_STATUS_FILE%
echo - After task completion, we will run system tests to ensure everything is functioning properly >> %TEMP_STATUS_FILE%
echo - I want to work on one item at a time - please don't try to implement multiple features simultaneously >> %TEMP_STATUS_FILE%
echo - When providing code, list the file name, path, and complete code block >> %TEMP_STATUS_FILE%
echo - If a file's code is very long, separate it into 2 or more logical blocks with clear instructions on where to place each block >> %TEMP_STATUS_FILE%
echo - This prevents chat sessions from stopping mid-code and makes implementation easier >> %TEMP_STATUS_FILE%
echo - Before making changes to existing files, ask to see the current file contents first to ensure compatibility >> %TEMP_STATUS_FILE%
echo - Review the current project structure and state before suggesting new implementations >> %TEMP_STATUS_FILE%
echo - Suggest any necessary preparation steps before adding new features to avoid system errors >> %TEMP_STATUS_FILE%
echo - Remember I am not even a novice coder, so explain concepts very simply and proceed carefully >> %TEMP_STATUS_FILE%
echo - NEVER create code that bypasses MongoDB database access with mock data. The system must always use the real MongoDB database >> %TEMP_STATUS_FILE%
echo - If MongoDB connection issues occur, focus on fixing the connection rather than implementing workarounds >> %TEMP_STATUS_FILE%
echo - The MarketDataExporter indicator from NinjaTrader automatically writes data to a JSON file which is then read by the server and stored in MongoDB - maintain this flow in all modifications >> %TEMP_STATUS_FILE%
echo - Any temporary mock data or bypass code for testing must be clearly marked and include instructions for removing it once the real data access is working >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%

echo ## Post-Task Verification >> %TEMP_STATUS_FILE%
echo For each completed task: >> %TEMP_STATUS_FILE%
echo 1. Run 'dir [new_directory] /s /b' to verify new files are in the correct location >> %TEMP_STATUS_FILE%
echo 2. Run appropriate system tests (when applicable): >> %TEMP_STATUS_FILE%
echo    - For server components: 'npm test' or 'node server.js' to verify functionality >> %TEMP_STATUS_FILE%
echo    - For database updates: Verify MongoDB connections and data integrity >> %TEMP_STATUS_FILE%
echo    - For API endpoints: Test with Postman or curl commands >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%

echo ## Project Structure >> %TEMP_STATUS_FILE%
echo The project is organized in a modular architecture with server components and integration with NinjaTrader. >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%

echo ## Completed Components >> %TEMP_STATUS_FILE%
echo - [x] Project repository and structure setup >> %TEMP_STATUS_FILE%
echo - [x] Express server with basic routing >> %TEMP_STATUS_FILE%
echo - [x] MongoDB connection and integration >> %TEMP_STATUS_FILE%
echo - [x] Template model schemas (ATM and Flazh) >> %TEMP_STATUS_FILE%
echo - [x] Basic API endpoints for template management >> %TEMP_STATUS_FILE%
echo - [x] GitHub backup integration >> %TEMP_STATUS_FILE%
echo - [x] MarketDataExporter indicator for NinjaTrader (preexisting) >> %TEMP_STATUS_FILE%
echo - [x] Market data service for integration with NinjaTrader >> %TEMP_STATUS_FILE%
echo - [x] Market news monitoring service >> %TEMP_STATUS_FILE%
echo - [x] Backtesting module for strategy testing >> %TEMP_STATUS_FILE%
echo - [x] Risk management dashboard API >> %TEMP_STATUS_FILE%
echo - [x] Trading journal integration >> %TEMP_STATUS_FILE%
echo - [x] Performance analytics >> %TEMP_STATUS_FILE%
echo - [x] Alert system >> %TEMP_STATUS_FILE%
echo - [x] System health monitoring >> %TEMP_STATUS_FILE%
echo - [x] Template import and validation functionality >> %TEMP_STATUS_FILE%
echo - [x] React dashboard with template recommendations >> %TEMP_STATUS_FILE%
echo - [x] Trading session analysis components >> %TEMP_STATUS_FILE%

echo - [x] Integration of market data and news into recommendation engine >> %TEMP_STATUS_FILE%

rem Add completed Next Steps items to Completed Components
if %COMP_SYSTEM_TESTING%==2 (
    echo - [x] Comprehensive system testing with real market data >> %TEMP_STATUS_FILE%
)
if %COMP_ALGORITHM_REFINE%==2 (
    echo - [x] Refined recommendation algorithms based on backtesting results >> %TEMP_STATUS_FILE%
)
if %COMP_DOCUMENTATION%==2 (
    echo - [x] User documentation and usage guides >> %TEMP_STATUS_FILE%
)
if %COMP_MULTI_INSTRUMENT%==2 (
    echo - [x] Multi-instrument support beyond NQ futures >> %TEMP_STATUS_FILE%
)
if %COMP_DATA_ARCHIVING%==2 (
    echo - [x] Data archiving and cleanup routines for database maintenance >> %TEMP_STATUS_FILE%
)
if %COMP_MOBILE_ACCESS%==2 (
    echo - [x] Mobile access and notifications >> %TEMP_STATUS_FILE%
)
echo. >> %TEMP_STATUS_FILE%

echo ## In Progress >> %TEMP_STATUS_FILE%
if %COMP_SYSTEM_TESTING%==1 (
    echo - [ ] Comprehensive system testing with real market data >> %TEMP_STATUS_FILE%
)
if %COMP_ALGORITHM_REFINE%==1 (
    echo - [ ] Refining recommendation algorithms based on backtesting results >> %TEMP_STATUS_FILE%
)
if %COMP_DOCUMENTATION%==1 (
    echo - [ ] Developing user documentation and usage guides >> %TEMP_STATUS_FILE%
)
if %COMP_MULTI_INSTRUMENT%==1 (
    echo - [ ] Implementing multi-instrument support beyond NQ futures >> %TEMP_STATUS_FILE%
)
if %COMP_DATA_ARCHIVING%==1 (
    echo - [ ] Creating data archiving and cleanup routines >> %TEMP_STATUS_FILE%
)
if %COMP_MOBILE_ACCESS%==1 (
    echo - [ ] Enhancing mobile access and notifications >> %TEMP_STATUS_FILE%
)
echo. >> %TEMP_STATUS_FILE%

echo ## Next Steps >> %TEMP_STATUS_FILE%

set NEXT_ITEM=1
if %COMP_SYSTEM_TESTING%==0 (
    echo %NEXT_ITEM%. Conduct comprehensive system testing with real market data >> %TEMP_STATUS_FILE%
    set /a NEXT_ITEM+=1
)
if %COMP_ALGORITHM_REFINE%==0 (
    echo %NEXT_ITEM%. Refine recommendation algorithms based on backtesting results >> %TEMP_STATUS_FILE%
    set /a NEXT_ITEM+=1
)
if %COMP_DOCUMENTATION%==0 (
    echo %NEXT_ITEM%. Develop user documentation and usage guides >> %TEMP_STATUS_FILE%
    set /a NEXT_ITEM+=1
)
if %COMP_MULTI_INSTRUMENT%==0 (
    echo %NEXT_ITEM%. Implement multi-instrument support beyond NQ futures >> %TEMP_STATUS_FILE%
    set /a NEXT_ITEM+=1
)
if %COMP_DATA_ARCHIVING%==0 (
    echo %NEXT_ITEM%. Create data archiving and cleanup routines for database maintenance >> %TEMP_STATUS_FILE%
    set /a NEXT_ITEM+=1
)
if %COMP_MOBILE_ACCESS%==0 (
    echo %NEXT_ITEM%. Enhance mobile access and notifications >> %TEMP_STATUS_FILE%
)
echo. >> %TEMP_STATUS_FILE%

echo ## Environment Setup >> %TEMP_STATUS_FILE%
echo - Node.js server at C:\TradingDashboard\server >> %TEMP_STATUS_FILE%
echo - MongoDB running locally at mongodb://localhost:27017/trading-dashboard >> %TEMP_STATUS_FILE%
echo - NinjaTrader with MarketDataExporter indicator installed >> %TEMP_STATUS_FILE%
echo - MarketDataExporter writes to C:\NinjaTraderData\VolatilityMetrics.json >> %TEMP_STATUS_FILE%
echo - Requires the database to be running for full functionality >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%

echo ## System Data Flow >> %TEMP_STATUS_FILE%
echo This project follows a specific data flow that must be maintained in all code modifications: >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%
echo 1. **Data Collection**: NinjaTrader with MarketDataExporter indicator exports market data to `C:\NinjaTraderData\VolatilityMetrics.json` >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%
echo 2. **Data Processing**: The server (`marketDataService.js`) reads this JSON file and processes the data >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%
echo 3. **MongoDB Storage**: Processed data is stored in MongoDB collections (marketdatas, templates, etc.) >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%
echo 4. **Template Selection**: When recommendations are needed: >> %TEMP_STATUS_FILE%
echo    - Current market conditions are analyzed (`marketConditionsService.js`) >> %TEMP_STATUS_FILE%
echo    - MongoDB is queried for matching templates (`enhancedTemplateSelector.js`)  >> %TEMP_STATUS_FILE%
echo    - Best templates are selected based on similarity scoring >> %TEMP_STATUS_FILE%
echo    - Recommendations are returned through API endpoints >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%
echo This architecture allows the system to learn and improve over time based on historical data and performance. Any code changes must maintain this flow and never implement permanent bypass solutions that use mock data instead of real database access. >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%

echo ## System Test Commands >> %TEMP_STATUS_FILE%
echo ```text >> %TEMP_STATUS_FILE%
echo # Start MongoDB (if not running as a service) >> %TEMP_STATUS_FILE%
echo mongod --dbpath C:\data\db >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%
echo # Start the server >> %TEMP_STATUS_FILE%
echo cd C:\TradingDashboard\server >> %TEMP_STATUS_FILE%
echo npm start >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%
echo # Test API endpoints >> %TEMP_STATUS_FILE%
echo curl http://localhost:3008/api/templates >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%
echo # Test market data service >> %TEMP_STATUS_FILE%
echo curl http://localhost:3008/api/market-data >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%
echo # Test market news >> %TEMP_STATUS_FILE%
echo curl http://localhost:3008/api/market-news >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%
echo # Test backtesting module >> %TEMP_STATUS_FILE%
echo curl http://localhost:3008/api/backtest >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%
echo # Test risk management >> %TEMP_STATUS_FILE%
echo curl http://localhost:3008/api/risk/dashboard >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%
echo # Test trading journal >> %TEMP_STATUS_FILE%
echo curl http://localhost:3008/api/journal >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%
echo # Test performance analytics >> %TEMP_STATUS_FILE%
echo curl http://localhost:3008/api/analytics/performance >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%
echo # Test alert system >> %TEMP_STATUS_FILE%
echo curl http://localhost:3008/api/alerts >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%
echo # Test system health >> %TEMP_STATUS_FILE%
echo curl http://localhost:3008/api/health >> %TEMP_STATUS_FILE%
echo ``` >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%

echo ## Current Directory Structure >> %TEMP_STATUS_FILE%
echo ```text >> %TEMP_STATUS_FILE%

rem Capture directory listings to temporary files to avoid errors
dir %SERVER_DIR% /b > "%TEMP%\root_dir.txt" 2>nul
type "%TEMP%\root_dir.txt" >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%

echo server\config: >> %TEMP_STATUS_FILE%
dir %SERVER_DIR%\config /b > "%TEMP%\config_dir.txt" 2>nul
type "%TEMP%\config_dir.txt" >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%

echo server\models: >> %TEMP_STATUS_FILE%
dir %SERVER_DIR%\models /b > "%TEMP%\models_dir.txt" 2>nul
type "%TEMP%\models_dir.txt" >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%

echo server\routes: >> %TEMP_STATUS_FILE%
dir %SERVER_DIR%\routes /b > "%TEMP%\routes_dir.txt" 2>nul
type "%TEMP%\routes_dir.txt" >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%

echo server\services: >> %TEMP_STATUS_FILE%
dir %SERVER_DIR%\services /b > "%TEMP%\services_dir.txt" 2>nul
type "%TEMP%\services_dir.txt" >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%

echo server\test: >> %TEMP_STATUS_FILE%
dir %SERVER_DIR%\test /b > "%TEMP%\test_dir.txt" 2>nul
type "%TEMP%\test_dir.txt" >> %TEMP_STATUS_FILE%
echo. >> %TEMP_STATUS_FILE%

echo server\utils: >> %TEMP_STATUS_FILE%
dir %SERVER_DIR%\utils /b > "%TEMP%\utils_dir.txt" 2>nul
type "%TEMP%\utils_dir.txt" >> %TEMP_STATUS_FILE%

echo ``` >> %TEMP_STATUS_FILE%

rem Clean up temporary files
del "%TEMP%\root_dir.txt" 2>nul
del "%TEMP%\config_dir.txt" 2>nul
del "%TEMP%\models_dir.txt" 2>nul
del "%TEMP%\routes_dir.txt" 2>nul
del "%TEMP%\services_dir.txt" 2>nul
del "%TEMP%\test_dir.txt" 2>nul
del "%TEMP%\utils_dir.txt" 2>nul

echo.
rem Copy the temp file to the status file
echo.
echo Finalizing status file...

rem Check if the status file exists and close it if it's open in Notepad
taskkill /f /im notepad.exe /fi "WINDOWTITLE eq project-status.md*" >nul 2>nul

rem Try to copy the temp file to the status file
copy /y "%TEMP_STATUS_FILE%" "%STATUS_FILE%" >nul 2>nul

rem If copy failed, try again after a short delay
if errorlevel 1 (
    echo Waiting for file access...
    timeout /t 3 /nobreak >nul
    copy /y "%TEMP_STATUS_FILE%" "%STATUS_FILE%" >nul 2>nul
)

rem If copy still failed, inform the user
if errorlevel 1 (
    echo WARNING: Could not update %STATUS_FILE%
    echo Please make sure the file is not open in another program.
    echo The temporary status file is available at %TEMP_STATUS_FILE%
) else (
    del "%TEMP_STATUS_FILE%" 2>nul
    echo Status file generated at %STATUS_FILE%
    echo.
    echo Opening status file...
    start notepad %STATUS_FILE%
)

echo.
echo ==========================================
echo Status Check Results:
echo ==========================================
echo.
if %COMP_SYSTEM_TESTING%==2 (
    echo [COMPLETED] Comprehensive system testing with real market data
) else if %COMP_SYSTEM_TESTING%==1 (
    echo [IN PROGRESS] Comprehensive system testing with real market data
) else (
    echo [NOT STARTED] Comprehensive system testing with real market data
)

if %COMP_ALGORITHM_REFINE%==2 (
    echo [COMPLETED] Refining recommendation algorithms
) else if %COMP_ALGORITHM_REFINE%==1 (
    echo [IN PROGRESS] Refining recommendation algorithms
) else (
    echo [NOT STARTED] Refining recommendation algorithms
)

if %COMP_DOCUMENTATION%==2 (
    echo [COMPLETED] User documentation and guides
) else if %COMP_DOCUMENTATION%==1 (
    echo [IN PROGRESS] User documentation and guides
) else (
    echo [NOT STARTED] User documentation and guides
)

if %COMP_MULTI_INSTRUMENT%==2 (
    echo [COMPLETED] Multi-instrument support
) else if %COMP_MULTI_INSTRUMENT%==1 (
    echo [IN PROGRESS] Multi-instrument support
) else (
    echo [NOT STARTED] Multi-instrument support
)

if %COMP_DATA_ARCHIVING%==2 (
    echo [COMPLETED] Data archiving routines
) else if %COMP_DATA_ARCHIVING%==1 (
    echo [IN PROGRESS] Data archiving routines
) else (
    echo [NOT STARTED] Data archiving routines
)

if %COMP_MOBILE_ACCESS%==2 (
    echo [COMPLETED] Mobile access and notifications
) else if %COMP_MOBILE_ACCESS%==1 (
    echo [IN PROGRESS] Mobile access and notifications
) else (
    echo [NOT STARTED] Mobile access and notifications
)
echo.
echo ==========================================
echo.

pause