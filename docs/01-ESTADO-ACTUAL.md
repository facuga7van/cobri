# Cobri - Estado Actual del Proyecto

> Auditoría realizada el 17 de marzo de 2026

## Visión General

**Cobri** es una plataforma SaaS de gestión de suscripciones recurrentes construida con Next.js 14, Firebase y Tailwind CSS. Permite a usuarios registrar clientes, crear suscripciones, visualizar KPIs y gestionar cobros.

**Estado general: PROTOTIPO FUNCIONAL** - La UI está completa, la autenticación funciona, pero el backend (APIs, pagos, seguridad) está en estado placeholder/mock.

---

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js (App Router) | 14.2.16 |
| Frontend | React + TypeScript | 18.x / 5.x |
| Estilos | Tailwind CSS | 4.x |
| UI Library | shadcn/ui (Radix UI) | Múltiples |
| Iconos | Tabler Icons + Lucide | latest |
| Auth | Firebase Authentication | 12.3.0 |
| Base de datos | Firebase Firestore | 12.3.0 |
| i18n | next-intl | 4.3.9 |
| Gráficos | Recharts | latest |
| Forms | React Hook Form + Zod | 7.x / 3.x |
| Temas | next-themes | 0.4.6 |
| Analytics | Vercel Analytics | latest |

---

## Arquitectura de Rutas

### Rutas Públicas
| Ruta | Propósito | Estado |
|------|-----------|--------|
| `/{locale}` | Redirige al dashboard | Completo |
| `/{locale}/pricing` | Página de precios | Completo |
| `/{locale}/auth/sign-in` | Login (email + Google) | Completo |
| `/{locale}/auth/sign-up` | Registro (trial 15 días) | Completo |

### Rutas Autenticadas
| Ruta | Propósito | Estado |
|------|-----------|--------|
| `/{locale}/app` | Dashboard con KPIs | Completo (95%) |
| `/{locale}/app/customers` | Listado de clientes | Completo |
| `/{locale}/app/customers/[id]` | Detalle de cliente | Completo |
| `/{locale}/app/subscriptions` | Gestión de suscripciones | Completo |
| `/{locale}/app/subscriptions/[id]` | Detalle de suscripción | Completo (95%) |
| `/{locale}/app/settings` | Configuración de usuario | Parcial (60%) |

### Páginas de Error
| Ruta | Propósito | Estado |
|------|-----------|--------|
| `/{locale}/error` | Error boundary | Completo |
| `/{locale}/global-error` | Error global crítico | Completo |
| `/{locale}/not-found` | Página 404 | Completo |

---

## Funcionalidades Implementadas

### Autenticación
- [x] Login con email/contraseña
- [x] Registro con email/contraseña
- [x] Login con Google (popup + redirect)
- [x] Detección de navegadores in-app (Instagram, Facebook, TikTok)
- [x] Persistencia adaptativa (localStorage → sessionStorage → in-memory)
- [x] Trial gratuito de 15 días al registrarse
- [x] Banner de trial con días restantes
- [ ] Recuperación de contraseña
- [ ] Verificación de email

### Dashboard
- [x] 4 KPI cards (suscripciones activas, MRR, nuevas, crecimiento)
- [x] Gráfico de ingresos (Recharts) con lazy loading
- [x] Filtros por período (1, 3, 6, 12 meses, año, todo)
- [x] Filtro por cliente específico
- [x] Persistencia de filtros en localStorage
- [x] Tabla de próximos cobros (7 días)
- [x] Cálculo real de KPIs desde Firestore (`calculateKPIs()`)

### Clientes
- [x] Listado con grid responsive
- [x] Búsqueda por nombre/email
- [x] Avatar con iniciales
- [x] Crear nuevo cliente (dialog)
- [x] Vista detallada con suscripciones
- [x] Actualización en tiempo real (onSnapshot)
- [ ] Editar cliente
- [ ] Eliminar cliente
- [ ] Importar/exportar clientes

### Suscripciones
- [x] Listado con tabla completa
- [x] Búsqueda y filtro por estado
- [x] Crear nueva suscripción (dialog)
- [x] Editar suscripción (dialog)
- [x] Marcar como pagado (crea payment record)
- [x] Pausar/reanudar suscripción
- [x] Eliminar suscripción
- [x] Cálculo automático de próximo pago
- [x] Sincronización de MRR con cliente
- [ ] Historial de pagos
- [ ] Notificaciones de pago

