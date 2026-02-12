#!/bin/bash

# ClearCash Setup Script
# Automates the complete project setup

set -e  # Exit on error

echo "╔═══════════════════════════════════════════╗"
echo "║                                           ║"
echo "║     💰 ClearCash Setup Script 💰         ║"
echo "║                                           ║"
echo "╚═══════════════════════════════════════════╝"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Setup Server
echo "📦 Setting up server..."
cd server

if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    
    # Generate random JWT secret
    JWT_SECRET=$(openssl rand -base64 32 2>/dev/null || head -c 32 /dev/urandom | base64)
    
    # Update .env with generated secret
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/" .env
    else
        sed -i "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/" .env
    fi
    
    echo "✅ .env file created with secure JWT_SECRET"
    echo "⚠️  Please edit server/.env to add Twilio credentials (optional)"
else
    echo "✅ .env file already exists"
fi

echo "📥 Installing server dependencies..."
npm install --silent

echo "✅ Server setup complete!"
echo ""

# Setup Client
cd ../client
echo "📦 Setting up client..."
echo "📥 Installing client dependencies..."
npm install --silent

echo "✅ Client setup complete!"
echo ""

# Back to root
cd ..

# Success message
echo "╔═══════════════════════════════════════════╗"
echo "║                                           ║"
echo "║     ✅ Setup Complete! ✅                ║"
echo "║                                           ║"
echo "╚═══════════════════════════════════════════╝"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "1. Review configuration:"
echo "   cd server && nano .env"
echo ""
echo "2. Start the backend:"
echo "   cd server && npm run dev"
echo ""
echo "3. In a new terminal, start the frontend:"
echo "   cd client && npm run dev"
echo ""
echo "4. Open your browser to:"
echo "   http://localhost:5173"
echo ""
echo "📚 Documentation:"
echo "   • README.md - Main overview"
echo "   • docs/API.md - API reference"
echo "   • docs/HACKATHON.md - Demo script"
echo ""
echo "💡 Tips:"
echo "   • Install Defly Wallet extension/app"
echo "   • Get testnet ALGO from dispenser"
echo "   • Configure Twilio for emergency SMS (optional)"
echo ""
echo "Happy budgeting! 💰✨"
