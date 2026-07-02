@echo off
echo ========================================
echo   Address Autofill API Server (uv)
echo ========================================
echo.

cd /d "%~dp0"

REM Check if uv is installed
where uv >nul 2>nul
if %errorlevel% neq 0 (
    echo uv not found, installing...
    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
)

echo [1/2] Installing dependencies with uv...
uv sync

echo.
echo [2/2] Starting server...
echo.
uv run server.py

pause
