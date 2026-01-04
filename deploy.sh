#!/bin/bash

# PBK CRM Unified - Quick Deployment Script
# Usage: ./deploy.sh [production|development|stop|restart|logs]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   🚀 PBK CRM Unified - Deployment Manager${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

MODE=${1:-production}

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo -e "${YELLOW}Creating .env from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo -e "${GREEN}✅ .env created. Please edit it with your credentials!${NC}"
        echo -e "${YELLOW}⚠️  Don't forget to set:${NC}"
        echo "   - POSTGRES_PASSWORD"
        echo "   - JWT_SECRET"
        echo "   - NEXT_PUBLIC_API_URL"
        exit 1
    else
        echo -e "${RED}❌ .env.example not found!${NC}"
        exit 1
    fi
fi

case "$MODE" in
    production|prod)
        echo -e "${GREEN}📦 Starting in PRODUCTION mode...${NC}"
        
        # Check Docker
        if ! command -v docker &> /dev/null; then
            echo -e "${RED}❌ Docker is not installed!${NC}"
            exit 1
        fi
        
        if ! command -v docker-compose &> /dev/null; then
            echo -e "${RED}❌ Docker Compose is not installed!${NC}"
            exit 1
        fi
        
        # Stop existing containers
        echo -e "${YELLOW}Stopping existing containers...${NC}"
        docker-compose down
        
        # Build and start
        echo -e "${YELLOW}Building containers...${NC}"
        docker-compose build --no-cache
        
        echo -e "${YELLOW}Starting containers...${NC}"
        docker-compose up -d
        
        # Wait for services
        echo -e "${YELLOW}Waiting for services to start...${NC}"
        sleep 10
        
        # Check health
        echo ""
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}   Health Checks${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        # Backend health
        if curl -f http://localhost:5001/health &> /dev/null; then
            echo -e "${GREEN}✅ Backend:  Running on http://localhost:5001${NC}"
        else
            echo -e "${RED}❌ Backend:  Not responding${NC}"
        fi
        
        # Frontend health
        if curl -f http://localhost:3000 &> /dev/null; then
            echo -e "${GREEN}✅ Frontend: Running on http://localhost:3000${NC}"
        else
            echo -e "${RED}❌ Frontend: Not responding${NC}"
        fi
        
        # Container status
        echo ""
        docker-compose ps
        
        echo ""
        echo -e "${GREEN}✅ Deployment complete!${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${YELLOW}Access your CRM at: http://localhost:3000${NC}"
        echo -e "${YELLOW}API available at:   http://localhost:5001${NC}"
        echo ""
        echo -e "${BLUE}Useful commands:${NC}"
        echo "  ./deploy.sh logs       - View all logs"
        echo "  ./deploy.sh restart    - Restart all services"
        echo "  ./deploy.sh stop       - Stop all services"
        ;;
        
    development|dev)
        echo -e "${GREEN}🔧 Starting in DEVELOPMENT mode...${NC}"
        
        # Backend
        echo -e "${YELLOW}Starting Backend...${NC}"
        cd backend
        npm install
        node src/index.js > /tmp/backend.log 2>&1 &
        echo $! > /tmp/backend.pid
        cd ..
        
        # Frontend
        echo -e "${YELLOW}Starting Frontend...${NC}"
        cd frontend
        npm install
        npm run dev > /tmp/frontend.log 2>&1 &
        echo $! > /tmp/frontend.pid
        cd ..
        
        # Telegram Bot
        echo -e "${YELLOW}Starting Telegram Bot...${NC}"
        cd telegram-bot
        npm install
        node unified-bot.js > /tmp/telegram.log 2>&1 &
        echo $! > /tmp/telegram.pid
        cd ..
        
        sleep 5
        
        echo ""
        echo -e "${GREEN}✅ Development servers started!${NC}"
        echo -e "${YELLOW}Backend:  http://localhost:5001 (PID: $(cat /tmp/backend.pid 2>/dev/null || echo 'N/A'))${NC}"
        echo -e "${YELLOW}Frontend: http://localhost:3000 (PID: $(cat /tmp/frontend.pid 2>/dev/null || echo 'N/A'))${NC}"
        echo -e "${YELLOW}Telegram: Running (PID: $(cat /tmp/telegram.pid 2>/dev/null || echo 'N/A'))${NC}"
        echo ""
        echo -e "${BLUE}Logs:${NC}"
        echo "  tail -f /tmp/backend.log"
        echo "  tail -f /tmp/frontend.log"
        echo "  tail -f /tmp/telegram.log"
        ;;
        
    stop)
        echo -e "${YELLOW}Stopping all services...${NC}"
        
        # Docker
        if command -v docker-compose &> /dev/null; then
            docker-compose down
        fi
        
        # Development processes
        if [ -f /tmp/backend.pid ]; then
            kill $(cat /tmp/backend.pid) 2>/dev/null || true
            rm /tmp/backend.pid
        fi
        if [ -f /tmp/frontend.pid ]; then
            kill $(cat /tmp/frontend.pid) 2>/dev/null || true
            rm /tmp/frontend.pid
        fi
        if [ -f /tmp/telegram.pid ]; then
            kill $(cat /tmp/telegram.pid) 2>/dev/null || true
            rm /tmp/telegram.pid
        fi
        
        # Kill by port
        lsof -ti :5001 | xargs kill -9 2>/dev/null || true
        lsof -ti :3000 | xargs kill -9 2>/dev/null || true
        
        echo -e "${GREEN}✅ All services stopped${NC}"
        ;;
        
    restart)
        echo -e "${YELLOW}Restarting services...${NC}"
        $0 stop
        sleep 2
        $0 $2
        ;;
        
    logs)
        if command -v docker-compose &> /dev/null; then
            docker-compose logs -f
        else
            echo -e "${YELLOW}Development logs:${NC}"
            echo "Backend:  tail -f /tmp/backend.log"
            echo "Frontend: tail -f /tmp/frontend.log"
            echo "Telegram: tail -f /tmp/telegram.log"
        fi
        ;;
        
    status)
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${BLUE}   System Status${NC}"
        echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        
        # Docker containers
        if command -v docker-compose &> /dev/null; then
            echo ""
            echo -e "${YELLOW}Docker Containers:${NC}"
            docker-compose ps
        fi
        
        # Port status
        echo ""
        echo -e "${YELLOW}Port Status:${NC}"
        lsof -i :5001 | grep LISTEN && echo -e "${GREEN}✅ Backend (5001): Running${NC}" || echo -e "${RED}❌ Backend (5001): Not running${NC}"
        lsof -i :3000 | grep LISTEN && echo -e "${GREEN}✅ Frontend (3000): Running${NC}" || echo -e "${RED}❌ Frontend (3000): Not running${NC}"
        
        # Health checks
        echo ""
        echo -e "${YELLOW}Health Checks:${NC}"
        if curl -f http://localhost:5001/health &> /dev/null; then
            echo -e "${GREEN}✅ Backend API: Healthy${NC}"
        else
            echo -e "${RED}❌ Backend API: Unhealthy${NC}"
        fi
        
        if curl -f http://localhost:3000 &> /dev/null; then
            echo -e "${GREEN}✅ Frontend: Accessible${NC}"
        else
            echo -e "${RED}❌ Frontend: Not accessible${NC}"
        fi
        ;;
        
    *)
        echo -e "${YELLOW}Usage: $0 {production|development|stop|restart|logs|status}${NC}"
        echo ""
        echo "Commands:"
        echo "  production   - Deploy with Docker (recommended)"
        echo "  development  - Run in development mode (no Docker)"
        echo "  stop        - Stop all services"
        echo "  restart     - Restart all services"
        echo "  logs        - View logs"
        echo "  status      - Check system status"
        exit 1
        ;;
esac
