#!/bin/bash

# OptiFi Management Script
# Usage: bash manage.sh [command]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

APP_DIR="/opt/optifi"
COMPOSE_FILE="docker-compose.prod.yml"

# Function to display help
show_help() {
    echo -e "${BLUE}OptiFi Management Script${NC}"
    echo ""
    echo "Usage: bash manage.sh [command]"
    echo ""
    echo "Commands:"
    echo "  ${GREEN}status${NC}          - Show status of all services"
    echo "  ${GREEN}logs${NC}            - Show application logs (follow mode)"
    echo "  ${GREEN}logs-db${NC}         - Show database logs"
    echo "  ${GREEN}logs-api${NC}        - Show Bank API logs"
    echo "  ${GREEN}logs-analytics${NC}  - Show Credit Analytics logs"
    echo "  ${GREEN}restart${NC}         - Restart all services"
    echo "  ${GREEN}restart-db${NC}      - Restart database"
    echo "  ${GREEN}restart-api${NC}     - Restart Bank API"
    echo "  ${GREEN}restart-analytics${NC} - Restart Credit Analytics"
    echo "  ${GREEN}stop${NC}            - Stop all services"
    echo "  ${GREEN}start${NC}           - Start all services"
    echo "  ${GREEN}update${NC}          - Pull latest code and restart"
    echo "  ${GREEN}backup${NC}          - Backup database"
    echo "  ${GREEN}restore${NC} [file]  - Restore database from backup"
    echo "  ${GREEN}health${NC}          - Check health of all services"
    echo "  ${GREEN}shell-db${NC}        - Open PostgreSQL shell"
    echo "  ${GREEN}shell-api${NC}       - Open shell in Bank API container"
    echo "  ${GREEN}shell-analytics${NC} - Open shell in Credit Analytics container"
    echo "  ${GREEN}help${NC}            - Show this help message"
    echo ""
}

# Function to check if we're in the right directory
check_directory() {
    if [ ! -f "$APP_DIR/$COMPOSE_FILE" ]; then
        echo -e "${RED}Error: $COMPOSE_FILE not found in $APP_DIR${NC}"
        exit 1
    fi
    cd $APP_DIR
}

# Function to show status
show_status() {
    echo -e "${BLUE}=== Service Status ===${NC}"
    docker-compose -f $COMPOSE_FILE ps
    echo ""
}

# Function to show logs
show_logs() {
    echo -e "${BLUE}=== Application Logs ===${NC}"
    docker-compose -f $COMPOSE_FILE logs -f
}

# Function to show specific logs
show_logs_service() {
    local service=$1
    echo -e "${BLUE}=== $service Logs ===${NC}"
    docker-compose -f $COMPOSE_FILE logs -f $service
}

# Function to restart services
restart_services() {
    echo -e "${YELLOW}Restarting all services...${NC}"
    docker-compose -f $COMPOSE_FILE restart
    echo -e "${GREEN}Services restarted!${NC}"
}

# Function to restart specific service
restart_service() {
    local service=$1
    echo -e "${YELLOW}Restarting $service...${NC}"
    docker-compose -f $COMPOSE_FILE restart $service
    echo -e "${GREEN}$service restarted!${NC}"
}

# Function to stop services
stop_services() {
    echo -e "${YELLOW}Stopping all services...${NC}"
    docker-compose -f $COMPOSE_FILE down
    echo -e "${GREEN}Services stopped!${NC}"
}

# Function to start services
start_services() {
    echo -e "${YELLOW}Starting all services...${NC}"
    docker-compose -f $COMPOSE_FILE up -d
    echo -e "${GREEN}Services started!${NC}"
}

# Function to update code
update_code() {
    echo -e "${YELLOW}Updating code...${NC}"
    git fetch origin
    git pull origin novaya-vetka
    echo -e "${YELLOW}Building images...${NC}"
    docker-compose -f $COMPOSE_FILE build
    echo -e "${YELLOW}Restarting services...${NC}"
    docker-compose -f $COMPOSE_FILE up -d
    echo -e "${GREEN}Update complete!${NC}"
}

# Function to backup database
backup_database() {
    local backup_file="backup_$(date +%Y%m%d_%H%M%S).sql"
    echo -e "${YELLOW}Creating database backup: $backup_file${NC}"
    docker-compose -f $COMPOSE_FILE exec -T db pg_dump -U optifi_user optifi_prod > $backup_file
    echo -e "${GREEN}Backup created: $backup_file${NC}"
}

# Function to restore database
restore_database() {
    local backup_file=$1
    if [ ! -f "$backup_file" ]; then
        echo -e "${RED}Backup file not found: $backup_file${NC}"
        exit 1
    fi
    echo -e "${YELLOW}Restoring database from: $backup_file${NC}"
    docker-compose -f $COMPOSE_FILE exec -T db psql -U optifi_user optifi_prod < $backup_file
    echo -e "${GREEN}Database restored!${NC}"
}

# Function to check health
check_health() {
    echo -e "${BLUE}=== Service Health Check ===${NC}"
    
    echo -n "Bank API: "
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Healthy${NC}"
    else
        echo -e "${RED}✗ Unhealthy${NC}"
    fi
    
    echo -n "Credit Analytics: "
    if curl -s http://localhost:8100/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Healthy${NC}"
    else
        echo -e "${RED}✗ Unhealthy${NC}"
    fi
    
    echo -n "Database: "
    if docker-compose -f $COMPOSE_FILE exec -T db pg_isready -U optifi_user > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Healthy${NC}"
    else
        echo -e "${RED}✗ Unhealthy${NC}"
    fi
    
    echo ""
}

# Function to open database shell
shell_database() {
    echo -e "${BLUE}Opening PostgreSQL shell...${NC}"
    docker-compose -f $COMPOSE_FILE exec db psql -U optifi_user optifi_prod
}

# Function to open container shell
shell_container() {
    local service=$1
    echo -e "${BLUE}Opening shell in $service container...${NC}"
    docker-compose -f $COMPOSE_FILE exec $service sh
}

# Main script logic
check_directory

case "${1:-help}" in
    status)
        show_status
        ;;
    logs)
        show_logs
        ;;
    logs-db)
        show_logs_service "db"
        ;;
    logs-api)
        show_logs_service "bank"
        ;;
    logs-analytics)
        show_logs_service "credit-analytics"
        ;;
    restart)
        restart_services
        ;;
    restart-db)
        restart_service "db"
        ;;
    restart-api)
        restart_service "bank"
        ;;
    restart-analytics)
        restart_service "credit-analytics"
        ;;
    stop)
        stop_services
        ;;
    start)
        start_services
        ;;
    update)
        update_code
        ;;
    backup)
        backup_database
        ;;
    restore)
        restore_database "${2:-}"
        ;;
    health)
        check_health
        ;;
    shell-db)
        shell_database
        ;;
    shell-api)
        shell_container "bank"
        ;;
    shell-analytics)
        shell_container "credit-analytics"
        ;;
    help)
        show_help
        ;;
    *)
        echo -e "${RED}Unknown command: $1${NC}"
        show_help
        exit 1
        ;;
esac
