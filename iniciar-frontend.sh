#!/bin/bash
echo "ENYGMA — Iniciando Frontend"
echo "Abrí http://localhost:3000 en el browser"
echo ""
export PORT=3000
pnpm --filter @workspace/enygma run dev:local
