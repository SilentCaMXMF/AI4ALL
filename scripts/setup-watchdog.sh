#!/bin/bash

# Setup script for Watchdog with 10-minute timeout
# Auto-reboots if system hangs for 10 minutes

set -e

echo "🐕 Watchdog Setup - 10 Minute Timeout"
echo "======================================"
echo ""

# Install watchdog package
echo "📦 Installing watchdog..."
sudo apt-get update
sudo apt-get install -y watchdog

# Enable watchdog kernel module
echo "🔧 Enabling watchdog kernel module..."
echo "bcm2835_wdt" | sudo tee /etc/modules-load.d/watchdog.conf

# Load the module now
sudo modprobe bcm2835_wdt

# Configure watchdog
echo "⚙️ Configuring watchdog..."

# Backup existing config
sudo cp /etc/watchdog.conf /etc/watchdog.conf.bak 2>/dev/null || true

# Write new watchdog config
sudo tee /etc/watchdog.conf > /dev/null << 'EOF'
# Watchdog configuration for Raspberry Pi
# Auto-reboot after 10 minutes (600 seconds) of hang

# Device to use
watchdog-device = /dev/watchdog

# Timeout in seconds (10 minutes = 600 seconds)
watchdog-timeout = 600

# Ping interval (how often to check system is alive)
ping-interval = 10
ping-file = /var/log/watchdog.ping

# Temperature monitoring (optional - disable if not using)
/* temperature = 85 */

# Load average threshold (optional)
/* max-load-1 = 24 */

# Don't fork, run in foreground
fork = no

# Enable logging
log-dir = /var/log/watchdog

# File to test for accessibility
# test-binary = /usr/bin/test
EOF

echo "✅ Watchdog configured with 10-minute timeout"

# Install systemd service for timeout setting
echo "📦 Installing systemd service for timeout..."
sudo cp "$(dirname "$0")/watchdog-timeout.service" /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable watchdog-timeout.service
sudo systemctl start watchdog-timeout.service

# Enable and start watchdog service
echo "🚀 Starting watchdog service..."
sudo systemctl enable watchdog.service
sudo systemctl start watchdog.service

# Verify it's running
echo ""
echo "======================================"
echo "✅ Watchdog installed successfully!"
echo ""
echo "📊 Status:"
sudo systemctl status watchdog --no-pager -l

echo ""
echo "📋 Configuration:"
echo "  Timeout: 600 seconds (10 minutes)"
echo "  Device: /dev/watchdog"
echo "  Module: bcm2835_wdt"
echo ""
echo "📝 If system hangs for 10 minutes, it will auto-reboot!"

# Test watchdog (optional - WARNING: will reboot if watchdog fires)
echo ""
echo "⚠️  To test watchdog, run:"
echo "   sudo modprobe test_wdt"
echo "   (This will cause an immediate reboot - FOR TESTING ONLY)"
