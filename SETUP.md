# 🚀 Guía de Configuración - Cobri

## 📋 Requisitos Previos

- Node.js 18+ instalado
- npm o pnpm
- Cuenta de Firebase
- Git

---

## ⚙️ Configuración Inicial

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd cobri
```

### 2. Instalar dependencias

```bash
npm install
# o
pnpm install
```

### 3. Configurar Variables de Entorno

#### Opción A: Usando el template

1. Copia el archivo `environment.example.txt` y renómbralo a `.env.local`:

```bash
# En Windows (PowerShell)
Copy-Item environment.example.txt .env.local

# En Linux/Mac
cp environment.example.txt .env.local
```

2. Edita `.env.local` con tus credenciales de Firebase

#### Opción B: Crear desde cero

Crea un archivo `.env.local` en la raíz del proyecto:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key_aqui
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 4. Obtener Credenciales de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto (o crea uno nuevo)
3. Ve a **Project Settings** (⚙️ ícono de engranaje)
4. Baja a la sección **"Your apps"**
5. Haz clic en el ícono de **</> Web** o crea una nueva app web
6. Copia los valores de configuración a tu `.env.local`

### 5. Configurar Firebase

#### Habilitar Authentication:
1. En Firebase Console, ve a **Authentication**
2. Haz clic en **Get Started**
3. Habilita el método **Google** en la pestaña Sign-in method

#### Configurar Firestore:
1. En Firebase Console, ve a **Firestore Database**
2. Haz clic en **Create database**
3. Selecciona **Start in test mode** (para desarrollo)
4. Elige una ubicación para tu base de datos

⚠️ **IMPORTANTE:** Para producción, implementa las reglas de seguridad apropiadas

---

## 🏃‍♂️ Ejecutar el Proyecto

### Modo Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador

### Build de Producción

```bash
npm run build
npm start
```

---

## 🔍 Verificación de la Configuración

Si la configuración es correcta, deberías ver:
- ✅ La aplicación inicia sin errores
- ✅ Puedes navegar a la página de pricing
- ✅ Puedes hacer login con Google
- ✅ No hay errores en la consola del navegador sobre variables de entorno

Si hay errores:
- ❌ **Error de validación de env:** Verifica que todas las variables en `.env.local` estén correctas
- ❌ **Firebase errors:** Verifica tus credenciales de Firebase
- ❌ **Auth errors:** Verifica que Google Auth esté habilitado en Firebase Console

---

## 📁 Estructura de Rutas

```
http://localhost:3000/es      - Versión en español (dashboard)
http://localhost:3000/en      - Versión en inglés (dashboard)
http://localhost:3000/es/pricing    - Página de precios
http://localhost:3000/es/auth/sign-in    - Login
```

---

## 🛠️ Scripts Disponibles

```bash
npm run dev        # Inicia servidor de desarrollo
npm run build      # Construye para producción
npm start          # Inicia servidor de producción
npm run lint       # Ejecuta el linter
```

---

## 🔒 Seguridad

### Variables de Entorno

- ✅ **NUNCA** subas `.env.local` a git (ya está en `.gitignore`)
- ✅ Usa el archivo `environment.example.txt` como referencia
- ✅ Las variables con `NEXT_PUBLIC_` están expuestas al navegador
- ✅ Mantén las API keys de producción en variables de entorno del servidor

### Firestore Rules (Producción)

Antes de lanzar a producción, actualiza tus reglas de Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🐛 Solución de Problemas

### Error: "Invalid environment variables"

**Causa:** Faltan o son inválidas las variables de entorno

**Solución:**
1. Verifica que `.env.local` exista
2. Verifica que todas las variables requeridas estén presentes
3. Reinicia el servidor de desarrollo

### Error: Firebase initialization failed

**Causa:** Credenciales incorrectas de Firebase

**Solución:**
1. Verifica las credenciales en Firebase Console
2. Asegúrate de copiar los valores completos (sin espacios extras)
3. Verifica que el proyecto de Firebase exista

### Error: "Next router not mounted"

**Causa:** Hook de next-intl usado fuera de contexto

**Solución:**
- Ya está resuelto en la versión actual
- Asegúrate de estar en la última versión del código

---

## 📚 Recursos

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Firebase](https://firebase.google.com/docs)
- [Documentación de next-intl](https://next-intl-docs.vercel.app/)
- [Archivo MEJORAS.md](./MEJORAS.md) - Plan de mejoras del proyecto

---

## 🤝 Contribuir

1. Revisa el archivo [MEJORAS.md](./MEJORAS.md) para ver el plan de desarrollo
2. Crea una rama para tu feature
3. Haz commit de tus cambios
4. Crea un Pull Request

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa esta guía de setup
2. Verifica el archivo [MEJORAS.md](./MEJORAS.md)
3. Revisa la consola del navegador y terminal para errores específicos

---

**Última actualización:** 31/10/2025

