# 📲 Guía para Compilar en APK y Actualizaciones Automáticas (OTA)

¡Hola! En esta guía encontrarás los pasos exactos y profesionales para convertir el código de tu aplicación **Shrew Chat (Musaraña)** en un archivo **APK de Android** e implementar **actualizaciones automáticas en segundo plano** (Over-The-Air), para que tus usuarios siempre tengan la última versión sin que tengas que volver a subir la app a Google Play.

---

## 🛠️ Parte 1: Cómo convertir el código a un APK con Capacitor

Hemos preinstalado y configurado **Capacitor** en tu proyecto. Capacitor es la tecnología moderna que envuelve tu aplicación web React/Vite en una aplicación móvil nativa con un rendimiento increíble.

### Requisitos previos en tu computadora:
1. **Node.js** instalado.
2. **Android Studio** instalado (con el SDK de Android configurado).

### Pasos paso a paso para crear el APK:

1. **Compilar tu aplicación web:**
   Genera la versión optimizada de producción de Shrew Chat:
   ```bash
   npm run build
   ```

2. **Inicializar el entorno de Android (si es la primera vez):**
   Crea la carpeta del proyecto de Android nativo:
   ```bash
   npx cap add android
   ```

3. **Copiar tu código web al proyecto nativo:**
   Transfiere los archivos compilados de la carpeta `dist` al proyecto de Android:
   ```bash
   npx cap sync
   ```

4. **Abrir el proyecto en Android Studio:**
   Este comando abrirá automáticamente Android Studio con tu proyecto listo para compilar:
   ```bash
   npx cap open android
   ```

5. **Generar el APK en Android Studio:**
   - Espera a que termine de indexar el proyecto (verás la barra de progreso abajo a la derecha).
   - En el menú superior, ve a: **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
   - ¡Listo! Android Studio compilará tu archivo `.apk` y te mostrará un globo flotante que dice *“APK(s) generated successfully: Analyze / Locate”*. Haz clic en **Locate** para encontrar tu archivo `app-debug.apk` listo para instalar en cualquier teléfono.

---

## 🔄 Parte 2: Actualizaciones Automáticas sin la Play Store (OTA Updates)

Para lograr que tu aplicación se actualice sola cuando hagas cambios en el código, sin tener que subir un APK nuevo ni pedirle al usuario que actualice desde la tienda, tienes dos opciones excelentes:

### Opción A: Usar Ionic Appflow Live Updates (La solución Oficial y Segura)
Ionic ofrece un servicio oficial en la nube llamado **Appflow** que maneja esto de forma automática con un par de clics:
1. Creas una cuenta gratuita en [Ionic Appflow](https://ionicframework.com/appflow).
2. Conectas tu repositorio de GitHub.
3. Instalas el SDK oficial en tu app:
   ```bash
   npm install @capacitor/live-updates
   ```
4. Cada vez que subas cambios a tu rama principal, el servicio compilará los archivos web en segundo plano y los enviará automáticamente a los teléfonos de tus usuarios de manera silenciosa.

---

### Opción B: Capacitor-Updater (Solución de código abierto, 100% gratuita)
Si prefieres una opción completamente gratuita y de código abierto que puedas hospedar tú mismo (por ejemplo, en Firebase Storage, Supabase, o tu propio servidor), puedes usar la librería `capacitor-updater`:

1. **Instalar la librería en tu proyecto:**
   ```bash
   npm install capacitor-updater
   npx cap sync
   ```

2. **Cómo funciona el código:**
   Cada vez que compilas tu web (`npm run build`), comprimes el contenido de la carpeta `dist` en un archivo `.zip`.
   Subes ese `.zip` a tu servidor (ej. `https://tuservidor.com/updates/v1.0.1.zip`).

3. **Implementación automática en el código:**
   Agregamos un chequeo simple al inicio de la aplicación (`src/App.tsx`) para descargar e instalar la actualización:

   ```typescript
   import { CapacitorUpdater } from 'capacitor-updater';

   // Función para buscar actualizaciones al iniciar la aplicación
   async function checkForUpdates() {
     try {
       const response = await fetch('https://tuservidor.com/api/version-check');
       const data = await response.json();
       
       if (data.url_zip_update) {
         // Descargar y aplicar actualización en segundo plano
         const update = await CapacitorUpdater.download({
           url: data.url_zip_update,
           version: data.new_version,
         });
         
         // Aplica la actualización. Al reiniciar la app se cargará la versión nueva.
         await CapacitorUpdater.set(update);
       }
     } catch (error) {
       console.warn('No se pudo verificar actualizaciones:', error);
     }
   }
   ```

---

## 💡 Consejos para la Tienda (Google Play Store)
* Cuando decidas publicar en Google Play Store, en lugar de compilar un **APK**, selecciona **Build** > **Generate Signed Bundle / APK** y elige **Android App Bundle (.aab)**. Google Play requiere este formato para subir aplicaciones nuevas.
* Las actualizaciones OTA (de código web como HTML/CSS/JS) están permitidas por las políticas de Google Play, siempre y cuando no alteren el propósito principal de la aplicación. ¡Así que puedes usar este método con total tranquilidad!
