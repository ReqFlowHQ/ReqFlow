#!/bin/bash
set -e

echo "🚀 Starting ReqFlow deploy..."

echo "📦 Building backend"
cd backend
npm run build

echo "♻️ Restarting backend (pm2)"
pm2 restart reqflow-backend || pm2 start dist/index.js --name reqflow-backend
pm2 save

cd ..

echo "📦 Building frontend"
cd frontend
npm run build

echo "♻️ Restarting frontend (pm2, SPA mode)"
pm2 delete reqflow-frontend || true
pm2 serve /home/ubuntu/ReqFlow/ReqFlow/frontend/dist 3000 --name reqflow-frontend --spa
pm2 save

echo "🔁 Restarting cloudflared"
sudo systemctl restart cloudflared

echo "✅ Deploy completed successfully!"
