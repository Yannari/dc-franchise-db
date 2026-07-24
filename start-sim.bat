@echo off
title DC Franchise Simulator server
cd /d "%~dp0"
echo Serving the simulator (no-cache) on:
echo   http://localhost:8000/simulator.html
echo   http://192.168.2.17:8000/simulator.html  (LAN)
echo Keep this window open. Close it to stop the server.
python serve.py 8000
pause
