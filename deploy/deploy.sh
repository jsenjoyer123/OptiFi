#!/bin/bash

# Deploy script for OptiFi Credit Analytics on Ubuntu VPS
# Usage: bash deploy.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="рефенансье.рф"
APP_DIR="/opt/optifi"
REPO_URL="https://github.com/jsenjoyer123/OptiFi.git"
BRANCH="novaya-vetka"
EMAIL="admin@рефенансье.рф"

echo -e "${YELLOW}=== OptiFi Deployment Script ===${NC}"
echo "Domain: $DOMAIN"
echo "App Directory: $APP_DIR"
echo ""

# Step 1: Update system
echo -e "${YELLOW}Step 1: Updating system packages...${NC}"
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y curl wget git

# Step 2: Install Docker and Docker Compose
echo -e "${YELLOW}Step 2: Installing Docker and Docker Compose...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
fi

if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Step 3: Install Nginx
echo -e "${YELLOW}Step 3: Installing Nginx...${NC}"
sudo apt-get install -y nginx

# Step 4: Install Certbot for SSL
echo -e "${YELLOW}Step 4: Installing Certbot for Let's Encrypt...${NC}"
sudo apt-get install -y certbot python3-certbot-nginx

# Step 5: Clone or update repository
echo -e "${YELLOW}Step 5: Setting up application directory...${NC}"
if [ ! -d "$APP_DIR" ]; then
    sudo mkdir -p $APP_DIR
    sudo chown $USER:$USER $APP_DIR
fi

if [ ! -d "$APP_DIR/.git" ]; then
    cd $APP_DIR
    git clone -b $BRANCH $REPO_URL .
else
    cd $APP_DIR
    git fetch origin
    git checkout $BRANCH
    git pull origin $BRANCH
fi

# Step 6: Create .env file
echo -e "${YELLOW}Step 6: Creating .env file...${NC}"
if [ ! -f "$APP_DIR/microservices/credit-analytics-backend/.env" ]; then
    cp $APP_DIR/microservices/credit-analytics-backend/.env.example $APP_DIR/microservices/credit-analytics-backend/.env
    echo -e "${YELLOW}Please edit .env file with your credentials:${NC}"
    echo "nano $APP_DIR/microservices/credit-analytics-backend/.env"
fi

# Step 7: Start Docker containers
echo -e "${YELLOW}Step 7: Starting Docker containers...${NC}"
cd $APP_DIR
    sudo docker-compose -f deploy/docker-compose.prod.yml up -d

# Step 8: Configure Nginx
echo -e "${YELLOW}Step 8: Configuring Nginx...${NC}"
sudo cp $APP_DIR/deploy/nginx.conf /etc/nginx/sites-available/$DOMAIN
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/$DOMAIN
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# Step 9: Setup SSL certificate
echo -e "${YELLOW}Step 9: Setting up SSL certificate with Let's Encrypt...${NC}"
sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m $EMAIL

# Step 10: Setup auto-renewal
echo -e "${YELLOW}Step 10: Setting up certificate auto-renewal...${NC}"
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# Step 11: Setup firewall
echo -e "${YELLOW}Step 11: Configuring firewall...${NC}"
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo -e "${GREEN}=== Deployment completed successfully! ===${NC}"
echo -e "${GREEN}Your application is now available at: https://$DOMAIN${NC}"
echo ""
echo "Next steps:"
echo "1. Verify DNS is pointing to this server"
echo "2. Check application logs: docker-compose logs -f"
echo "3. Monitor the application at: https://$DOMAIN"
