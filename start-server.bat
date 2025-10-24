@echo off
cd /d %~dp0

:: Start the Node.js server in the current terminal in the background
start "" /B npm start

:: Wait a few seconds for the server to start
timeout /t 5 /nobreak >nul

:: Open the default browser to localhost:3000
start http://localhost:3000

