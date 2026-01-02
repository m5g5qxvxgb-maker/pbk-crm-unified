#!/bin/bash

# Start PBK CRM Unified System
cd /root/pbk-crm-unified

# Start backend API server
pm2 start backend/src/index.js --name crm-server --time

# Start frontend Next.js server
cd frontend && pm2 start npm --name crm-frontend --time -- start && cd ..

# Start unified Telegram bot
pm2 start telegram-bot/unified-bot.js --name crm-telegram-bot --time

# Save PM2 configuration
pm2 save

# Show status
pm2 status
