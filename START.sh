#!/bin/bash
echo ""
echo "============================================"
echo "  GymPro - Starting Setup..."
echo "============================================"
echo ""

cd "$(dirname "$0")/backend"

echo "[1/2] Installing dependencies..."
npm install
if [ $? -ne 0 ]; then
    echo "ERROR: npm install failed. Is Node.js installed?"
    echo "Download from: https://nodejs.org"
    exit 1
fi

echo ""
echo "[2/2] Starting server..."
echo ""
echo "============================================"
echo "  Open your browser at: http://localhost:3000"
echo "============================================"
echo ""
node server.js
