#!/bin/bash
echo "ENYGMA — Iniciando API Server (puerto 8080)"
echo ""
export PORT=8080
pnpm --filter @workspace/api-server run dev
