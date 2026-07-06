# ENYGMA Cine

Plataforma de streaming de películas, series y anime. Monorepo con pnpm.

## Stack

- **Frontend**: React + Vite + TailwindCSS (`artifacts/enygma`, puerto 5000)
- **Backend**: Express + TypeScript (`artifacts/api-server`, puerto 8080)
- **Datos**: Google Sheets CSV (URLs en `artifacts/api-server/.env`)

## Cómo levantar

```bash
pnpm install
```

Luego correr los dos workflows:
- **Start application** → frontend en puerto 5000
- **API Server** → backend en puerto 8080

## Variables de entorno

- `TMDB_API_KEY` — guardado como Replit Secret (para posters y metadata)
- Google Sheets URLs — en `artifacts/api-server/.env`

## User preferences

- Español rioplatense en comunicación
