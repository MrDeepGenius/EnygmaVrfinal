# 🚀 GitHub Actions - Compilar APK Automáticamente

## ✅ ¿Qué hice?

Configuré **GitHub Actions** para que compile tu APK automáticamente en la nube cada vez que hagas cambios.

---

## 📋 Instrucciones

### **PASO 1: Sube el código a GitHub**

En PowerShell (en la carpeta del proyecto):

```powershell
git remote add origin https://github.com/TU_USUARIO/tu-repo.git
git branch -M master
git push -u origin master
```

(Reemplaza `TU_USUARIO` y `tu-repo` con tus datos de GitHub)

---

### **PASO 2: Ve a GitHub en el navegador**

1. Ve a: https://github.com/TU_USUARIO/tu-repo
2. Click en: **Actions** (pestaña arriba)
3. Verás que se está ejecutando un build automáticamente 🔄

---

### **PASO 3: Espera a que termine (10-15 minutos)**

El workflow se ejecutará automáticamente:
- ✅ Descarga dependencias
- ✅ Compila el web
- ✅ Setup Android SDK
- ✅ Compila el APK
- ✅ Guarda el APK

---

### **PASO 4: Descarga el APK**

Cuando termine (verás ✅ verde):

1. Click en el workflow que se ejecutó
2. En "Artifacts", click en: **app-release**
3. Se descarga el APK automáticamente

**Ubicación**: `app-release.apk` en tu carpeta Descargas

---

## 🔄 Para compilar nuevamente:

Cada vez que hagas cambios:

```powershell
git add .
git commit -m "Tu mensaje"
git push
```

GitHub Actions se ejecutará automáticamente y generará un APK nuevo.

---

## 📌 Crear una Release (Oficial)

Si quieres marcar una versión oficial:

```powershell
git tag -a v1.0.0 -m "Version 1.0.0"
git push origin v1.0.0
```

Entonces:
1. En GitHub → Releases
2. Se creará automáticamente con el APK descargable

---

## ✅ Ventajas

- ✅ Sin instalar Android SDK localmente
- ✅ Compilación en la nube (gratis)
- ✅ Automático cada push
- ✅ APK siempre disponible
- ✅ Sin espacios en tu PC

---

## 🎯 Resumen Ultra Rápido

```bash
# 1. Sube a GitHub
git push origin master

# 2. Va a GitHub Actions
# 3. Espera 15 minutos
# 4. Descarga el APK en "Artifacts"

# ¡Listo! 🎉
```

---

## 📝 Ubicación del archivo workflow

```
.github/workflows/build-apk.yml
```

Este archivo controla todo el proceso de compilación automática.

---

## ❓ ¿Qué pasa ahora?

Cada vez que:
- ✅ Haces `git push`
- ✅ Subes cambios a GitHub
- ✅ Creas un tag/release

**GitHub Actions automáticamente:**
1. Descarga tu código
2. Instala dependencias
3. Compila el APK
4. Lo guarda para descargar

---

## 🎬 Próximos Pasos

1. Sube el código: `git push origin master`
2. Ve a GitHub → Actions
3. Espera a que termine
4. Descarga el APK
5. ¡Instala en tu TV! 🚀

---

**Status**: ✅ GitHub Actions Configurado y Listo
**APK**: Se compila automáticamente en la nube
**Tiempo**: 10-15 minutos por compilación

