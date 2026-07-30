@echo off
REM Bring this folder up to date with what the Casting Studio published.
REM
REM The Studio saves through the Cloudflare Worker, which commits straight to
REM GitHub — so the live site is correct immediately, but THIS folder knows
REM nothing about it until you pull. Double-click this when a local file looks
REM out of date, or before running the simulator locally.

cd /d "%~dp0"
echo Fetching...
git fetch origin
git --no-pager log --oneline HEAD..origin/main
echo.

git diff --quiet && git diff --cached --quiet
if errorlevel 1 (
  echo You have uncommitted changes, so nothing was pulled.
  echo Commit or stash them first, then run this again.
  echo.
  git --no-pager status --short
  pause
  exit /b 1
)

git pull --ff-only
echo.
echo Up to date.
pause
