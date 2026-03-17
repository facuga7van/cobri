# Cobri - Roadmap hacia MVP

> Priorizado por impacto en usuario final y viabilidad de lanzamiento.
> Auditoría base: 17 de marzo de 2026.

---

## Definición de MVP

Un MVP de Cobri permite a un usuario:
1. Registrarse y autenticarse de forma segura
2. Gestionar clientes y suscripciones con datos reales
3. Visualizar métricas de su negocio
4. Recibir cobros automáticos vía MercadoPago
5. Operar en español e inglés

---

## Fase 0: Limpieza y Bugs Críticos (1-2 días)

> Deuda técnica que bloquea o degrada la experiencia actual.

| # | Tarea | Archivo(s) | Esfuerzo |
|---|-------|-----------|----------|
| 0.1 | Limpiar console.log() de debugging | `components/trial-banner.tsx` | 5 min |
| 0.2 | Corregir TOAST_REMOVE_DELAY (1M ms → 1000ms) | `hooks/use-toast.ts` | 5 min |
| 0.3 | Unificar campo trial en Firestore (trialEndsAt) | `components/trial-banner.tsx`, `auth/sign-up`, `google-login-button.tsx` | 30 min |
| 0.4 | Agregar GOOGLE_CLIENT_ID a .env.production | `.env.production` | 5 min |
| 0.5 | Mover strings hardcodeados de dashboard-filters a i18n | `components/dashboard-filters.tsx`, `messages/*.json` | 1h |
| 0.6 | Agregar ~15 keys faltantes de KPIs/filtros a messages | `messages/en.json`, `messages/es.json` | 30 min |

---

## Fase 1: Seguridad (3-5 días)

> Sin esto, el proyecto NO puede ir a producción.

| # | Tarea | Detalle | Esfuerzo |
|---|-------|---------|----------|
| 1.1 | Crear y desplegar Firestore Security Rules | Reglas que validen `request.auth.uid == userId` en todas las colecciones | 2h |
| 1.2 | Agregar autenticación a API routes | Verificar Firebase Auth token en cada endpoint | 3h |
| 1.3 | Agregar validación de entrada (Zod) en APIs | Schemas para request body/params | 2h |
| 1.4 | Agregar error handling en APIs | try-catch, mensajes genéricos, logging | 2h |
| 1.5 | Auditar y asegurar que las credenciales Firebase expuestas son seguras | Verificar que Firestore rules + Auth rules restrinjan acceso | 1h |

---

## Fase 2: Backend Real (1-2 semanas)

> Reemplazar mocks por funcionalidad real.

| # | Tarea | Detalle | Esfuerzo |
|---|-------|---------|----------|
| 2.1 | Conectar `/api/user/kpis` con `calculateKPIs()` | Usar la función que ya existe en `lib/kpis.ts` | 2h |
| 2.2 | Conectar `/api/user/subscriptions` con Firestore | Query real con filtros, paginación básica | 3h |
| 2.3 | Integrar SDK de MercadoPago | Instalar SDK, configurar credenciales, crear preapproval real | 1-2 días |
| 2.4 | Crear webhook handler para pagos MercadoPago | `POST /api/webhooks/mercadopago` - actualizar estado de suscripción | 1 día |
| 2.5 | Implementar flujo completo de cobro | Crear preapproval → redirect → callback → actualizar status | 2 días |
| 2.6 | Eliminar mock data | Borrar `lib/mock-data.ts` y todas las referencias | 30 min |

---

## Fase 3: Funcionalidades MVP Faltantes (1-2 semanas)

> Features que un usuario espera en un producto de gestión de suscripciones.

