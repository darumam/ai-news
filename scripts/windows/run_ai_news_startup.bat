@echo off
setlocal

rem AI Signal Board startup helper.
rem This script updates the local inbox only. Codex summarization still needs
rem to be started from Codex when you want AI-written summaries.

set "PROJECT_DIR=%~dp0..\.."
cd /d "%PROJECT_DIR%"

where python >nul 2>nul
if %ERRORLEVEL%==0 (
  python scripts\crawl_sources.py
  goto done
)

where py >nul 2>nul
if %ERRORLEVEL%==0 (
  py -3 scripts\crawl_sources.py
  goto done
)

echo Python was not found. Install Python or use GitHub Actions for crawling.
exit /b 1

:done
echo AI Signal Board crawl finished.
exit /b 0
