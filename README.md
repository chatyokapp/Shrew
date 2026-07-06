# 🐹 Shrew Chat (Musaraña) — Web & Mobile Community App

[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-Latest-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore_&_Auth-FFCA28?style=flat&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android-119EFF?style=flat&logo=capacitor&logoColor=white)](https://capacitorjs.com/)

**Shrew Chat** (conocido cariñosamente como **Musaraña**) es una plataforma de chat en tiempo real diseñada para comunidades de alta velocidad. Con una interfaz moderna inspirada en Discord y adaptada con precisión quirúrgica para una experiencia móvil nativa fluida, Shrew permite a los usuarios interactuar a través de canales organizados, mensajes directos privados y publicaciones de micro-blogging instantáneas.

Este proyecto ha sido estructurado como una aplicación **híbrida (Web y Móvil)**, lo que significa que el mismo código fuente optimizado de React se ejecuta tanto en navegadores web de escritorio como empaquetado nativamente en un archivo **APK de Android** usando Capacitor.

---

## 👥 Creadores del Proyecto

Este ecosistema ha sido diseñado y desarrollado con dedicación por:
*   **[Tu Nombre / Tu Nombre de Usuario]** - *Desarrollo de Software y Arquitectura Web/Móvil* ([@TuGitHub](https://github.com/TuUsuario))
*   **[Nombre de tu Socio/Colaborador]** - *Diseño de Experiencia de Usuario (UX/UI) y Control de Calidad* ([@SocioGitHub](https://github.com/SocioUsuario))

*¿Quieres colaborar? ¡Revisa nuestra sección de contribuciones al final de este documento!*

---

## 🎯 ¿En qué se centra Shrew?

Shrew se enfoca en tres pilares fundamentales de la comunicación digital:
1.  **Velocidad Extrema (High-Speed Communities):** Sincronización en tiempo real gracias a los sockets reactivos de Firebase Firestore, permitiendo que los mensajes y actualizaciones aparezcan al instante.
2.  **Identidad Express (Squeaks & Profiles):** Un espacio híbrido donde no solo chateas, sino que puedes publicar ideas rápidas (*Squeaks*) y personalizar tu madriguera con banners e imágenes de perfil dinámicas (soporta GIFs).
3.  **Portabilidad Sin Fricciones (Multiplataforma):** Una interfaz adaptable ("responsive") pensada en formato móvil nativo pero perfectamente pulida para escritorio.

---

## ✨ Características Principales

### 🌐 Multiplataforma Nativa
*   **Versión Web:** Totalmente optimizada para navegadores móviles y de escritorio.
*   **Versión Móvil (Android):** Configurado con **Capacitor JS** para compilarse en un archivo `.apk` de manera nativa con animaciones fluidas a 60fps.

### 💬 Mensajería y Canales (Nests)
*   **Nidos (Nests):** Espacios organizados por temáticas para chatear con comunidades completas.
*   **Mensajes Directos (DMs):** Chats uno a uno privados con búsqueda interactiva de usuarios.
*   **Estado de Lectura y Presencia:** Indicadores elegantes de estado de conexión y actividad de cada usuario.

### 📝 Squeaks (Micro-blogging)
*   Un "feed" o tablero comunitario para publicar ideas cortas, noticias, anuncios y adjuntar imágenes o GIFs dinámicos.

### 🎨 Personalización Extrema de Perfiles
*   Configuración de portadas de perfil (Cover Images) y avatares con soporte completo para archivos locales y URLs de GIFs animados.
*   Estados personalizados para mostrar qué estás haciendo en el túnel de Shrew.

### 🔍 Visor de Contenido Multimedia
*   Al tocar cualquier imagen adjunta, se abre un visor interactivo de pantalla completa.
*   **Copiar Imagen:** Botón integrado para copiar la imagen directamente en el portapapeles.
*   **Guardar Imagen:** Descarga el archivo de imagen directamente al almacenamiento local con un solo clic.

### 🔒 Autenticación Segura
*   Control de acceso robusto mediante **Firebase Authentication** (soporta inicio de sesión con Email/Contraseña y cuentas de Google).

---

## 🛠️ Tecnologías Utilizadas

*   **Frontend:** [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/) (Entorno de compilación ultra-rápido).
*   **Estilos y Diseño:** [Tailwind CSS v4](https://tailwindcss.com/) (Maquetación responsiva), [Lucide React](https://lucide.dev/) (Biblioteca de iconos de alta definición).
*   **Animaciones:** [Framer Motion / Motion](https://motion.dev/) (Transiciones y gestos fluidos).
*   **Backend y Sincronización:** [Firebase Firestore](https://firebase.google.com/docs/firestore) (Base de datos en tiempo real) y [Firebase Auth](https://firebase.google.com/docs/auth).
*   **Ecosistema Móvil:** [@capacitor/core](https://capacitorjs.com/) y `@capacitor/android` para conversión nativa de plataforma.

---

## 🚀 Cómo Ejecutar el Proyecto Localmente

### Paso 1: Clonar el repositorio
```bash
git clone https://github.com/TuUsuario/shrew-chat.git
cd shrew-chat
```

### Paso 2: Instalar dependencias
```bash
npm install
```

### Paso 3: Configurar variables de entorno
Crea un archivo `.env` en la raíz basado en `.env.example` y agrega tus credenciales de Firebase:
```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_PROJECT_ID=tu_project_id
```

### Paso 4: Iniciar el servidor de desarrollo web
```bash
npm run dev
```
La aplicación estará disponible localmente en `http://localhost:3000`.

---

## 📲 Compilación del Archivo APK (Móvil Android)

Hemos preconfigurado este repositorio para compilar directamente a un archivo APK usando Capacitor.

### Requisitos:
*   [Node.js](https://nodejs.org/) instalado.
*   [Android Studio](https://developer.android.com/studio) instalado y configurado con la última versión de la API de Android.

### Instrucciones de compilación rápida:

1.  **Genera la distribución web optimizada:**
    ```bash
    npm run build
    ```
2.  **Agrega la plataforma Android (solo la primera vez):**
    ```bash
    npx cap add android
    ```
3.  **Sincroniza el código web con el proyecto nativo:**
    ```bash
    npx cap sync
    ```
4.  **Abre el entorno en Android Studio:**
    ```bash
    npx cap open android
    ```
5.  **Generar el APK:**
    Dentro de Android Studio, ve al menú superior: `Build > Build Bundle(s) / APK(s) > Build APK(s)`. Tu archivo APK listo para instalar en cualquier teléfono se encontrará en la ruta mostrada en pantalla (haz clic en *Locate*).

> **💡 Nota sobre Actualizaciones Automáticas (OTA):**
> Para configurar actualizaciones automáticas sin necesidad de pasar por la Google Play Store cada vez que hagas un cambio visual, consulta nuestra guía completa detallada en [BUILD_APK.md](./BUILD_APK.md).

---

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas y alentadas! Si deseas mejorar Shrew Chat:
1.  Haz un Fork del proyecto.
2.  Crea una rama para tu característica (`git checkout -b feature/AmazingFeature`).
3.  Haz un Commit de tus cambios (`git commit -m 'Add some AmazingFeature'`).
4.  Haz Push a la rama (`git push origin feature/AmazingFeature`).
5.  Abre un Pull Request y lo revisaremos juntos.
