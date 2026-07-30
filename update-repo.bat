@echo off
REM Bring this folder up to date with what the Casting Studio published.
REM
REM The Studio saves through the Cloudflare Worker, which commits straight to
REM GitHub, so this folder goes stale on its own. The launchers call this before
REM starting the server so you are never working against old files.
REM
REM Deliberately cautious:
REM   * does nothing if this isn't a git checkout
REM   * refuses to pull over uncommitted changes rather than tangling them
REM   * never fails the caller - a missing network just means old files

cd /d "%~dp0"

git rev-parse --is-inside-work-tree >nul 2>&1
if errorlevel 1 goto :done

git diff --quiet >nul 2>&1
if errorlevel 1 goto :dirty
git diff --cached --quiet >nul 2>&1
if errorlevel 1 goto :dirty

git pull --ff-only --quiet >nul 2>&1
if errorlevel 1 goto :offline
echo [ok] Up to date with GitHub.
goto :done

:dirty
echo [skip] You have uncommitted changes - not pulling.
goto :done

:offline
echo [warn] Could not reach GitHub - using the files already here.

:done
exit /b 0
