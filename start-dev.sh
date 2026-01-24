#!/bin/bash

# Quick development environment starter

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🛡️ Guardian Shield - Starting Development Environment${NC}"
echo ""

# Start backend in background
echo -e "${GREEN}Starting backend server on port 5000...${NC}"
cd backend
npm run dev &
BACKEND_PID=$!

# Give backend time to start
sleep 3

# Start frontend
echo -e "${GREEN}Starting frontend server on port 5173...${NC}"
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo -e "${GREEN}✅ Services started!${NC}"
echo ""
echo -e "${BLUE}Backend:  http://localhost:5000${NC}"
echo -e "${BLUE}Frontend: http://localhost:5173${NC}"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
