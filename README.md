# 💼 Cobri - Gestión de Suscripciones

<div align="center">

![Cobri Logo](https://img.shields.io/badge/Cobri-SaaS-blue?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-12-orange?style=for-the-badge&logo=firebase)

**Plataforma profesional para gestionar suscripciones recurrentes y clientes**

[Demo](#) · [Documentación](#tabla-de-contenidos) · [Reportar Bug](https://github.com/tu-usuario/cobri/issues)

</div>

---

## 📋 Tabla de Contenidos

- [Características](#-características)
- [Tech Stack](#-tech-stack)
- [Inicio Rápido](#-inicio-rápido)
- [Configuración](#-configuración)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Scripts Disponibles](#-scripts-disponibles)
- [Funcionalidades](#-funcionalidades)
- [Deployment](#-deployment)
- [Contribuir](#-contribuir)
- [Licencia](#-licencia)

---

## ✨ Características

### 🎯 Gestión de Suscripciones
- ✅ **Dashboard con KPIs en tiempo real**
  - Suscripciones activas
  - MRR (Monthly Recurring Revenue)
  - Nuevos clientes del mes
  - Porcentaje de crecimiento
  
- ✅ **Visualización de datos**
  - Gráficos de ingresos (últimos 6 meses)
  - Próximos cobros (7 días)
  - Filtros avanzados por estado

- ✅ **Gestión completa**
  - Crear, editar, pausar, reanudar suscripciones
  - Marcar pagos recibidos
  - Historial de pagos
  - Estados: Activa, Pausada, Cancelada, Pendiente

### 👥 Gestión de Clientes
- ✅ Base de datos de clientes
- ✅ Relación cliente-suscripciones
- ✅ Valor total por cliente
- ✅ Búsqueda y filtros

### 🌍 Multiidioma
- ✅ Español e Inglés
- ✅ Cambio dinámico sin recargar
- ✅ 100% traducido (UI completa)

### 🎨 Diseño Moderno
- ✅ Dark/Light mode
- ✅ Responsive (mobile-first)
- ✅ UI elegante con Radix UI + Tailwind CSS
- ✅ Animaciones suaves

### ⚡ Performance
- ✅ Lazy loading de componentes pesados
- ✅ Code splitting optimizado
- ✅ Bundle reducido ~35%
- ✅ Tree-shaking de iconos

### 🔒 Seguridad
- ✅ Autenticación con Firebase
- ✅ Google OAuth integrado
- ✅ Validación de variables de entorno
- ✅ TypeScript strict mode

---

## 🛠 Tech Stack

### Frontend
- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Lenguaje:** [TypeScript 5](https://www.typescriptlang.org/)
- **Estilos:** [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/)
- **Gráficos:** [Recharts](https://recharts.org/)
- **Iconos:** [Tabler Icons](https://tabler.io/icons)

### Backend & Database
- **BaaS:** [Firebase](https://firebase.google.com/)
  - Authentication (Google OAuth)
  - Firestore (NoSQL Database)
  - Real-time subscriptions

### Internacionalización
- **i18n:** [next-intl](https://next-intl-docs.vercel.app/)
- **Idiomas:** Español, Inglés

### Otros
- **Validación:** [Zod](https://zod.dev/)
- **Temas:** [next-themes](https://github.com/pacocoursey/next-themes)
- **Forms:** [React Hook Form](https://react-hook-form.com/)
- **Date:** [date-fns](https://date-fns.org/)

---

## 🚀 Inicio Rápido

### Prerequisitos

```bash
Node.js 18+
npm o pnpm
Cuenta de Firebase
```

### Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/tu-usuario/cobri.git
cd cobri

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
# Copia environment.example.txt y renómbralo a .env.local
# Luego llena tus credenciales de Firebase

# 4. Iniciar servidor de desarrollo
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

---

## ⚙️ Configuración

### 1. Firebase Setup

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita **Authentication** → Google Sign-in
3. Crea una base de datos **Firestore**
4. Obtén las credenciales del proyecto

### 2. Variables de Entorno

Crea un archivo `.env.local` en la raíz:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

> 💡 Usa `environment.example.txt` como referencia completa

**Validación automática:** El proyecto usa Zod para validar todas las variables al inicio. Si falta alguna, verás un error claro en la consola.

### 3. Firestore Structure

```
users/{userId}/
  ├── customers/
  │   └── {customerId}
  │       ├── name: string
  │       ├── email: string
  │       ├── createdAt: timestamp
  │       ├── subscriptions: number
  │       └── totalValue: number
  │
  └── subscriptions/
      └── {subscriptionId}
          ├── customerId: string
          ├── plan: string
          ├── price: number
          ├── billingCycle: 'monthly' | 'yearly'
          ├── status: 'authorized' | 'paused' | 'cancelled' | 'pending'
          ├── createdAt: timestamp
          ├── nextPayment: timestamp
          └── lastPayment: timestamp
```

---

## 📁 Estructura del Proyecto

```
cobri/
├── app/
│   ├── [locale]/              # Rutas internacionalizadas
│   │   ├── app/               # Rutas protegidas (requieren auth)
│   │   │   ├── page.tsx       # 📊 Dashboard
│   │   │   ├── subscriptions/ # Lista de suscripciones
│   │   │   ├── customers/     # Lista de clientes
│   │   │   └── settings/      # Configuración
│   │   ├── auth/              # Autenticación
│   │   ├── pricing/           # Página pública de precios
│   │   └── layout.tsx         # Layout con i18n provider
│   └── api/                   # API Routes
│       └── user/
│           ├── kpis/          # KPIs del usuario
│           └── subscriptions/ # Endpoints de suscripciones
│
├── components/
│   ├── ui/                    # Componentes de UI base (Radix)
│   ├── app-shell.tsx          # Layout principal
│   ├── app-sidebar.tsx        # Navegación lateral
│   ├── auth-provider.tsx      # Contexto de autenticación
│   ├── kpi-card.tsx           # Tarjeta de KPI
│   ├── revenue-chart.tsx      # Gráfico de ingresos
│   ├── status-badge.tsx       # Badge de estado
│   └── ...                    # Otros componentes
│
├── lib/
│   ├── env.ts                 # Validación de variables de entorno
│   ├── firebase.ts            # Configuración de Firebase
│   ├── kpis.ts                # Cálculos de métricas
│   └── utils.ts               # Utilidades
│
├── hooks/
│   ├── use-translations.ts    # Re-export de next-intl
│   ├── use-toast.ts           # Toast notifications
│   └── use-mobile.ts          # Detección mobile
│
├── messages/
│   ├── es.json                # Traducciones en español
│   └── en.json                # Traducciones en inglés
│
├── public/                    # Archivos estáticos
├── i18n.ts                    # Configuración i18n
├── middleware.ts              # Middleware de next-intl
├── next.config.mjs            # Configuración de Next.js
└── tsconfig.json              # Configuración de TypeScript
```

---

## 🎮 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia servidor de desarrollo (localhost:3000)

# Producción
npm run build        # Construye para producción
npm start            # Inicia servidor de producción

# Calidad de código
npm run lint         # Ejecuta ESLint

# TypeScript
npx tsc --noEmit     # Verifica errores de TypeScript
```

---

## 🎯 Funcionalidades Principales

### 📊 Dashboard
- **KPIs en tiempo real:** Activas, MRR, Nuevos, Crecimiento
- **Gráfico de tendencias:** Ingresos últimos 6 meses
- **Próximos cobros:** Lista de cobros en los próximos 7 días
- **Empty states:** Guías cuando no hay datos

### 💳 Suscripciones
- Crear suscripciones para clientes nuevos o existentes
- Editar plan, precio, ciclo de facturación
- Marcar pagos como recibidos (actualiza automáticamente próximo cobro)
- Pausar/Reanudar suscripciones
- Eliminar suscripciones
- Filtrar por estado y buscar por nombre/email

### 👥 Clientes
- Crear clientes con nombre, email
- Ver todas las suscripciones por cliente
- Valor total del cliente (MRR acumulado)
- Búsqueda de clientes

### ⚙️ Configuración
- Ver información de cuenta
- Cambiar tema (claro/oscuro/sistema)
- Cambiar idioma (ES/EN)
- Cerrar sesión

---

## 🌍 Internacionalización

El proyecto soporta múltiples idiomas mediante `next-intl`:

```typescript
// Usar traducciones en componentes
import { useTranslations } from 'next-intl'

function MyComponent() {
  const t = useTranslations('namespace')
  return <h1>{t('title')}</h1>
}
```

**Agregar nuevo idioma:**
1. Crear `messages/xx.json` (ej: `pt.json` para portugués)
2. Actualizar `middleware.ts`: `locales: ['en', 'es', 'pt']`
3. Actualizar `i18n.ts` con el nuevo idioma

---

## 📦 Deployment

### Vercel (Recomendado)

```bash
# 1. Instalar Vercel CLI
npm i -g vercel

# 2. Deploy
vercel

# 3. Configurar variables de entorno en Vercel Dashboard
# Project Settings → Environment Variables
```

### Otros Proveedores

El proyecto es compatible con:
- Netlify
- Railway
- Render
- Digital Ocean App Platform

**Requerimientos:**
- Node.js 18+
- Variables de entorno configuradas
- Build command: `npm run build`
- Start command: `npm start`

---

## 🔒 Seguridad

### Variables de Entorno
- ✅ Validadas con Zod al inicio
- ✅ `.env.local` en `.gitignore`
- ✅ Solo `NEXT_PUBLIC_*` expuestas al cliente

### Firestore Rules (Producción)

⚠️ **IMPORTANTE:** Antes de producción, actualiza las reglas de Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Recomendaciones
- Habilitar App Check de Firebase
- Configurar CORS apropiadamente
- Usar Firebase Security Rules estrictas
- Rate limiting en APIs (futuro)

---

## 🎨 Personalización

### Tema de Colores

Los colores se configuran en `app/globals.css`:

```css
@layer base {
  :root {
    --primary: 210 100% 50%;
    --success: 142 76% 36%;
    /* ... más variables */
  }
  
  .dark {
    --primary: 210 100% 60%;
    /* ... versiones oscuras */
  }
}
```

### Componentes UI

Basados en [shadcn/ui](https://ui.shadcn.com/). Para agregar nuevos:

```bash
npx shadcn-ui@latest add [component-name]
```

---

## 📊 Métricas y KPIs

### Cálculos Implementados

**MRR (Monthly Recurring Revenue):**
```typescript
// Suscripciones mensuales: precio directo
// Suscripciones anuales: precio / 12
const mrr = subscriptions.reduce((total, sub) => {
  const monthlyValue = sub.billingCycle === 'yearly' 
    ? sub.price / 12 
    : sub.price
  return total + monthlyValue
}, 0)
```

**Crecimiento:**
```typescript
// Compara MRR actual vs mes anterior
const growth = ((currentMRR - lastMonthMRR) / lastMonthMRR) * 100
```

**Datos del Gráfico:**
- Muestra MRR acumulado de los últimos 6 meses
- Basado en fecha de creación (`createdAt`)
- Se actualiza en tiempo real

---

## 🧪 Testing

### Setup de Tests (Futuro)

```bash
# Instalar dependencias de testing
npm install -D vitest @testing-library/react @testing-library/jest-dom

# Ejecutar tests
npm test
```

---

## 🐛 Solución de Problemas

### Error: "Invalid environment variables"

**Causa:** Faltan variables de entorno

**Solución:**
1. Verifica que `.env.local` exista
2. Copia desde `environment.example.txt`
3. Llena todas las variables requeridas
4. Reinicia el servidor

### Error: "Firebase initialization failed"

**Causa:** Credenciales incorrectas

**Solución:**
1. Verifica en Firebase Console
2. Asegúrate que el proyecto exista
3. Copia las credenciales exactas

### Error: "NextRouter was not mounted"

**Causa:** (Ya resuelto) Hook de router incorrecto

**Solución:** Ya está implementado en la versión actual

### Gráfico no se ve o está en negro

**Causa:** (Ya resuelto) Colores no adaptados a tema

**Solución:** Ya está implementado con detección de tema

---

## 📚 Recursos Adicionales

### Documentación del Proyecto
- [SETUP.md](./SETUP.md) - Guía detallada de configuración
- [MEJORAS.md](./MEJORAS.md) - Plan de mejoras y roadmap
- [PROGRESO-HOY.md](./PROGRESO-HOY.md) - Progreso reciente

### Documentación Externa
- [Next.js Docs](https://nextjs.org/docs)
- [Firebase Docs](https://firebase.google.com/docs)
- [next-intl Docs](https://next-intl-docs.vercel.app/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Radix UI Docs](https://www.radix-ui.com/primitives/docs/overview/introduction)

---

## 🤝 Contribuir

Las contribuciones son bienvenidas! Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add: nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

### Guías de Contribución

- Sigue el estilo de código existente
- Ejecuta `npm run lint` antes de commit
- Verifica que no haya errores de TypeScript
- Actualiza la documentación si es necesario
- Revisa [MEJORAS.md](./MEJORAS.md) para tareas pendientes

---

## 🗺️ Roadmap

Ver [MEJORAS.md](./MEJORAS.md) para el plan completo de desarrollo.

### Próximas Funcionalidades
- [ ] Notificaciones por email
- [ ] Integración real con MercadoPago
- [ ] Exportar datos a CSV/Excel
- [ ] Reportes personalizados
- [ ] Multi-moneda
- [ ] Tests automatizados

---

## 📝 Changelog

### v0.2.0 (31/10/2025) - Dashboard y Performance
- ✅ Dashboard completo con KPIs reales
- ✅ Gráfico de ingresos (6 meses)
- ✅ Optimizaciones de performance (~35% bundle reduction)
- ✅ StatusBadge internacionalizado
- ✅ Validación de variables de entorno
- ✅ TypeScript strict mode habilitado
- 🐛 Múltiples bugs corregidos (router, i18n, cálculos)

### v0.1.0 - Versión Inicial
- ✅ Autenticación con Google
- ✅ Gestión de suscripciones
- ✅ Gestión de clientes
- ✅ Multiidioma (ES/EN)
- ✅ Dark/Light mode

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

---

## 👨‍💻 Autor

**Tu Nombre**
- GitHub: [@tu-usuario](https://github.com/tu-usuario)
- Email: tu@email.com

---

## 🙏 Agradecimientos

- [shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [v0.dev](https://v0.dev/) - Generación de UI
- [Firebase](https://firebase.google.com/) - Backend as a Service
- [Vercel](https://vercel.com/) - Hosting y deployment

---

## ⭐ Star History

Si este proyecto te fue útil, considera darle una estrella ⭐

---

<div align="center">

**Hecho con ❤️ y TypeScript**

[⬆ Volver arriba](#-cobri---gestión-de-suscripciones)

</div>

