@echo off
REM Script para compilar APK de ENYGMA para Android TV

echo.
echo ========================================
echo   ENYGMA APK Builder para Android TV
echo ========================================
echo.

REM Paso 1: Build web
echo [1/4] Compilando web...
call npm run build
if errorlevel 1 (
    echo ERROR: Build web falló
    pause
    exit /b 1
)

REM Paso 2: Sincronizar con Android
echo.
echo [2/4] Sincronizando con Android...
cd artifacts\enygma
call npx cap sync android
if errorlevel 1 (
    echo ERROR: Sync falló
    pause
    exit /b 1
)

REM Paso 3: Limpiar Gradle
echo.
echo [3/4] Limpiando cache Gradle...
cd android
call gradlew clean
if errorlevel 1 (
    echo ERROR: Gradle clean falló
    pause
    exit /b 1
)

REM Paso 4: Build Release APK
echo.
echo [4/4] Compilando APK Release...
call gradlew build -x lint
if errorlevel 1 (
    echo ERROR: Build APK falló
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ APK compilado exitosamente!
echo ========================================
echo.
echo Ubicación del APK:
echo android\app\build\outputs\apk\release\app-release.apk
echo.
pause
