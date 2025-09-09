@echo off
REM Questino.io Deployment Script for Windows
REM This script helps prepare and deploy your Questino.io application

echo 🚀 Questino.io Deployment Script
echo ================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Please run this script from the project root.
    pause
    exit /b 1
)

REM Check if .env file exists
if not exist ".env" (
    echo ⚠️  Warning: .env file not found. Please create one with your environment variables.
    echo    See DEPLOYMENT.md for required variables.
    set /p continue="Continue anyway? (y/N): "
    if /i not "%continue%"=="y" (
        exit /b 1
    )
)

echo 📦 Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Error: Failed to install dependencies
    pause
    exit /b 1
)

echo 🔍 Running linting...
call npm run lint
if errorlevel 1 (
    echo ❌ Error: Linting failed
    pause
    exit /b 1
)

echo 🏗️  Building for production...
call npm run build
if errorlevel 1 (
    echo ❌ Error: Build failed
    pause
    exit /b 1
)

echo ✅ Build completed successfully!
echo.
echo 📁 Build output is in the 'dist' folder
echo 📊 Bundle size:
dir dist /s

echo.
echo 🧪 Testing build locally...
echo 🌐 Starting preview server at http://localhost:4173
echo    Press Ctrl+C to stop the preview server
echo.
echo 📋 Next steps:
echo    1. Test your application at http://localhost:4173
echo    2. Follow the testing checklist in TESTING.md
echo    3. Deploy to your chosen platform (see DEPLOYMENT.md)
echo.

call npm run preview