| # | Tarea | Detalle | Esfuerzo |
|---|-------|---------|----------|
| 3.1 | Completar Settings: edición de perfil | Cambiar nombre, email | 3h |
| 3.2 | Completar Settings: cambio de contraseña | Con Firebase Auth updatePassword | 2h |
| 3.3 | Agregar recuperación de contraseña | Flujo sendPasswordResetEmail | 3h |
| 3.4 | Editar cliente | Dialog similar a edit-subscription | 2h |
| 3.5 | Eliminar cliente (con confirmación) | Cascade: verificar suscripciones activas | 2h |
| 3.6 | Historial de pagos por suscripción | Tabla con payments subcolección | 3h |
| 3.7 | Gestión de plan del usuario (trial → pro) | Integrar con pricing page + MercadoPago | 1 día |
| 3.8 | Bloqueo de features post-trial | Limitar acceso cuando trial expire sin pago | 3h |

---

## Fase 4: Polish y Producción (1 semana)

> Preparar para lanzamiento real.

| # | Tarea | Detalle | Esfuerzo |
|---|-------|---------|----------|
| 4.1 | Landing page pública | Home con propuesta de valor, CTA, features | 1 día |
| 4.2 | SEO básico | Meta tags, OG tags, sitemap | 2h |
| 4.3 | Configurar Vercel Analytics | Ya instalado, verificar tracking | 1h |
| 4.4 | Tests E2E para flujos críticos | Auth, crear suscripción, cobrar | 2 días |
| 4.5 | Configurar CI/CD | GitHub Actions: lint, build, deploy | 3h |
| 4.6 | Documentar API para desarrolladores | OpenAPI/Swagger básico | 3h |
| 4.7 | Review de performance | Lighthouse, bundle analysis, lazy loading | 3h |
| 4.8 | Legal: Términos de servicio y privacidad | Páginas estáticas | 2h |

---

## Resumen de Fases

```
Fase 0: Limpieza          ██░░░░░░░░░░░░░░░░░░  1-2 días
Fase 1: Seguridad         ████░░░░░░░░░░░░░░░░  3-5 días
Fase 2: Backend Real      ████████░░░░░░░░░░░░  1-2 semanas
Fase 3: Features MVP      ████████████░░░░░░░░  1-2 semanas
Fase 4: Polish/Producción ████████████████░░░░  1 semana
                                                ─────────
                                        Total:  5-7 semanas
```

---

## Dependencias Críticas

```
Fase 0 ──→ Fase 1 ──→ Fase 2 ──┐
                                ├──→ Fase 4
                    Fase 3 ─────┘
```

- **Fase 1 depende de Fase 0** (no tiene sentido asegurar APIs con bugs)
- **Fase 2 depende de Fase 1** (no integrar pagos sin seguridad)
- **Fase 3 puede ir en paralelo con Fase 2** (features independientes)
- **Fase 4 requiere Fases 2 y 3 completas**

---

## Post-MVP (Backlog)

Estas funcionalidades NO son necesarias para el MVP pero agregan valor:

| Categoría | Feature |
|-----------|---------|
| **Notificaciones** | Emails de cobro próximo, cobro exitoso, cobro fallido |
| **Reportes** | Exportar CSV/PDF de clientes y suscripciones |
| **Analytics** | Churn rate, LTV, cohort analysis |
| **Integraciones** | WhatsApp notifications, Stripe como alternativa |
| **Multi-moneda** | Soporte USD/EUR además de ARS |
| **Equipo** | Multi-usuario por cuenta, roles (admin/viewer) |
| **Mobile** | App nativa o PWA optimizada |
| **Automatización** | Recordatorios automáticos pre-cobro |
| **Onboarding** | Tour guiado para nuevos usuarios |
| **API pública** | REST API para integraciones de terceros |

---

## Métricas de Éxito del MVP

| Métrica | Target |
|---------|--------|
| Registro → primer cliente creado | < 3 minutos |
| Tiempo de carga del dashboard | < 2 segundos |
| Cobro exitoso end-to-end | Funcional |
| Uptime | 99.5%+ |
| Errores en producción | < 5/día |
| Idiomas soportados | 2 (ES/EN) |
