#!/bin/bash

# Guardian Shield - Quick Start Script

echo "🛡️ Guardian Shield - Security Scanning Platform"
echo "================================================"
echo ""

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo ""
echo "✅ Installation complete!"
echo ""
echo "🚀 To start the application:"
echo ""
echo "Terminal 1 (Backend):"
echo "  cd backend"
echo "  npm run dev"
echo ""
echo "Terminal 2 (Frontend):"
echo "  cd frontend"
echo "  npm run dev"
echo ""
echo "Then open: http://localhost:5173"
echo ""
echo "Features:"
echo "  🔍 Vulnerability Scanner - Scan URLs and code files"
echo "  🦠 Virus Scanner - Upload and scan files for malware"
echo "  🔐 Password Analyzer - Check password strength and store safely"
echo "  🤖 Security Chatbot - Get expert security guidance"
echo ""
