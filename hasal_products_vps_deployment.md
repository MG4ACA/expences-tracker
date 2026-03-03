# 🚀 Hostinger VPS Deployment Guide

## Lumicore Tracker (Vue.js + Express.js + MySQL)

This guide walks you through deploying the Lumicore Tracker application (Vue.js frontend + Express.js backend) on a Hostinger VPS with the MEVN stack template.

---

## 📋 Prerequisites

- Hostinger VPS with Ubuntu 22.04 + MEVN Stack template installed
- SSH access to your VPS
- Your VPS IP address
- Domain name: `tracker.lumicore-labs.com`

---

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────┐
│         Hostinger VPS Server            │
│                                         │
│  ┌────────────────────────────────┐     │
│  │  Nginx (Reverse Proxy)         │     │
│  │  Port 80/443                   │     │
│  └──────────┬─────────────────────┘     │
│             │                            │
│  ┌──────────▼──────────┐  ┌──────────┐  │
│  │  Vue.js Frontend    │  │  Backend │  │
│  │  (Static Files)     │  │  API     │  │
│  │                     │  │  Port    │  │
│  │                     │  │  3002    │  │
│  └─────────────────────┘  └────┬─────┘  │
│                                │        │
│                         ┌──────▼──────┐ │
│                         │    MySQL    │ │
│                         │  Database  │ │
│                         └────────────┘ │
└─────────────────────────────────────────┘
```

---

## 📦 Step 1: Connect to Your VPS

```bash
ssh root@your_vps_ip
```

---

## 🔧 Step 2: Initial Server Setup

### 2.1 Update System Packages

```bash
sudo apt update && sudo apt upgrade -y
```

### 2.2 Install Required Tools

```bash
# Install Git
sudo apt install git -y

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx (if not already installed)
sudo apt install nginx -y

# Install MySQL
sudo apt install mysql-server -y
sudo apt install mysql-client -y
sudo systemctl status mysql
sudo systemctl start mysql
```

### 2.3 Configure Firewall

```bash
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

---

## 🗄️ Step 3: Set Up MySQL Database

### 3.1 Secure MySQL Installation

```bash
sudo mysql_secure_installation
```

Follow the prompts to:

- Set root password
- Remove anonymous users
- Disallow root login remotely
- Remove test database

### 3.2 Create Database and User

```bash
# Login to MySQL
sudo mysql -u root -p

# Run these SQL commands:
```

```sql
-- Create database
CREATE DATABASE lumicore_tracker CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create user (replace 'Velou@123' with a strong password)
CREATE USER 'lumicore_tracker'@'localhost' IDENTIFIED BY 'Velou@123';

-- Grant privileges
GRANT ALL PRIVILEGES ON lumicore_tracker.* TO 'lumicore_tracker'@'localhost';

FLUSH PRIVILEGES;
EXIT;
```

---

## 📥 Step 4: Deploy Your Application

### 4.1 Create Application Directory

```bash
sudo mkdir -p /var/www/lumicore_tracker
cd /var/www/lumicore_tracker
```

### 4.2 Clone the Repository

```bash
sudo git clone https://github.com/MG4ACA/expences-tracker.git 

cd expences-tracker
```

### 4.3 Set Correct Permissions

```bash
sudo chown -R $USER:$USER /var/www/lumicore_tracker
sudo chmod -R 755 /var/www/lumicore_tracker
```

---

### Updating an Existing Deployment

```bash
cd /var/www/lumicore_tracker/expences-tracker

git fetch --all
git pull origin main

# If there are conflicts
git reset --hard origin/main
```

---

## 🔨 Step 5: Set Up Backend

### 5.1 Navigate to Backend Directory

```bash
cd /var/www/lumicore_tracker/expences-tracker/backend
```

### 5.2 Install Dependencies

```bash
npm install --production
```

### 5.3 Initialize Database Schema

```bash
# Run the schema file to create all tables
sudo mysql -u lumicore_tracker -p lumicore_tracker < database.sql
```

### 5.4 Configure Environment Variables

```bash
nano .env
```

Add the following:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=lumicore_tracker
DB_USER=lumicore_tracker
DB_PASSWORD=Velou@123

# Application
NODE_ENV=production
PORT=3002

# JWT Secret (generate a secure random string)
JWT_SECRET=your_super_secret_jwt_key_here_change_this

