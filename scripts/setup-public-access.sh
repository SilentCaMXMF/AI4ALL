#!/bin/bash
# Setup script for public access to Free AI Models dashboard
# Run on Raspberry Pi 3+

set -e

echo "🚀 Setting up public access for Free AI Models Dashboard"
echo "=========================================================="

# Check if running as root for some operations
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  Some operations require sudo. You may be prompted for password."
fi

PROJECT_DIR="/home/pedroocalado/ai4all/AI4ALL"
LOCAL_PORT=8001
PUBLIC_PORT=80

echo ""
echo "📋 Configuration:"
echo "   Project directory: $PROJECT_DIR"
echo "   Local port: $LOCAL_PORT"
echo "   Public port: $PUBLIC_PORT (HTTP)"
echo ""

# Install nginx if not present
echo "🔧 Step 1: Installing nginx reverse proxy..."
if ! command -v nginx &> /dev/null; then
    sudo apt-get update
    sudo apt-get install -y nginx
    echo "✅ Nginx installed"
else
    echo "✅ Nginx already installed"
fi

# Create nginx configuration
echo ""
echo "🔧 Step 2: Configuring nginx..."
sudo tee /etc/nginx/sites-available/free-ai-models << 'EOF'
server {
    listen 80;
    server_name _;  # Accept any hostname

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Root directory
    root /home/pedroocalado/ai4all/AI4ALL;
    index dashboard.html;

    # Main dashboard
    location / {
        try_files $uri $uri/ /dashboard.html;
    }

    # Data file proxy to local server
    location /data/ {
        proxy_pass http://127.0.0.1:8001/data/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Cache data for 5 minutes
        expires 5m;
        add_header Cache-Control "public, must-revalidate";
    }

    # Static assets with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ /(src|scripts|node_modules)/ {
        deny all;
    }
}
EOF

# Enable the site
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/free-ai-models /etc/nginx/sites-enabled/free-ai-models

# Test nginx configuration
sudo nginx -t

# Restart nginx
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "✅ Nginx configured and started"

# Update web server to only serve data directory
echo ""
echo "🔧 Step 3: Updating web server service..."
sudo tee /etc/systemd/system/ai4all-dashboard.service << EOF
[Unit]
Description=AI4ALL Dashboard Data Server
After=network.target

[Service]
Type=simple
User=pedroocalado
WorkingDirectory=$PROJECT_DIR
ExecStart=/usr/bin/python3 -m http.server 8001 --directory $PROJECT_DIR/data
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl restart ai4all-dashboard

echo "✅ Web server service updated"

# Get network info
echo ""
echo "📊 Network Information:"
echo "======================="
LOCAL_IP=$(hostname -I | awk '{print $1}')
echo "   Local IP: $LOCAL_IP"
echo "   Local URL: http://$LOCAL_IP"

# Get public IP
PUBLIC_IP=$(curl -s ifconfig.me || echo "Unable to detect")
if [ "$PUBLIC_IP" != "Unable to detect" ]; then
    echo "   Public IP: $PUBLIC_IP"
    echo "   Public URL (before port forwarding): http://$PUBLIC_IP (needs router config)"
fi

echo ""
echo "📝 NEXT STEPS TO MAKE IT PUBLIC:"
echo "================================"
echo ""
echo "1. 🔧 Port Forwarding (REQUIRED):"
echo "   - Access your router's admin panel (usually http://192.168.1.1)"
echo "   - Find 'Port Forwarding' or 'Virtual Server' settings"
echo "   - Add rule: External port 80 → Internal $LOCAL_IP:80"
echo "   - Save and apply settings"
echo ""
echo "2. 🌐 Dynamic DNS (RECOMMENDED - since home IP changes):"
echo "   Options:"
echo "   a) DuckDNS (free): https://www.duckdns.org"
echo "   b) No-IP (free): https://www.noip.com"
echo "   c) Cloudflare (free with domain): https://cloudflare.com"
echo ""
echo "   For DuckDNS setup:"
echo "   - Create account at duckdns.org"
echo "   - Choose a subdomain (e.g., freeaimodels)"
echo "   - Your domain will be: freeaimodels.duckdns.org"
echo "   - Point it to your public IP: $PUBLIC_IP"
echo ""
echo "3. 🔒 SSL/HTTPS (RECOMMENDED):"
echo "   Once you have a domain, you can get free SSL with Let's Encrypt:"
echo "   sudo apt-get install certbot python3-certbot-nginx"
echo "   sudo certbot --nginx -d yourdomain.duckdns.org"
echo ""
echo "✅ Local server setup complete!"
echo ""
echo "📍 Your dashboard is accessible at:"
echo "   Local: http://localhost/dashboard.html"
echo "   Network: http://$LOCAL_IP/dashboard.html"
echo ""
echo "🌐 After port forwarding, it will be accessible at:"
echo "   http://$PUBLIC_IP (or your domain)"
echo ""
echo "💡 To check if port forwarding is working:"
echo "   Visit: https://www.yougetsignal.com/tools/open-ports/"
echo "   Check if port 80 is open on your public IP"
