@echo off
rem Starts the simulator dev server (serve.py) from this folder.
rem Double-click this file, then open http://localhost:8080/simulator.html
cd /d "%~dp0"

REM Pull first - the Studio commits to GitHub, so this folder goes stale.
call "%~dp0update-repo.bat"

echo Starting DC Franchise simulator server on http://localhost:8080 ...
echo Leave this window open while you work. Close it to stop the server.
python serve.py
pause
