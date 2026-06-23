## Deploy a DigitalOcean (App Platform) + auto deploy en cada cambio

### Importante (sobre FileZilla)
Si querés que **cada cambio** se despliegue automáticamente en DigitalOcean, necesitás que el proyecto esté en un **repo Git** (por ejemplo **GitHub**).

Subir por **FileZilla** es manual (y DigitalOcean App Platform no “escucha” cambios por FTP).

---

## Opción recomendada: DigitalOcean App Platform (Dockerfile)
Este repo ya tiene **Dockerfile** listo (construye frontend + backend y sirve todo desde el backend).

### 1) Subir el código a GitHub
1. Creá un repo en GitHub.
2. Subí este proyecto (carpeta raíz) al repo.
3. Usá la rama `main`.

### 2) Crear la App en DigitalOcean
1. En DigitalOcean: **App Platform → Create App**
2. Conectá tu GitHub y elegí el repo.
3. Seleccioná **Dockerfile** (DO lo detecta solo).

### 3) Variables de entorno (recomendadas)
En App Platform → Settings → Environment Variables:
- `NODE_ENV=production`
- `PORT=8080` (DigitalOcean suele inyectar `PORT` igualmente; dejar 8080 es ok)
- (Opcional) `TMDB_API_KEY=...` (si querés tu propia key)
- (Opcional) `MOVIES_SHEET_URL=...`
- (Opcional) `SERIES_SHEET_URL=...`
- (Opcional) `ANIME_SHEET_URL=...`
- (Opcional) `SHEETS_CACHE_TTL_MS=60000` (1 min)
- (Opcional) `HOME_CACHE_TTL_MS=10000` (10 s)

### 4) Persistencia del Admin (muy importante)
El admin guarda configuración en un archivo JSON. Si no agregás persistencia,
**se pierde cuando redeployás**.

Solución recomendada en App Platform:
1. Agregar **Persistent Storage / Volume**
2. Montarlo, por ejemplo, en `/app/data`
3. Setear:
   - `ADMIN_CONFIG_PATH=/app/data/admin-config.json`

### 5) Auto deploy en cada cambio
En App Platform:
1. Dejá habilitado **Autodeploy on push**
2. Cada vez que hagas `git push` a `main`, DigitalOcean reconstruye y despliega.

---

## Si igual querés “subir por FileZilla”
Eso corresponde más a un **Droplet** (servidor).
En ese caso se hace deploy manual (subir archivos + levantar Docker/Node), y NO es automático.
Si querés, lo armamos también, pero para “cada cambio se refleje” lo mejor es GitHub + App Platform.

