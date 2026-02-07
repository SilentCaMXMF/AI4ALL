#!/bin/bash

# Setup script for AI4ALL local hosting services
# Install systemd services for auto-start and monitoring

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="/home/pedroocalado/ai4all/AI4ALL"

echo "🔧 AI4ALL Local Hosting Setup"
echo "=============================="
echo ""

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p "$PROJECT_DIR/logs"
mkdir -p "$PROJECT_DIR/data"

# Install systemd services
echo "🔌 Installing systemd services..."

# Stop existing services if running
sudo systemctl stop ai4all-dashboard 2>/dev/null || true
sudo systemctl stop ai4all-watcher 2>/dev/null || true

# Copy service files
sudo cp "$SCRIPT_DIR/ai4all-dashboard.service" /etc/systemd/system/
sudo cp "$SCRIPT_DIR/ai4all-watcher.service" /etc/systemd/system/

# Reload systemd
sudo systemctl daemon-reload

# Enable services to start on boot
sudo systemctl enable ai4all-dashboard.service
sudo systemctl enable ai4all-watcher.service

# Start services
sudo systemctl start ai4all-dashboard.service
sudo systemctl start ai4all-watcher.service

echo ""
echo "✅ Services installed and started!"
echo ""
echo "📊 Status:"
sudo systemctl status ai4all-dashboard --no-pager -l
sudo systemctl status ai4all-watcher --no-pager -l

echo ""
echo "🔗 Access your dashboard:"
echo "  Local: http://localhost:8001/dashboard.html"
echo "  Network: http://$(hostname -I | awk '{print $1}'):8001/dashboard.html"
echo ""
echo "📋 Useful commands:"
echo "  View logs: tail -f $PROJECT_DIR/logs/web-server.log"
echo "  Restart: sudo systemctl restart ai4all-dashboard"
echo "  Stop: sudo systemctl stop ai4all-dashboard"
echo "  Status: sudo systemctl status ai4all-dashboard"
