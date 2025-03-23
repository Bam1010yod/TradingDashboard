# NinjaTrader Integration Guide

This document provides instructions for integrating the TradingDashboard with NinjaTrader 8.

## Overview

The integration works by:
1. The web interface allows you to select market session and volatility settings
2. When you click "Apply", these settings are sent to the server
3. The server creates template files directly in the NinjaTrader template directories:
   - ATM templates: C:\Users\[YourUsername]\Documents\NinjaTrader 8\templates\ATM
   - Flazh templates: C:\Users\[YourUsername]\Documents\NinjaTrader 8\templates\Indicator\RenkoKings_FlazhInfinity
4. NinjaTrader automatically recognizes these templates when loading indicators or ATM strategies

## Usage

1. On the TradingDashboard Market Conditions page, select your desired session and volatility settings
2. Click "Apply"
3. The templates are created in the appropriate NinjaTrader directories
4. In NinjaTrader:
   - To use the ATM strategy, in the SuperDOM click the "ATM Strategy" drop-down and select the template with the name matching your session and volatility
   - To use the Flazh Infinity settings, right-click on the indicator on your chart, select "Format...", then the "Parameters" tab, and click the "Load" button to select the template

## Troubleshooting

- If settings are not being applied, check the server logs for any errors
- Ensure the server has write permissions to the NinjaTrader template directories
- Verify that NinjaTrader can see the template files (they should appear in the template selection dropdowns)
- Make sure NinjaTrader is not running in protected mode which could prevent file access

## Advanced Configuration

For advanced users, you can modify the paths in the `ninjaTraderIntegrationService.js` file to change the template directories if your NinjaTrader installation uses different paths.