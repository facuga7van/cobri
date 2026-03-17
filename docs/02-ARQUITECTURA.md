# Cobri - Arquitectura del Proyecto

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTE (Browser)                   │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────┐ │
│  │ Dashboard │  │ Customers│  │  Subs    │  │Settings │ │
│  │  (KPIs)  │  │  (CRUD)  │  │  (CRUD)  │  │(Profile)│ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬────┘ │
│       │              │              │              │      │
│  ┌────┴──────────────┴──────────────┴──────────────┴────┐│
│  │              Firebase SDK (Client-side)               ││
│  │  ┌─────────────┐  ┌──────────────────┐               ││
│  │  │  Auth        │  │  Firestore        │              ││
│  │  │  (login,     │  │  (queries,        │              ││
│  │  │   signup,    │  │   onSnapshot,     │              ││
│  │  │   google)    │  │   writes)         │              ││
│  │  └──────┬──────┘  └────────┬──────────┘              ││
│  └─────────┼──────────────────┼──────────────────────────┘│
└────────────┼──────────────────┼───────────────────────────┘
             │                  │
     ┌───────┴──────────────────┴───────┐
     │         FIREBASE CLOUD           │
     │  ┌─────────────┐ ┌────────────┐  │
     │  │  Auth        │ │  Firestore │  │
     │  │  Service     │ │  Database  │  │
     │  └─────────────┘ └────────────┘  │
     └──────────────────────────────────┘

┌───────────────────────────────────────┐
│   NEXT.JS API ROUTES (NO USADAS)      │
│   /api/subscriptions/create-preapproval│ ← STUB
│   /api/user/kpis                       │ ← MOCK
│   /api/user/subscriptions              │ ← MOCK
└───────────────────────────────────────┘
```

## Flujo de Datos

### Autenticación
```
Usuario → Sign In/Up → Firebase Auth → onAuthStateChanged
  → AuthProvider (Context) → AppShell (redirección) → Dashboard
  → Firestore: users/{uid} (merge profile data)
  → Trial: 15 días desde registro
```

### Lectura de Datos (Real-time)
```
Componente → onSnapshot(collection) → State update → Re-render
  - Clientes: users/{uid}/customers (orderBy createdAt desc)
  - Suscripciones: users/{uid}/subscriptions (orderBy createdAt desc)
```

### KPIs del Dashboard
```
Dashboard mount → calculateKPIs(userId, locale, filters)
  → Query Firestore: subscriptions + customers
  → Calcula: activeCount, MRR, newThisMonth, growth%, chartData
  → Retorna objeto KPIData → Renderiza cards + gráfico
```

### Escritura de Datos
```
Dialog (form) → Validación → addDoc/updateDoc Firestore
  → onSnapshot detecta cambio → UI se actualiza automáticamente
  → Counters sincronizados (increment/decrement en customer)
```

## Estructura de Carpetas

```
cobri/
├── app/
│   ├── layout.tsx                          # Root layout (fonts)
│   ├── api/
│   │   ├── subscriptions/
│   │   │   └── create-preapproval/route.ts # STUB
│   │   └── user/
│   │       ├── kpis/route.ts               # MOCK
│   │       └── subscriptions/route.ts      # MOCK
│   └── [locale]/
│       ├── layout.tsx                      # Providers (theme, intl, auth)
│       ├── page.tsx                        # → redirect to /app
│       ├── error.tsx                       # Error boundary
│       ├── global-error.tsx                # Critical error
│       ├── not-found.tsx                   # 404
│       ├── auth/
│       │   ├── sign-in/page.tsx
│       │   └── sign-up/page.tsx
│       ├── pricing/page.tsx
│       └── app/
│           ├── layout.tsx                  # Passthrough
│           ├── page.tsx                    # Dashboard
│           ├── customers/
│           │   ├── page.tsx                # Lista
│           │   └── [id]/page.tsx           # Detalle
│           ├── subscriptions/
│           │   ├── page.tsx                # Lista
│           │   └── [id]/page.tsx           # Detalle
│           └── settings/page.tsx
├── components/
│   ├── ui/                                 # shadcn/ui (50+ componentes)
│   ├── app-shell.tsx                       # Layout wrapper + auth guard
│   ├── app-sidebar.tsx                     # Sidebar navegación
│   ├── auth-provider.tsx                   # Context de autenticación
│   ├── dashboard-filters.tsx               # Filtros período/cliente
│   ├── edit-subscription-dialog.tsx        # Editar suscripción
│   ├── new-customer-dialog.tsx             # Crear cliente
│   ├── new-subscription-dialog.tsx         # Crear suscripción
│   ├── revenue-chart.tsx                   # Gráfico Recharts
│   ├── kpi-card.tsx                        # Card de métrica
│   ├── status-badge.tsx                    # Badge de estado
│   ├── google-login-button.tsx             # OAuth Google
│   ├── trial-banner.tsx                    # Banner trial
│   ├── theme-*.tsx                         # Theme management (4 archivos)
│   ├── language-switch.tsx                 # Selector idioma
│   ├── empty-state.tsx                     # Estado vacío genérico
│   └── error-boundary.tsx                  # Error boundary React
├── hooks/
│   ├── use-mobile.ts                       # Detección mobile
│   ├── use-toast.ts                        # Notificaciones
│   └── use-translations.ts                 # Re-export next-intl
├── lib/
│   ├── firebase.ts                         # Inicialización Firebase
│   ├── kpis.ts                             # calculateKPIs()
│   ├── mock-data.ts                        # Datos mock (10 subs, 6 customers)
│   ├── env.ts                              # Validación env vars (Zod)
│   └── utils.ts                            # cn() helper
├── messages/
│   ├── en.json                             # Traducciones inglés (132 keys)
│   └── es.json                             # Traducciones español (132 keys)
└── public/                                 # Assets estáticos
```

## Patrones de Diseño

- **Client-first:** Todas las operaciones Firebase desde el browser
- **Real-time:** onSnapshot para listas (clientes, suscripciones)
- **Lazy loading:** Dialogs y gráficos con `dynamic()` (SSR: false)
- **Context pattern:** AuthProvider para estado de auth global
- **Optimistic UI:** Actualizaciones inmediatas con rollback en error
- **Persistence:** Filtros en localStorage, tema en Firestore
