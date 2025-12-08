# 📌 Mejoras y optimizaciones propuestas

## Prioridad Alta
- Autenticación: los enlaces de `sign-in`/`sign-up` omiten el `locale` (`app/[locale]/auth/sign-in/page.tsx`, `app/[locale]/auth/sign-up/page.tsx`). Ajustar rutas (`/${locale}/...`) para evitar saltos de idioma y 404.
- Suscripciones: en `app/[locale]/app/subscriptions/page.tsx` se formatean fechas a string y luego se vuelven a parsear en `handleMarkPaid`, lo que rompe con formatos locales. Guardar Date/Timestamp crudo en el estado y formatear solo al render.
- Configuración de entorno: `lib/env.ts` solo valida en cliente y retorna strings vacíos en servidor. Validar en build/servidor con un esquema compartido (p.ej. `@t3-oss/env-nextjs`) para fallar temprano si falta una variable.
- KPIs/Dashboard: cada cambio de filtro hace múltiples lecturas completas a Firestore (`calculateKPIs` + `getUpcomingCharges` + listado de clientes). Cachear resultados, usar listeners o queries paginadas y evitar reconsultar clientes en cada cálculo.
- Internacionalización: hay textos hardcodeados en español (`Nuevos este mes`, `Cargando gráfico...`, etiquetas de filtros/tablas). Llevarlos a `messages/*.json` y usar `useTranslations` para mantener paridad EN/ES.
- UX de acciones críticas: operaciones de Firestore (markPaid, pause/resume, delete) no muestran feedback ni manejan errores. Añadir toasts de éxito/error y deshabilitar botones mientras se escribe.

## Prioridad Media
- Guard de rutas: `AppShell` retorna `null` mientras `loading`. Mostrar skeleton/spinner o mover la lógica de protección al middleware para evitar pantallas en blanco y dobles renders.
- Tipado de layouts: `app/[locale]/layout.tsx` tipa `params` como `Promise`, debería ser `{ locale: string }` y opcionalmente usar `generateStaticParams` para locales soportados.
- Formularios: añadir validación con Zod + `@hookform/resolvers` en altas/ediciones (clientes, suscripciones, auth) y mensajes traducidos; hoy se confía en el DOM.
- Datos derivados: el `customerMap` en suscripciones no vuelve a pintar si cambia el snapshot de clientes después de suscripciones. Centralizar la obtención y recomputar filas cuando cambien clientes o usar un join en memoria consistente.
- Estados de carga y vacíos: unificar loaders y empty states en listados de clientes/suscripciones, incluyendo mensajes de error cuando fallen las lecturas de Firestore.
- Persistencia de tema: `ThemePreferenceSync` existe pero no se persiste en perfil. Guardar la preferencia en Firestore y aplicarla al montar sesión.

## Prioridad Baja / Roadmap
- API mocks: reemplazar endpoints stub (`app/api/...`) con integración real (MercadoPago, KPIs) y tests de contrato.
- Observabilidad: instrumentar eventos clave (login, cobros, cambios de estado) con analytics/logging y alarmas.
- Testing y CI: añadir Vitest + Testing Library, ejecutar `lint`/`tsc` en CI y cubrir cálculos de KPIs/lógica de billing.
- Build/DX: revisar `tsconfig` (`target` en ES2020+ y quitar `allowJs` si no se usa), añadir `eslint`/`prettier` compartido y scripts de formato.
- SEO/Accesibilidad: definir metadatos por página (og:image, title/description), añadir `aria-label` en icon buttons y manejo de foco en diálogos/menús.
- Firestore: documentar colecciones/índices y reforzar reglas (App Check, rate limiting, auditoría). Evitar `orderBy` sin índice y añadir pruebas de seguridad.
- Tailwind v4: validar que `globals.css` esté migrado al nuevo formato; si no, crear preset/tokens centrales y utilities compartidas.
- Lazy loading: seguir usando `dynamic` para Recharts/diálogos pero añadir `loading.tsx` y `Suspense` por ruta para mejorar TTI.
