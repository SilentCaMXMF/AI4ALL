#!/bin/bash
# Setup DuckDNS and nginx for Free AI Models dashboard
# Run this on your Raspberry Pi

set -e

echo "🌐 Setting up DuckDNS + Nginx for Public Access"
echo "================================================"
echo ""

# Get DuckDNS credentials
echo "📝 Step 1: DuckDNS Setup"
echo "------------------------"
echo ""
echo "1. Go to https://www.duckdns.org"
echo "2. Sign in with Google, GitHub, Twitter, or Reddit"
echo "3. Create a subdomain (e.g., 'freeaimodels')"
echo "4. Copy your TOKEN from the page"
echo ""
read -p "Enter your DuckDNS subdomain (e.g., freeaimodels): " DUCKDNS_DOMAIN
read -p "Enter your DuckDNS token: " DUCKDNS_TOKEN

echo ""
echo "✅ Setting up DuckDNS for: ${DUCKDNS_DOMAIN}.duckdns.org"

# Create duckdns directory
mkdir -p ~/duckdns
cd ~/duckdns

# Create update script
cat > duck.sh << EOF
#!/bin/bash
echo url="https://www.duckdns.org/update?domains=${DUCKDNS_DOMAIN}&token=${DUCKDNS_TOKEN}&ip=" | curl -k -o ~/duckdns/duck.log -K -
EOF

chmod 700 duck.sh

# Test it
echo ""
echo "🔧 Testing DuckDNS update..."
./duck.sh

if grep -q "OK" ~/duckdns/duck.log; then
    echo "✅ DuckDNS updated successfully!"
else
    echo "⚠️  DuckDNS update failed. Check your token and domain."
    cat ~/duckdns/duck.log
    exit 1
fi

# Add to crontab (every 5 minutes)
echo ""
echo "🔧 Adding to crontab (updates every 5 minutes)..."
(crontab -l 2>/dev/null || true) | grep -v "duck.sh" | crontab -
(crontab -l 2>/dev/null; echo "*/5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1") | crontab -

echo "✅ Crontab updated"

# Update nginx config with the domain
echo ""
echo "🔧 Step 2: Updating Nginx Configuration"
echo "---------------------------------------"

sudo tee /etc/nginx/sites-available/free-ai-models << EOF
server {
    listen 80;
    server_name ${DUCKDNS_DOMAIN}.duckdns.org localhost _;

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
        try_files \$uri \$uri/ =404;
    }

    # Data file proxy to local server
    location /data/ {
        proxy_pass http://127.0.0.1:8001/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Cache data for 5 minutes
        expires 5m;
        add_header Cache-Control "public, must-revalidate";
    }

    # Static assets with caching
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)\$ {
        expires 1d;
        add_header Cache-Control "public, immutable";
    }

    # Deny access to sensitive files
    location ~ /\\. {
        deny all;
    }
    
    location ~ /(src|scripts|node_modules)/ {
        deny all;
    }
}
EOF

# Test and reload nginx
echo ""
echo "🔧 Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration valid"
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded"
else
    echo "❌ Nginx configuration failed"
    exit 1
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "Your Free AI Models dashboard is now accessible at:"
echo "  🌐 http://${DUCKDNS_DOMAIN}.duckdns.org/dashboard.html"
echo ""
echo "📋 Summary:"
echo "  • Domain: ${DUCKDNS_DOMAIN}.duckdns.org"
echo "  • Local: http://localhost/dashboard.html"
echo "  • DuckDNS updates: Every 5 minutes"
echo ""
echo "🔒 Next Step - Add HTTPS (Recommended):"
echo "  Run: sudo certbot --nginx -d ${DUCKDNS_DOMAIN}.duckdns.org"
echo ""
echo "⚠️  IMPORTANT: Port Forwarding Required"
echo "  You still need to forward port 80 on your router:"
echo "  External 80 → 192.168.1.67:80"
echo ""
echo "🧪 Test Commands:"
echo "  curl http://${DUCKDNS_DOMAIN}.duckdns.org/dashboard.html"
echo "  curl http://${DUCKDNS_DOMAIN}.duckdns.org/data/aggregated-data.json"
