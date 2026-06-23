# 📱 APK Build con GitHub Actions

## Resumen

Ahora tu app genera APK automáticamente en cada push a `main` o cuando lo dispares manualmente.

## Cómo funciona

### Triggers automáticos:
1. **Cada push a `main`** → Compila web + APK automáticamente
2. **Cambios en carpetas específicas:**
   - `artifacts/enygma/` (frontend)
   - `artifacts/api-server/` (backend)
   - `.github/workflows/` (mismo workflow)

### Disparo manual:
1. Ve a **GitHub** → Tu repo
2. **Actions** tab
3. **"Build Web & APK Release"**
4. Click en **"Run workflow"**
5. Selecciona **main** branch
6. **"Run workflow"**

## Descarga los APKs

### Después de cada build:
1. Ve a **Actions**
2. Click en el workflow completado ✅
3. Scroll hasta **"Artifacts"**
4. Descarga:
   - **enygma-apk-debug** (para testing)
   - **enygma-apk-release** (para Play Store)
   - **enygma-web-build** (archivos compilados)

## Archivos generados

| Archivo | Uso | Tamaño estimado |
|---------|-----|-----------------|
| `app-debug.apk` | Testing en device | ~50-100MB |
| `app-release.aab` | Play Store (app bundle) | ~40-80MB |
| Web build artifacts | Deploy a Render | ~5-10MB |

## Instalación en Android

### Debug APK (directo en dispositivo):
```bash
# Conecta tu Android device
adb install artifacts/enygma/android/app/build/outputs/apk/debug/app-debug.apk
```

### Release APK (Play Store):
- La versión `.aab` debe firmarse y subirse a Play Store
- Requiere keystore configurado (ver abajo)

## Configuración de firmas (Optional)

Si querés que el APK salga firmado directamente:

### 1. Generar keystore (una sola vez):
```bash
keytool -genkey -v -keystore enygma.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias enygma-key
```

### 2. Guardar en GitHub Secrets:
1. Ve a tu repo → **Settings** → **Secrets and variables** → **Actions**
2. Agregar secret:
   - **Name:** `KEYSTORE_BASE64`
   - **Value:** (contenido base64 del archivo .jks)

```bash
# Para convertir a base64:
base64 enygma.jks | pbcopy  # macOS
base64 enygma.jks | xclip   # Linux
# Windows: usa cualquier conversor base64 online
```

3. Agregar otros secrets:
   - `KEYSTORE_PASSWORD`: contraseña del keystore
   - `KEY_ALIAS`: nombre de la clave (ej: `enygma-key`)
   - `KEY_PASSWORD`: contraseña de la clave

### 3. Actualizar workflow para firmar:
En `.github/workflows/build-apk-docker.yml`, reemplazar la sección de build:

```yaml
- name: Build APK Release (Signed)
  run: |
    cd artifacts/enygma/android
    # Decodificar keystore
    echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 -d > keystore.jks
    
    # Build con firma
    ./gradlew assembleRelease \
      -Pandroid.injected.signing.store.file=$(pwd)/keystore.jks \
      -Pandroid.injected.signing.store.password="${{ secrets.KEYSTORE_PASSWORD }}" \
      -Pandroid.injected.signing.key.alias="${{ secrets.KEY_ALIAS }}" \
      -Pandroid.injected.signing.key.password="${{ secrets.KEY_PASSWORD }}"
```

## Troubleshooting

### Build falla con "Android SDK not found"
→ El workflow setup lo hace automáticamente. Si falla, check:
- Artifact uploading en el workflow
- Capacitor correctamente configurado

### APK muy grande (>200MB)
→ Común en primeras builds. Causas:
- Assets sin optimizar
- Duplicados en dependencies
- Solución: verificar `gradle.properties`

### No aparecen artifacts
→ Posibles causas:
- Build falló (revisar logs)
- Guardado en ruta diferente
- Solución: expandir "Artifacts" y revisar

## Versioning automático

Para auto-incrementar versionCode en cada build, agregar a `build.gradle`:

```gradle
def getVersionCode() {
    return System.getenv("GITHUB_RUN_NUMBER")?.toInteger() ?: 1
}

android {
    defaultConfig {
        versionCode getVersionCode()
        versionName "1.0.${getVersionCode()}"
    }
}
```

## Deploy a Play Store

1. **Firma el APK** (ver configuración de firmas arriba)
2. **Genera Play Store key** en Google Play Console
3. **Crea un secret** `PLAY_STORE_KEY`
4. **Agrega paso al workflow:**

```yaml
- name: Deploy to Play Store
  uses: r0adkll/upload-google-play@v1
  with:
    serviceAccountJsonPlainText: ${{ secrets.PLAY_STORE_KEY }}
    packageName: com.enygma.app
    releaseFiles: 'artifacts/enygma/android/app/build/outputs/bundle/release/**/*.aab'
    track: internal  # o 'alpha', 'beta', 'production'
```

## Logs y debugging

Para ver logs detallados:
1. Ve a **Actions**
2. Click en workflow
3. Click en **"build-apk"** job
4. Expande cualquier step
5. Los logs van directo a GitHub

## Performance

- **Tiempo de build:** ~15-25 minutos (primera vez)
- **Siguientes builds:** ~8-12 minutos (caché)
- **Almacenamiento:** Los artifacts se guardan 30 días

---

## Resumen rápido

✅ **Push a main** → Auto build  
✅ **Descarga en Actions** → Artifacts  
✅ **Instala en Android** → `adb install app-debug.apk`  
✅ **Listo para Play Store** → Release build  

¡Que disfrutes! 🚀
