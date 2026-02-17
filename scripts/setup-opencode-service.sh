#!/bin/bash

# Setup script for OpenCode systemd service
# Installs and enables the OpenCode server to start on boot

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="/home/pedroocalado/ai4all/AI4ALL"

echo "🔧 OpenCode Systemd Service Setup"
echo "=================================="
echo ""

# Check if opencode exists
if [ ! -f "/home/pedroocalado/.opencode/bin/opencode" ]; then
    echo "❌ Error: OpenCode binary not found at /home/pedroocalado/.opencode/bin/opencode"
    exit 1
fi

echo "✅ OpenCode binary found"

# Create log directory if needed
mkdir -p /home/pedroocalado
touch /home/pedroocalado/opencode.log
echo "✅ Log file ready: /home/pedroocalado/opencode.log"

# Stop existing service if running
echo "🔄 Stopping existing OpenCode service..."
sudo systemctl stop opencode 2>/dev/null || true

# Copy service file
echo "📦 Installing systemd service..."
sudo cp "$SCRIPT_DIR/opencode.service" /etc/systemd/system/

# Reload systemd
echo "🔄 Reloading systemd..."
sudo systemctl daemon-reload

# Enable service to start on boot
echo "✅ Enabling service to start on boot..."
sudo systemctl enable opencode.service

# Start the service now
echo "🚀 Starting OpenCode service..."
sudo systemctl start opencode.service

echo ""
echo "=================================="
echo "✅ OpenCode service installed!"
echo ""
echo "📊 Service Status:"
sudo systemctl status opencode --no-pager -l
echo ""
echo "📋 Useful Commands:"
echo "  View logs:     tail -f /home/pedroocalado/opencode.log"
echo "  Restart:       sudo systemctl restart opencode"
echo "  Stop:          sudo systemctl stop opencode"
echo "  Status:        sudo systemctl status opencode"
echo "  Disable:       sudo systemctl disable opencode"
echo ""
echo "🌐 Access OpenCode at: http://192.168.1.67:3000"
