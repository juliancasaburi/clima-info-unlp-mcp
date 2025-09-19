@echo off
echo 📦 Creating Lambda ZIP package...
echo.

:: Build the project first
echo 🔨 Building project...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Build failed!
    exit /b 1
)

:: Run the PowerShell packaging script
echo.
echo 📦 Creating ZIP package...
powershell -ExecutionPolicy Bypass -File "%~dp0package-lambda.ps1"

if %errorlevel% equ 0 (
    echo.
    echo ✅ Package created successfully!
    echo 📁 Check the 'dist' folder for the ZIP file.
) else (
    echo ❌ Packaging failed!
    exit /b 1
)

pause