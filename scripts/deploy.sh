#!/bin/bash

# Questino.io Deployment Script
# This script helps prepare and deploy your Questino.io application

set -e  # Exit on any error

echo "🚀 Questino.io Deployment Script"
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Please create one with your environment variables."
    echo "   See DEPLOYMENT.md for required variables."
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo "📦 Installing dependencies..."
npm install

echo "🔍 Running linting..."
npm run lint

echo "🏗️  Building for production..."
npm run build

echo "✅ Build completed successfully!"
echo ""
echo "📁 Build output is in the 'dist' folder"
echo "📊 Bundle size:"
du -sh dist/*

echo ""
echo "🧪 Testing build locally..."
npm run preview &
PREVIEW_PID=$!

# Wait a moment for the server to start
sleep 3

echo ""
echo "🌐 Preview server started at http://localhost:4173"
echo "   Press Ctrl+C to stop the preview server"
echo ""
echo "📋 Next steps:"
echo "   1. Test your application at http://localhost:4173"
echo "   2. Follow the testing checklist in TESTING.md"
echo "   3. Deploy to your chosen platform (see DEPLOYMENT.md)"
echo ""

# Wait for user to stop the preview
wait $PREVIEW_PID