### UI/UX
- [x] Tema dark/light/system con sincronización Firestore
- [x] Internacionalización ES/EN completa (132 keys)
- [x] Sidebar responsive con cierre automático en mobile
- [x] Empty states con CTAs
- [x] Loading skeletons
- [x] Toast notifications
- [x] Error boundaries

### Settings
- [x] Visualización de perfil (email, nombre, fecha registro)
- [x] Switch de tema
- [ ] Edición de perfil
- [ ] Cambio de contraseña
- [ ] Gestión de plan/suscripción
- [ ] Datos de facturación

---

## Estructura de Datos (Firestore)

```
users/
├── {userId}/
│   ├── uid, email, displayName, photoURL
│   ├── subscriptionStatus: 'trial' | 'active' | 'cancelled'
│   ├── trialEndsAt: Timestamp
│   ├── theme: 'light' | 'dark' | 'system'
│   ├── lastLoginAt: Timestamp
│   │
│   ├── customers/
│   │   └── {customerId}/
│   │       ├── name: string
│   │       ├── email: string
│   │       ├── subscriptions: number (counter)
│   │       ├── totalValue: number (MRR)
│   │       └── createdAt: Timestamp
│   │
│   └── subscriptions/
│       └── {subscriptionId}/
│           ├── customerId: string
│           ├── plan: string
│           ├── price: number
│           ├── billingCycle: 'monthly' | 'yearly'
│           ├── status: 'authorized' | 'paused' | 'cancelled' | 'pending'
│           ├── nextPayment: Timestamp
│           ├── lastPayment: Timestamp
│           ├── createdAt: Timestamp
│           │
│           └── payments/
│               └── {paymentId}/
│                   └── date: Timestamp
```

---

## API Routes

| Endpoint | Método | Estado | Notas |
|----------|--------|--------|-------|
| `/api/subscriptions/create-preapproval` | POST | PLACEHOLDER | Retorna URL ficticia, sin MercadoPago real |
| `/api/user/kpis` | GET | PLACEHOLDER | Retorna datos hardcodeados |
| `/api/user/subscriptions` | GET | PLACEHOLDER | Retorna mock data |

**Problema crítico:** Las 3 rutas API carecen de autenticación, autorización y datos reales. El frontend usa Firestore directamente desde el cliente, bypassing las APIs.

---

## Componentes Custom (19 total)

| Componente | Estado | Notas |
|-----------|--------|-------|
| app-shell | Completo | Redirección auth, layout principal |
| app-sidebar | Completo | Navegación, logout, idioma |
| auth-provider | Completo | Context con triple fallback |
| dashboard-filters | Parcial | Strings hardcodeados (no usa i18n) |
| edit-subscription-dialog | Completo | Cálculo MRR automático |
| empty-state | Completo | Componente genérico |
| error-boundary | Completo | Class component con detalles |
| google-login-button | Completo | Detección browsers in-app |
| kpi-card | Completo | Valor + trend |
| language-switch | Completo | ES/EN con banderas |
| new-customer-dialog | Completo | Validación + Title Case |
| new-subscription-dialog | Completo | Dual mode (existente/nuevo) |
| revenue-chart | Completo | Line/Bar según data points |
| status-badge | Completo | 4 estados con colores |
| theme-preference-sync | Completo | Sync bidireccional Firestore |
| theme-provider | Completo | Wrapper next-themes |
| theme-switch | Completo | Switch light/dark |
| theme-toggle | Completo | Dropdown con system |
| trial-banner | Parcial | Console.logs sin limpiar |

---

## i18n - Cobertura

- **Idiomas:** Español (es), Inglés (en)
- **Keys totales:** 132 por idioma
- **Paridad:** 100% (mismas keys en ambos)
- **Secciones:** common, navigation, theme, auth, dashboard, subscriptions, customers, settings, pricing
- **Pendiente:** ~15-20 keys de filtros del dashboard y KPIs hardcodeados

---

## Bugs y Deuda Técnica Conocida

1. `trial-banner.tsx` - Console.log() de debugging sin limpiar
2. `use-toast.ts` - TOAST_REMOVE_DELAY = 1,000,000ms (debería ser ~1000ms)
3. `dashboard-filters.tsx` - Strings hardcodeados en lugar de usar i18n
4. APIs retornando datos mock en lugar de datos reales
5. Sin Firestore security rules documentadas/desplegadas
6. Google OAuth no configurado en producción (.env.production falta CLIENT_ID)
7. Campos de trial inconsistentes en Firestore (trialEndsAt vs trialEndAt vs trialsEndsAt)
