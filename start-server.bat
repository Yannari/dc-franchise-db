@echo off
rem Starts the simulator dev server (serve.py) from this folder.
rem Double-click this file, then open http://localhost:8080/simulator.html
cd /d "%~dp0"
echo Starting DC Franchise simulator server on http://localhost:8080 ...
echo Leave this window open while you work. Close it to stop the server.
python serve.py
pause
