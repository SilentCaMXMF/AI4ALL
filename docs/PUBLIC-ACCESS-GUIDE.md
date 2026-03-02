# 🌐 Public Access Setup Guide

Your Free AI Models dashboard is now running locally and ready to be exposed to the internet!

## ✅ Current Status

**Local Access (Working):**
- Dashboard: http://localhost/dashboard.html
- Network: http://192.168.1.67/dashboard.html
- Data API: http://localhost/data/aggregated-data.json

**Services Running:**
- ✅ Nginx reverse proxy (port 80)
- ✅ Data server (port 8001)
- ✅ Both auto-start on boot

---

## 🔓 Step 1: Port Forwarding (REQUIRED)

You need to configure your router to forward external traffic to your Raspberry Pi.

### Find Your Router's Admin Panel

1. **Check your default gateway:**
   ```bash
   ip route | grep default
   ```
   Usually: `192.168.1.1` or `192.168.0.1`

2. **Open router admin in browser:**
   - http://192.168.1.1 (or your gateway IP)

### Configure Port Forwarding

Look for these menu options (varies by router brand):
- **Port Forwarding**
- **Virtual Server**
- **Port Mapping**
- **NAT Rules**

**Add this rule:**
```
External Port: 80
Internal IP: 192.168.1.67 (your Pi's IP)
Internal Port: 80
Protocol: TCP
```

**Save and apply settings.**

### Find Your Public IP

```bash
curl ifconfig.me
```

Your public URL will be: `http://<public-ip>/dashboard.html`

---

## 🌐 Step 2: Dynamic DNS (RECOMMENDED)

Your home IP address changes periodically. Use a free dynamic DNS service to get a permanent domain.

### Option A: DuckDNS (Easiest & Free)

1. **Create account:** https://www.duckdns.org
2. **Choose a subdomain** (e.g., `freeaimodels`)
3. **Your domain:** `freeaimodels.duckdns.org`
4. **Install the client on your Pi:**
   ```bash
   # Install DuckDNS client
   mkdir -p ~/duckdns
   cd ~/duckdns
   
   # Create update script
   echo "#!/bin/bash" > duck.sh
   echo "echo url=\"https://www.duckdns.org/update?domains=YOURDOMAIN&token=YOURTOKEN&ip=\" | curl -k -o ~/duckdns/duck.log -K -" >> duck.sh
   chmod 700 duck.sh
   
   # Run it now
   ./duck.sh
   ```
5. **Add to crontab** (runs every 5 minutes):
   ```bash
   crontab -e
   # Add this line:
   */5 * * * * ~/duckdns/duck.sh >/dev/null 2>&1
   ```

### Option B: No-IP (Free)

1. Sign up: https://www.noip.com
2. Create hostname (e.g., `freeaimodels.ddns.net`)
3. Install No-IP client:
   ```bash
   sudo apt-get install noip2
   sudo noip2 -C
   sudo /usr/local/bin/noip2
   ```

---

## 🔒 Step 3: SSL/HTTPS (RECOMMENDED)

Once you have a domain (DuckDNS or No-IP), get free SSL with Let's Encrypt:

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d freeaimodels.duckdns.org

# Auto-renewal is set up automatically
```

Your site will then be accessible at:
- **HTTPS:** `https://freeaimodels.duckdns.org/dashboard.html`

---

## 🧪 Testing Public Access

### 1. Check if port is open:
Visit: https://www.yougetsignal.com/tools/open-ports/
- Enter your public IP
- Port: 80
- Should show: **OPEN**

### 2. Test from your phone (mobile network):
- Disconnect from WiFi
- Visit: `http://<your-public-ip>/dashboard.html`

### 3. Share the URL:
Once working, share `http://freeaimodels.duckdns.org/dashboard.html` with anyone!

---

## 🔧 Troubleshooting

### Port forwarding not working?

**Check firewall:**
```bash
sudo ufw status
sudo ufw allow 80/tcp
```

**Check if nginx is listening:**
```bash
sudo netstat -tlnp | grep 80
```

**Check nginx error log:**
```bash
sudo tail -f /var/log/nginx/error.log
```

**Restart services:**
```bash
sudo systemctl restart nginx
sudo systemctl restart ai4all-data-server
```

### Can't access from outside?

1. **Verify your public IP** hasn't changed
2. **Check router settings** - some ISPs block port 80
3. **Try alternative port** (8080 or 3000):
   - In router, forward external 8080 → internal 80
   - Access via: `http://your-ip:8080/dashboard.html`

### Security concerns?

Your setup includes:
- ✅ Security headers (XSS protection, etc.)
- ✅ Sensitive directories blocked
- ✅ No source code exposed
- ✅ Only dashboard and data served

For additional security, consider:
- Fail2ban: `sudo apt-get install fail2ban`
- Change SSH port from default 22
- Disable password auth, use SSH keys only

---

## 📊 Management Commands

```bash
# Build the site
cd ~/ai4all/AI4ALL
npm run build

# Reload nginx to serve new build
sudo systemctl reload nginx

# Check service status
sudo systemctl status nginx
sudo systemctl status ai4all-data-server

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Restart everything
sudo systemctl restart nginx ai4all-data-server

# Update data manually
cd ~/ai4all/AI4ALL && npm run scrape

# Check public IP
curl ifconfig.me
```

---

## 🎯 Next Steps

1. **Set up port forwarding** on your router (Step 1)
2. **Configure DuckDNS** for a permanent domain (Step 2)
3. **Add SSL** with Let's Encrypt (Step 3)
4. **Share your URL** with the world!

Your Free AI Models site will be publicly accessible and automatically updated hourly with fresh data from models.dev!

---

**Need help?** Check your router's manual for port forwarding instructions, or contact your ISP if they block port 80.
