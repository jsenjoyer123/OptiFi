#!/bin/bash

# Local testing script for OptiFi deployment
# This script helps test the Docker setup locally before deploying to production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}=== OptiFi Local Testing ===${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

# Create .env file from production template if it doesn't exist
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp deploy/.env.production .env
    echo -e "${YELLOW}Please edit .env file with your test credentials:${NC}"
    echo "nano .env"
    exit 0
fi

# Stop any running containers
echo -e "${YELLOW}Stopping any running containers...${NC}"
docker-compose -f docker-compose.prod.yml down || true

# Build images
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose -f docker-compose.prod.yml build

# Start services
echo -e "${YELLOW}Starting services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Check if services are running
echo -e "${YELLOW}Checking service health...${NC}"

# Check Bank API
echo -n "Bank API: "
if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not responding${NC}"
fi

# Check Credit Analytics
echo -n "Credit Analytics: "
if curl -s http://localhost:8100/health > /dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not responding${NC}"
fi

# Check Database
echo -n "Database: "
if docker exec optifi-db-prod pg_isready -U optifi_user > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Running${NC}"
else
    echo -e "${RED}✗ Not responding${NC}"
fi

echo ""
echo -e "${GREEN}=== Local Testing Complete ===${NC}"
echo ""
echo "Services are available at:"
echo "- Bank API: http://localhost:8000"
echo "- Credit Analytics: http://localhost:8100"
echo ""
echo "View logs:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "Stop services:"
echo "  docker-compose -f docker-compose.prod.yml down"
