#!/bin/bash

# Navigate to the project directory
cd /c/TradingDashboard

# Add all changes to Git
git add .

# Commit the changes
git commit -m "Automated backup - $(date +'%Y-%m-%d %H:%M:%S')"

# Push to GitHub
git push origin main

# Check if the push was successful
if [ $? -eq 0 ]; then
    echo "Changes pushed to GitHub successfully!"
else
    echo "Error: Failed to push changes to GitHub."
    exit 1
fi