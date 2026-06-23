# Deploy en DigitalOcean (ENYGMA)

Este repo queda listo para deploy **en 1 contenedor**: la **API (Express)** sirve también el **frontend (Vite build)**.

## Variables de entorno

Recomendado cargarlas como **Environment Variables / Secrets** en DigitalOcean:

- `PORT` (DigitalOcean lo setea solo en App Platform; en Docker/Droplet usar `8080`)
- `TMDB_API_KEY` (recomendado)
- (Opcional) `MOVIES_SHEET_URL`
- (Opcional) `SERIES_SHEET_URL`
- (Opcional) `ANIME_SHEET_URL`

> Si no seteás las URLs de Sheets, se usan las que vienen por default en el repo.

---

## Opción A (Recomendada): DigitalOcean App Platform (con Dockerfile)

1. Subí el proyecto a GitHub (o GitLab).
2. En DigitalOcean: **Create → Apps**.
3. Elegí el repo y como tipo de build seleccioná **Dockerfile**.
4. Asegurate de:
   - **HTTP Port**: `8080` (o “Use PORT env var” si aparece)
   - Setear variables en **Environment Variables** (arriba)
5. Deploy.

La app queda disponible en la URL de App Platform. Si agregás dominio, DO te configura HTTPS.

---

## Opción B: Droplet + Docker (docker compose)

En un droplet Ubuntu:

1. Instalar Docker + Compose (guía oficial de Docker).
2. Clonar el repo en el servidor.
3. (Opcional) Crear un `.env` y exportar variables, o setearlas en el `docker-compose.yml`.
4. Levantar:

```bash
docker compose up -d --build
```

Queda publicado en el puerto **80** del droplet (mapea `80 → 8080`).

---

## Notas

- El contenedor expone **8080** y sirve:
  - API: `/api/*`
  - Frontend: `/` (SPA)
- El endpoint de health: `/api/healthz`

