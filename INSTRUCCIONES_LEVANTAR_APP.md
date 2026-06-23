## Cómo levantar la app (ENYGMA) en tu PC

Este repo es un monorepo con **pnpm**:
- **Frontend (Vite):** `@workspace/enygma` (puerto **3000**)
- **Backend (Express):** `@workspace/api-server` (puerto **8080**)

### 1) Requisitos
- Node.js instalado (recomendado 18+ / 20+)
- pnpm instalado (en este repo se usa pnpm)

### 2) Instalar dependencias (una vez)
En la carpeta raíz del proyecto:
```bash
pnpm install
```

### 3) Variables de entorno (opcional)
El backend puede leer:
- `artifacts/api-server/.env` (preferido)
- `.env` en la raíz (fallback)

Ejemplo (ya existe en el repo):
- `artifacts/api-server/.env`

Opcional:
- `TMDB_API_KEY=...` (si querés usar tu propia key)

### 4) Levantar el backend (API)
En la raíz del proyecto:
```bash
pnpm --filter @workspace/api-server run dev
```
Esto levanta en:
- http://localhost:8080

> Si querés modo “más prod”:
```bash
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run start
```

### 5) Levantar el frontend (Web)
En otra terminal (también en la raíz):
```bash
pnpm --filter @workspace/enygma run dev:local
```
Esto levanta en:
- http://localhost:3000

### 6) Abrir en el celular (misma Wi‑Fi)
En el celu abrí (misma red que tu PC):
- http://<IP_DE_TU_PC>:3000

Ejemplo (si tu PC tiene esta IP en la red):
- http://192.168.100.18:3000

Si no abre, suele ser firewall de Windows: permitir conexiones entrantes al puerto 3000.

### 7) Admin
Dentro de la app:
- `http://localhost:3000/admin`

