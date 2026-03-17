# Cobri - Auditoría de Seguridad

## Resumen

**Nivel de riesgo actual: ALTO** - El proyecto no está listo para producción desde el punto de vista de seguridad.

---

## Hallazgos Críticos

### 1. API Routes sin autenticación ni autorización

**Afectados:**
- `POST /api/subscriptions/create-preapproval`
- `GET /api/user/kpis`
- `GET /api/user/subscriptions`

**Riesgo:** Cualquier persona puede acceder a estos endpoints sin autenticación.

**Solución:** Verificar Firebase Auth token en cada request:
```typescript
import { getAuth } from 'firebase-admin/auth'

export async function GET(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const decoded = await getAuth().verifyIdToken(token)
  const userId = decoded.uid
  // ... usar userId para queries
}
```

### 2. Sin Firestore Security Rules

**Riesgo:** Sin reglas, el acceso por defecto puede permitir lectura/escritura no autorizada.

**Solución mínima:**
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

### 3. APIs retornan datos mock/hardcodeados

**Riesgo:** Si alguien depende de estas APIs, recibe datos falsos independientemente de la identidad.

### 4. Credenciales Firebase en cliente

**Riesgo:** BAJO - Las API keys de Firebase son públicas por diseño (la seguridad se implementa con Firestore Rules y Auth). Sin embargo, sin rules configuradas, el riesgo escala.

---

## Hallazgos Medios

| # | Hallazgo | Estado |
|---|----------|--------|
| 1 | Sin validación de entrada en API routes | No hay schemas Zod |
| 2 | Sin rate limiting | Vulnerable a abuso |
| 3 | Sin logging/auditoría | Imposible detectar ataques |
| 4 | Sin CSRF protection en forms | Next.js maneja parcialmente |
| 5 | Middleware solo maneja i18n, no auth | Rutas /app/ accesibles sin token válido |

---

## Hallazgos Bajos

| # | Hallazgo | Notas |
|---|----------|-------|
| 1 | `poweredByHeader: false` en next.config | Bien configurado |
| 2 | `removeConsole: true` en producción | Bien configurado |
| 3 | Google Client ID solo en .env.local | OAuth no disponible en producción |

---

## Plan de Remediación

1. **Inmediato:** Desplegar Firestore Security Rules
2. **Antes de producción:** Autenticar todas las API routes
3. **Antes de producción:** Agregar validación Zod en endpoints
4. **Post-MVP:** Rate limiting y logging