# JWT Expiration
JWT_EXPIRES_IN=24h

# CORS Configuration
ALLOWED_ORIGINS=https://tracker.lumicore-labs.com,http://tracker.lumicore-labs.com
```

**Generate a secure JWT secret:**

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 5.5 Test Backend Locally

```bash
npm start

# In another terminal, test the API
curl http://localhost:3002/api/health
```

You should see `{"status":"ok"}`. Press `Ctrl+C` to stop.

### 5.6 Set Up PM2 for Backend

```bash
# Start backend with PM2 (entry point is src/server.js)
pm2 start src/server.js --name lumicore-tracker-backend

pm2 save

pm2 startup

pm2 status
```

**Useful PM2 Commands:**

```bash
pm2 logs lumicore-tracker-backend
pm2 restart lumicore-tracker-backend
pm2 stop lumicore-tracker-backend
pm2 monit
```

---

## 🎨 Step 6: Set Up Frontend

### 6.1 Navigate to Frontend Directory

```bash
cd /var/www/lumicore_tracker/expences-tracker/frontend
```

### 6.2 Configure API Endpoint

```bash
nano .env.production
```

```env
VITE_API_BASE_URL=https://tracker.lumicore-labs.com/api
```

### 6.3 Install Dependencies and Build

```bash
npm install
npm run build
```

This creates a `dist` folder with optimized static files.

### 6.4 Move Build to Nginx Directory

```bash
sudo mkdir -p /var/www/lumicore_tracker/frontend

