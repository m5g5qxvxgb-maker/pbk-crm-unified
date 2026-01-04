#!/bin/bash

# Quick server access and deployment script
# Server: 100.91.124.46 (Tailscale)

SERVER_IP="100.91.124.46"
SERVER_USER="root"
PROJECT_NAME="pbk-crm-unified"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

function show_menu() {
    echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   PBK CRM - Server Management          ║${NC}"
    echo -e "${BLUE}║   Server: 100.91.124.46                ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
    echo ""
    echo "1) SSH подключение к серверу"
    echo "2) Деплой через Docker Compose"
    echo "3) Деплой вручную (PM2)"
    echo "4) Проверить статус сервера"
    echo "5) Скопировать файлы на сервер"
    echo "6) Показать логи"
    echo "7) Перезапустить приложение"
    echo "8) Остановить приложение"
    echo "9) Выход"
    echo ""
    read -p "Выберите действие [1-9]: " choice
}

function ssh_connect() {
    echo -e "${GREEN}→ Подключение к серверу...${NC}"
    ssh ${SERVER_USER}@${SERVER_IP}
}

function deploy_docker() {
    echo -e "${GREEN}→ Деплой через Docker Compose...${NC}"
    
    # Copy files to server
    echo -e "${YELLOW}Копирование файлов...${NC}"
    ssh ${SERVER_USER}@${SERVER_IP} "mkdir -p ~/${PROJECT_NAME}"
    rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.next' \
        ./ ${SERVER_USER}@${SERVER_IP}:~/${PROJECT_NAME}/
    
    # Run deployment
    echo -e "${YELLOW}Запуск деплоя...${NC}"
    ssh ${SERVER_USER}@${SERVER_IP} "cd ~/${PROJECT_NAME} && ./deploy.sh production"
    
    echo -e "${GREEN}✓ Деплой завершен!${NC}"
    echo -e "${BLUE}Frontend: http://${SERVER_IP}:3000${NC}"
    echo -e "${BLUE}Backend: http://${SERVER_IP}:5001${NC}"
}

function deploy_manual() {
    echo -e "${GREEN}→ Деплой через PM2...${NC}"
    
    # Copy files
    echo -e "${YELLOW}Копирование файлов...${NC}"
    ssh ${SERVER_USER}@${SERVER_IP} "mkdir -p ~/${PROJECT_NAME}"
    rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.next' \
        ./ ${SERVER_USER}@${SERVER_IP}:~/${PROJECT_NAME}/
    
    # Install and start
    ssh ${SERVER_USER}@${SERVER_IP} << 'EOF'
cd ~/pbk-crm-unified

# Install dependencies
echo "Installing backend dependencies..."
cd backend && npm install --production && cd ..

echo "Installing frontend dependencies..."
cd frontend && npm install && npm run build && cd ..

echo "Installing telegram-bot dependencies..."
cd telegram-bot && npm install --production && cd ..

# Install PM2
npm install -g pm2

# Start services
pm2 delete all 2>/dev/null || true
pm2 start backend/src/index.js --name pbk-backend
pm2 start telegram-bot/unified-bot.js --name pbk-telegram
cd frontend && pm2 start npm --name pbk-frontend -- start
pm2 save
pm2 startup
EOF
    
    echo -e "${GREEN}✓ Деплой завершен!${NC}"
}

function check_status() {
    echo -e "${GREEN}→ Проверка статуса сервера...${NC}"
    echo ""
    
    # Check SSH
    echo -e "${YELLOW}SSH:${NC}"
    nc -zv -w 2 ${SERVER_IP} 22 2>&1 | grep -q "succeeded" && \
        echo -e "${GREEN}✓ Доступен${NC}" || echo -e "${RED}✗ Недоступен${NC}"
    
    # Check if Docker is running
    echo -e "\n${YELLOW}Docker статус:${NC}"
    ssh ${SERVER_USER}@${SERVER_IP} "docker ps 2>/dev/null" && \
        echo -e "${GREEN}✓ Docker запущен${NC}" || echo -e "${YELLOW}! Docker не найден${NC}"
    
    # Check ports
    echo -e "\n${YELLOW}Порты приложения:${NC}"
    for port in 3000 5001; do
        nc -zv -w 2 ${SERVER_IP} ${port} 2>&1 | grep -q "succeeded" && \
            echo -e "${GREEN}✓ Порт ${port} открыт${NC}" || \
            echo -e "${RED}✗ Порт ${port} закрыт${NC}"
    done
}

function copy_files() {
    echo -e "${GREEN}→ Копирование файлов на сервер...${NC}"
    
    ssh ${SERVER_USER}@${SERVER_IP} "mkdir -p ~/${PROJECT_NAME}"
    rsync -avz --progress --exclude 'node_modules' --exclude '.git' --exclude '.next' \
        ./ ${SERVER_USER}@${SERVER_IP}:~/${PROJECT_NAME}/
    
    echo -e "${GREEN}✓ Файлы скопированы${NC}"
}

function show_logs() {
    echo -e "${GREEN}→ Просмотр логов...${NC}"
    echo ""
    echo "1) Docker логи"
    echo "2) PM2 логи"
    echo "3) Системные логи"
    read -p "Выберите [1-3]: " log_choice
    
    case $log_choice in
        1)
            ssh ${SERVER_USER}@${SERVER_IP} "cd ~/${PROJECT_NAME} && docker-compose logs -f"
            ;;
        2)
            ssh ${SERVER_USER}@${SERVER_IP} "pm2 logs"
            ;;
        3)
            ssh ${SERVER_USER}@${SERVER_IP} "journalctl -f"
            ;;
    esac
}

function restart_app() {
    echo -e "${GREEN}→ Перезапуск приложения...${NC}"
    
    # Try Docker first
    ssh ${SERVER_USER}@${SERVER_IP} "cd ~/${PROJECT_NAME} && docker-compose restart 2>/dev/null" && \
        echo -e "${GREEN}✓ Docker перезапущен${NC}" && return
    
    # Try PM2
    ssh ${SERVER_USER}@${SERVER_IP} "pm2 restart all" && \
        echo -e "${GREEN}✓ PM2 перезапущен${NC}" && return
    
    echo -e "${RED}✗ Не удалось перезапустить${NC}"
}

function stop_app() {
    echo -e "${GREEN}→ Остановка приложения...${NC}"
    
    # Try Docker
    ssh ${SERVER_USER}@${SERVER_IP} "cd ~/${PROJECT_NAME} && docker-compose down 2>/dev/null" && \
        echo -e "${GREEN}✓ Docker остановлен${NC}"
    
    # Try PM2
    ssh ${SERVER_USER}@${SERVER_IP} "pm2 stop all 2>/dev/null" && \
        echo -e "${GREEN}✓ PM2 остановлен${NC}"
}

# Main loop
while true; do
    show_menu
    
    case $choice in
        1) ssh_connect ;;
        2) deploy_docker ;;
        3) deploy_manual ;;
        4) check_status ;;
        5) copy_files ;;
        6) show_logs ;;
        7) restart_app ;;
        8) stop_app ;;
        9) echo -e "${GREEN}До свидания!${NC}"; exit 0 ;;
        *) echo -e "${RED}Неверный выбор${NC}" ;;
    esac
    
    echo ""
    read -p "Нажмите Enter для продолжения..."
    clear
done
