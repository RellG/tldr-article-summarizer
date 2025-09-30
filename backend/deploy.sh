#!/bin/bash

# Article Summarizer API Deployment Script
# Run this on your Linux server

set -e  # Exit on any error

echo "========================================="
echo "Article Summarizer API - Deployment"
echo "========================================="

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "Please do not run as root. Run as a regular user with sudo privileges."
    exit 1
fi

# Update system
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js if not already installed
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "Node.js already installed: $(node --version)"
fi

# Install npm dependencies
echo "Installing npm dependencies..."
npm install

# Setup environment file
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo ""
    echo "========================================="
    echo "IMPORTANT: Edit .env file and add your Anthropic API key"
    echo "Get your API key at: https://console.anthropic.com/"
    echo "========================================="
    read -p "Press Enter to continue after you've edited .env..."
fi

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2 process manager..."
    sudo npm install -g pm2
else
    echo "PM2 already installed"
fi

# Stop existing PM2 process if running
pm2 delete article-summarizer-api 2>/dev/null || true

# Start the API with PM2
echo "Starting API with PM2..."
pm2 start server.js --name article-summarizer-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup | tail -n 1 | sudo bash

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo "API is running on port 3000"
echo ""
echo "Useful commands:"
echo "  pm2 status              - Check API status"
echo "  pm2 logs                - View logs"
echo "  pm2 restart article-summarizer-api - Restart API"
echo "  pm2 stop article-summarizer-api    - Stop API"
echo ""
echo "Next steps:"
echo "1. Configure nginx as reverse proxy (optional)"
echo "2. Setup SSL with Let's Encrypt"
echo "3. Test your API: curl http://localhost:3000/health"
echo "========================================="