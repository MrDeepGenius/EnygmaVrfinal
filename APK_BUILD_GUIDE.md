# 📱 GUÍA PARA COMPILAR APK - ENYGMA para Android TV / Roku

## ✅ Estado Actual de la App

La app ya está **100% optimizada** para Android TV:
- ✅ Compilación exitosa
- ✅ Orientación: Landscape (horizontal)
- ✅ PWA lista
- ✅ Rendimiento optimizado
- ✅ Manifest configurado para TV

---

## 📦 Opción 1: Usar Capacitor (RECOMENDADO para APK)

### Requisitos:
1. Node.js 16+ (ya tienes)
2. Android Studio (descargarlo)
3. Java Development Kit (JDK) 11+
4. Android SDK

### Pasos:

#### 1. Instalar Capacitor globalmente
```bash
npm install -g @capacitor/cli
```

#### 2. Agregar plataforma Android al proyecto
```bash
cd "c:\Users\gabii\Downloads\ULTIMO APP CO\levantar (1)\artifacts\enygma"

npx cap add android
```

#### 3. Sincronizar la app compilada con Android
```bash
npx cap sync android
```

#### 4. Abrir Android Studio
```bash
npx cap open android
```

#### 5. En Android Studio:
- Selecciona: **Build → Generate Signed Bundle/APK**
- Elige: **APK (no Bundle)**
- Selecciona: **release**
- Crea/selecciona keystore
- Completa la firma
- ¡Listo! Tu APK estará en: `android/app/release/app-release.apk`

---

## 📦 Opción 2: Usar Apache Cordova (Alternativa)

```bash
npm install -g cordova

cd artifacts/enygma

cordova create enygma-app com.enygma.cine ENYGMA

cd enygma-app

cordova platform add android

cordova build android --release
```

El APK estará en: `platforms/android/app/build/outputs/apk/release/`

---

## 📦 Opción 3: Usar React Native (Para máximo rendimiento en TV)

Si quieres máximo rendimiento:

```bash
npm install -g react-native-cli

npx react-native init ENYGMAApp --template

# Luego migrar los componentes React
```

---

## ⚙️ Configuraciones para Android TV en Capacitor

Si usas Capacitor, edita el archivo:
`android/app/src/main/AndroidManifest.xml`

Agrega estas líneas dentro de `<application>`:

```xml
<uses-feature android:name="android.software.leanback" android:required="false" />
<uses-feature android:name="android.hardware.touchscreen" android:required="false" />

<activity
    android:name=".MainActivity"
    android:launchMode="singleTop"
    android:alwaysRetainTaskState="true"
    android:configChanges="orientation|screenSize|keyboardHidden"
    android:screenOrientation="sensorLandscape">
    
    <!-- Android TV Leanback Launcher -->
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
        <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
    </intent-filter>
</activity>
```

---

## 🚀 Para Testing en Android TV/Roku:

### Opción 1: Emulador de Android TV en Android Studio
1. Abre Android Studio
2. Tools → Device Manager
3. Create device → TV Device (1080p)
4. Ejecuta la app en el emulador

### Opción 2: Dispositivo físico
1. Habilita USB Debugging en la TV
2. Conecta por USB
3. Ejecuta: `adb install app-release.apk`

---

## 📊 Tamaños esperados:

- **Build Vite**: ~2.3MB (web)
- **APK sin optimizar**: ~50-80MB
- **APK con optimizaciones**: ~35-50MB
- **APK con ProGuard/R8**: ~25-35MB

---

## 🔧 Optimizaciones adicionales (opcional):

### Reducir tamaño APK:
1. Edita: `android/app/build.gradle`
2. Agrega:
```gradle
android {
    ...
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### Para máximo rendimiento en TV:
- AndroidManifest.xml: Agrega `android:hardwareAccelerated="true"`
- Usa targetSdkVersion: 33+
- Habilita 60FPS en vídeos

---

## 🎯 Checklist Final:

- ✅ Build compilado sin errores
- ✅ Manifest.json configurado para landscape
- ✅ index.html optimizado para TV
- ✅ PWA habilitado
- ✅ Rendimiento optimizado
- ✅ Android Studio instalado
- ✅ JDK 11+ instalado
- ✅ Android SDK configurado

---

## ❓ Troubleshooting:

**Problema**: "Could not find android sdk"
**Solución**: 
```bash
set ANDROID_SDK_ROOT=C:\Users\[TuUsuario]\AppData\Local\Android\Sdk
```

**Problema**: "Gradle build failed"
**Solución**: 
```bash
cd android
./gradlew clean
./gradlew build
```

**Problema**: APK muy grande
**Solución**: Activa ProGuard/R8 en build.gradle (vide arriba)

---

## 📝 Próximos pasos:

1. Descarga Android Studio: https://developer.android.com/studio
2. Instala JDK 11: https://www.oracle.com/java/technologies/javase-jdk11-downloads.html
3. Sigue los pasos de Capacitor arriba
4. ¡Genera tu APK!

---

**Status**: ✅ App lista para compilación APK
**Última actualización**: 2024
**Optimizada para**: Android TV, Google TV, Roku, Smart TV