sudo cp -r dist/* /var/www/lumicore_tracker/frontend/

sudo chown -R www-data:www-data /var/www/lumicore_tracker/frontend
sudo chmod -R 755 /var/www/lumicore_tracker/frontend
```

---

## 🌐 Step 7: Configure Nginx

### 7.1 Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/lumicore_tracker
```

Add this configuration:

```nginx
upstream lumicore_tracker_backend {
    server localhost:3002;
    keepalive 64;
}

server {
    listen 80;
    server_name tracker.lumicore-labs.com www.tracker.lumicore-labs.com;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend - Serve Vue.js app
    location / {
        root /var/www/lumicore_tracker/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;

        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API - Proxy to Express.js
    location /api/ {
        proxy_pass http://lumicore_tracker_backend/api/;
        proxy_http_version 1.1;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        proxy_cache_bypass $http_upgrade;
    }

    # Uploaded files (screenshots, etc.) — proxy to backend so Express serves them
    location /uploads/ {
        proxy_pass http://lumicore_tracker_backend/uploads/;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Cache images aggressively on the client side
        expires 7d;
        add_header Cache-Control "public";
    }

    access_log /var/log/nginx/lumicore_tracker-access.log;
    error_log /var/log/nginx/lumicore_tracker-error.log;
}
```

### 7.2 Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/lumicore_tracker /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

sudo nginx -t

sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## 🔒 Step 8: Set Up SSL (Recommended)

### 8.1 Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 8.2 Obtain SSL Certificate

```bash
sudo certbot --nginx -d tracker.lumicore-labs.com -d www.tracker.lumicore-labs.com
```

Certbot will obtain the certificate and automatically update your Nginx config for HTTPS.

### 8.3 Test Auto-Renewal

```bash
sudo certbot renew --dry-run
```

### 8.4 Rebuild Frontend with HTTPS URL

After SSL is configured, ensure `.env.production` is using `https`:

```env
VITE_API_BASE_URL=https://tracker.lumicore-labs.com/api
```

Rebuild and redeploy:

```bash
cd /var/www/lumicore_tracker/expences-tracker/frontend
npm run build
sudo cp -r dist/* /var/www/lumicore_tracker/frontend/
```

---

## ✅ Step 9: Verify Deployment

### 9.1 Check Backend

```bash
pm2 status
pm2 logs lumicore-tracker-backend
curl http://localhost:3002/api/health
```

### 9.2 Check Nginx

```bash
sudo systemctl status nginx
sudo tail -f /var/log/nginx/lumicore_tracker-error.log
```

### 9.3 Test Application

Open your browser and visit `https://tracker.lumicore-labs.com`.

You should see the Lumicore Tracker login page.

---

## 🔄 Step 10: Deployment Script (For Updates)

```bash
nano /var/www/lumicore_tracker/deploy.sh
```

```bash
#!/bin/bash

echo "🚀 Starting Lumicore Tracker deployment..."

cd /var/www/lumicore_tracker/expences-tracker

echo "📥 Pulling latest changes..."
git fetch --all
git pull origin main

echo "🔨 Deploying backend..."
cd backend
npm install --production
pm2 restart lumicore-tracker-backend

echo "🎨 Building frontend..."
cd ../frontend
npm install
npm run build
sudo cp -r dist/* /var/www/lumicore_tracker/frontend/

echo "🌐 Restarting Nginx..."
sudo systemctl restart nginx

echo "✅ Deployment complete!"
```

```bash
chmod +x /var/www/lumicore_tracker/deploy.sh

# Run deployment
/var/www/lumicore_tracker/deploy.sh
```

---

## 🛠️ Maintenance Commands

### Check Application Status

```bash
pm2 status
sudo systemctl status nginx
sudo systemctl status mysql

df -h       # Disk space
free -m     # Memory usage
```

### View Logs

```bash
pm2 logs lumicore-tracker-backend

sudo tail -f /var/log/nginx/lumicore_tracker-access.log
sudo tail -f /var/log/nginx/lumicore_tracker-error.log
sudo tail -f /var/log/mysql/error.log
```

### Backup Database

```bash
mkdir -p ~/backups

# Manual backup
mysqldump -u lumicore_tracker -p lumicore_tracker > ~/backups/lumicore_tracker_$(date +%Y%m%d_%H%M%S).sql

# Automated backup script
nano ~/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR=~/backups
mkdir -p $BACKUP_DIR
mysqldump -u lumicore_tracker -p'Velou@123' lumicore_tracker > $BACKUP_DIR/lumicore_tracker_$(date +%Y%m%d_%H%M%S).sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "lumicore_tracker_*.sql" -mtime +7 -delete
```

```bash
chmod +x ~/backup-db.sh

# Daily backup at 2 AM
crontab -e
# Add: 0 2 * * * /home/username/backup-db.sh
```

---

## 🐛 Troubleshooting

### Backend Not Starting

```bash
pm2 logs lumicore-tracker-backend

# Port 3002 already in use
sudo lsof -i :3002
sudo kill -9 <PID>

# Test DB connection
mysql -u lumicore_tracker -p lumicore_tracker
```

### Frontend Not Loading

```bash
sudo tail -f /var/log/nginx/lumicore_tracker-error.log

ls -la /var/www/lumicore_tracker/frontend

sudo nginx -t
sudo systemctl restart nginx
```

### 502 Bad Gateway

```bash
pm2 status
pm2 restart lumicore-tracker-backend

# Confirm backend is listening on port 3002
sudo netstat -tlnp | grep 3002
```

### Database Connection Issues

```bash
mysql -u lumicore_tracker -p lumicore_tracker

sudo systemctl status mysql
sudo systemctl restart mysql

cat /var/www/lumicore_tracker/expences-tracker/backend/.env
```

---

## 📊 Monitoring Setup (Optional)

```bash
sudo apt install htop -y

pm2 install pm2-server-monit
pm2 monit
```

---

## 🎯 Performance Optimization

### Enable Gzip Compression in Nginx

```bash
sudo nano /etc/nginx/nginx.conf
```

Add inside the `http` block:

```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
```

### PM2 Production Start

```bash
pm2 start src/server.js --name lumicore-tracker-backend -i max --node-args="--max-old-space-size=1024"
```

---

## 📚 Additional Resources

- [Hostinger VPS Documentation](https://www.hostinger.com/tutorials/vps)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Certbot](https://certbot.eff.org/)

---

## 📝 Post-Deployment Checklist

- [ ] Backend is running via PM2 (`pm2 status`)
- [ ] Database `lumicore_tracker` is created and schema applied
- [ ] Frontend is built and served by Nginx
- [ ] API health check responds: `curl http://localhost:3002/api/health`
- [ ] Application login works at `https://tracker.lumicore-labs.com`
- [ ] SSL certificate is installed
- [ ] Firewall is configured (`ufw status`)
- [ ] Backups are automated (crontab)
- [ ] Deployment script is ready

---

**Project:** Lumicore Tracker  
**Repo:** https://github.com/MG4ACA/expences-tracker  
**Domain:** tracker.lumicore-labs.com  
**Last Updated:** February 2026  
**Version:** 1.0.0
