# Desplegar ENYGMA en Fly.io

## Requisitos

1. Cuenta en [fly.io](https://fly.io)
2. CLI de Fly.io instalado: `curl -L https://fly.io/install.sh | sh`
3. Código en GitHub

## Pasos

### 1. Instalar Fly CLI

```bash
curl -L https://fly.io/install.sh | sh
```

### 2. Autenticarse

```bash
flyctl auth login
```

### 3. Crear la app

```bash
flyctl launch
```

Responde las preguntas:
- App name: `enygma-app` (o el que prefieras)
- Region: `iad` (o la más cercana)
- Database: No
- Postgres: No

### 4. Configurar variables de entorno

```bash
flyctl secrets set TMDB_API_KEY=b9b334be32f57187296a06cfed4f2821
flyctl secrets set NODE_ENV=production
```

### 5. Desplegar

```bash
flyctl deploy
```

### 6. Ver logs

```bash
flyctl logs
```

### 7. Abrir la app

```bash
flyctl open
```

---

## Despliegues posteriores

Cada vez que hagas push a GitHub:

```bash
flyctl deploy
```

O configura GitHub Actions para deploy automático.

---

## Troubleshooting

**Error: "PORT environment variable is required"**
- Ya está configurado en `fly.toml`

**Error: "Cannot find module"**
- Asegúrate de que `pnpm-lock.yaml` está en el repo

**La app es lenta**
- Aumenta la memoria en `fly.toml`:
  ```toml
  [build]
    memory = 2048
  ```

---

## URLs

- **App**: https://enygma-app.fly.dev
- **API**: https://enygma-app.fly.dev/api
- **Admin**: https://enygma-app.fly.dev/admin
