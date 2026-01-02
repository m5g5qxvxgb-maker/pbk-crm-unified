#!/bin/bash
# Start script for Playwright E2E tests

echo "🚀 Starting PBK CRM for E2E testing..."

# Kill any existing processes on ports
pkill -f "next dev" || true
pkill -f "node src/index.js" || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5000 | xargs kill -9 2>/dev/null || true

sleep 2

# Start backend
cd /root/pbk-crm-unified/backend
echo "📡 Starting backend on port 5000..."
node src/index.js > /tmp/backend-test.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

sleep 3

# Start frontend
cd /root/pbk-crm-unified/frontend
echo "🎨 Starting frontend on port 3000..."
npm run dev > /tmp/frontend-test.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

sleep 5

echo "✅ Services started"
echo "Backend: http://localhost:5000"
echo "Frontend: http://localhost:3000"
echo ""
echo "To stop: kill $BACKEND_PID $FRONTEND_PID"
echo "PIDs saved to /tmp/test-pids.txt"
echo "$BACKEND_PID $FRONTEND_PID" > /tmp/test-pids.txt
