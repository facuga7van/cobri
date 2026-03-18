# Cobri Audit Improvements - Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all security vulnerabilities, code quality issues, and DX gaps found in the March 2026 audit.

**Architecture:** Three phases ordered by impact: (A) Security fixes for webhook, env validation, and error sanitization; (B) Code quality — i18n completion, component refactoring, loading states; (C) DX — pin dependencies, add testing framework, npm scripts.

**Tech Stack:** Next.js 14, Firebase Admin SDK, MercadoPago SDK 2.12, Zod, Vitest, next-intl.

---

## Chunk 1: Security Fixes (Phase A)

### Task 1: Webhook Signature Verification

MercadoPago sends an `x-signature` header with HMAC-SHA256. We must verify it before processing any event.

**Files:**
- Modify: `app/api/webhooks/mercadopago/route.ts`
- Create: `lib/webhook-verify.ts`

- [ ] **Step 1: Create `lib/webhook-verify.ts`**

```typescript
import { createHmac } from "crypto"

/**
 * Verifies MercadoPago webhook signature.
 * @see https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 */
export function verifyMercadoPagoSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string,
  webhookSecret: string
): boolean {
  if (!xSignature || !xRequestId || !webhookSecret) return false

  // Parse x-signature header: "ts=...,v1=..."
  const parts: Record<string, string> = {}
  xSignature.split(",").forEach((part) => {
    const [key, value] = part.split("=", 2)
    if (key && value) parts[key.trim()] = value.trim()
  })

  const ts = parts["ts"]
  const v1 = parts["v1"]
  if (!ts || !v1) return false

  // Build the manifest string
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`

  // HMAC-SHA256
  const hmac = createHmac("sha256", webhookSecret)
  hmac.update(manifest)
  const generatedHash = hmac.digest("hex")

  return generatedHash === v1
}
```

- [ ] **Step 2: Add `MP_WEBHOOK_SECRET` to env validation**

In `lib/mercadopago.ts`, add a check:

```typescript
import { MercadoPagoConfig, PreApproval } from "mercadopago"

const accessToken = process.env.MP_ACCESS_TOKEN

if (!accessToken) {
  console.warn("MP_ACCESS_TOKEN not set - MercadoPago integration will fail")
}

const client = new MercadoPagoConfig({
  accessToken: accessToken ?? "",
})

export const preApproval = new PreApproval(client)
export const mpWebhookSecret = process.env.MP_WEBHOOK_SECRET ?? ""
export { client }
```

- [ ] **Step 3: Integrate signature verification into webhook handler**

At the top of `POST` function in `app/api/webhooks/mercadopago/route.ts`, add imports:

```typescript
import { verifyMercadoPagoSignature } from "@/lib/webhook-verify"
import { mpWebhookSecret } from "@/lib/mercadopago"
```

Inside `POST`, right after parsing the body (after line 18), add signature verification. Per MP docs, `data.id` should be extracted from query params (URL) as primary source:

```typescript
// Verify webhook signature
const xSignature = request.headers.get("x-signature")
const xRequestId = request.headers.get("x-request-id")
const url = new URL(request.url)
const dataId = url.searchParams.get("data.id") ?? body?.data?.id?.toString() ?? ""

if (mpWebhookSecret) {
  if (!verifyMercadoPagoSignature(xSignature, xRequestId, dataId, mpWebhookSecret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
  }
} else {
  console.warn("MP_WEBHOOK_SECRET not set — webhook signature verification is DISABLED")
}
```

- [ ] **Step 4: Add `MP_WEBHOOK_SECRET` to `environment.example.txt`**

Add at the end of the file:
```
# MercadoPago Webhook Secret (from MP Dashboard > Webhooks)
MP_WEBHOOK_SECRET=your_webhook_secret_here
```

- [ ] **Step 5: Commit**

```bash
git add lib/webhook-verify.ts lib/mercadopago.ts app/api/webhooks/mercadopago/route.ts environment.example.txt
git commit -m "feat: add MercadoPago webhook signature verification"
```

---

### Task 2: Webhook Idempotency

Prevent duplicate payment records when MercadoPago retries the same event.

**Files:**
- Modify: `app/api/webhooks/mercadopago/route.ts`

- [ ] **Step 1: Add idempotency via deterministic document ID**

In the `authorized` block (around line 97), replace `await subRef.collection("payments").add({...})` with a `set` using the MP ID as document ID. This gives Firestore-level idempotency — duplicate writes are harmless no-ops:

```typescript
// Use mercadopagoId as document ID for built-in idempotency
await subRef.collection("payments").doc(data.id).set({
  date: now,
  amount: subData.price ?? 0,
  source: "mercadopago",
  mercadopagoId: data.id,
}, { merge: true })
```

Also add an early return at the top of the handler (after `subSnap` is fetched, around line 50) to skip redundant processing when the status hasn't changed:

```typescript
const currentData = subSnap.data()!
if (currentData.mercadopagoId === data.id && currentData.mercadopagoStatus === mpStatus) {
  // Already processed this exact state — skip
  return NextResponse.json({ received: true, status: currentData.status })
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/webhooks/mercadopago/route.ts
git commit -m "fix: add idempotency check to webhook payment creation"
```

---

### Task 3: Sanitize Error Responses

Prevent MercadoPago SDK internal errors from leaking to clients.

**Files:**
- Modify: `app/api/subscriptions/create-preapproval/route.ts`

- [ ] **Step 1: Replace error leakage in catch block**

Change line 80-85 from:
```typescript
} catch (error: any) {
    console.error("Error in POST /api/subscriptions/create-preapproval:", error)
    return NextResponse.json(
      { error: error?.message ?? "Internal server error" },
      { status: 500 }
    )
  }
```

To:
```typescript
  } catch (error) {
    console.error("Error in POST /api/subscriptions/create-preapproval:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
```

- [ ] **Step 2: Commit**

```bash
git add app/api/subscriptions/create-preapproval/route.ts
git commit -m "fix: sanitize error responses to prevent info leakage"
```

---

### Task 4: Fix Env Validation

Server-side env validation silently returns empty strings. Make it fail fast.

**Files:**
- Modify: `lib/env.ts`

- [ ] **Step 1: Rewrite `lib/env.ts`**

Replace the entire file with:

```typescript
import { z } from 'zod'

const clientEnvSchema = z.object({
  NEXT_PUBLIC_FIREBASE_API_KEY: z.string().min(1, 'Firebase API Key is required'),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: z.string().min(1, 'Firebase Auth Domain is required'),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: z.string().min(1, 'Firebase Project ID is required'),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: z.string().min(1, 'Firebase Storage Bucket is required'),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1, 'Firebase Messaging Sender ID is required'),
  NEXT_PUBLIC_FIREBASE_APP_ID: z.string().min(1, 'Firebase App ID is required'),
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: z.string().optional(),
})

export type Env = z.infer<typeof clientEnvSchema>

function validateEnv(): Env {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  })

  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors
    console.error('Invalid environment variables:', errors)
    throw new Error(`Missing environment variables: ${Object.keys(errors).join(', ')}`)
  }

  return parsed.data
}

export const env = validateEnv()
export const isProd = process.env.NODE_ENV === 'production'
export const isDev = process.env.NODE_ENV === 'development'
```

**Note:** This removes the `typeof window === 'undefined'` bypass. Since these are `NEXT_PUBLIC_*` variables, Next.js inlines them at build time on both client and server. Ensure CI/CD build environments have all `NEXT_PUBLIC_*` variables set, since validation now runs at import time everywhere.

- [ ] **Step 2: Commit**

```bash
git add lib/env.ts
git commit -m "fix: env validation now fails fast on missing variables"
```

---

### Task 5: Remove localhost Fallback

**Files:**
- Modify: `app/api/subscriptions/create-preapproval/route.ts:44`

- [ ] **Step 1: Replace fallback logic**

Change line 44 from:
```typescript
const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
```

To:
```typescript
const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL
if (!origin) {
  console.error("NEXT_PUBLIC_APP_URL is not configured")
  return NextResponse.json(
    { error: "Server configuration error" },
    { status: 500 }
  )
}
```

- [ ] **Step 2: Add `NEXT_PUBLIC_APP_URL` to `environment.example.txt`**

```
# App URL (required for payment redirects)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

- [ ] **Step 3: Commit**

```bash
git add app/api/subscriptions/create-preapproval/route.ts environment.example.txt
git commit -m "fix: remove localhost fallback, require NEXT_PUBLIC_APP_URL"
```

---

## Chunk 2: Code Quality (Phase B)

### Task 6: Complete i18n — Hardcoded Strings

**Files:**
- Modify: `components/error-boundary.tsx`
- Modify: `components/trial-banner.tsx`
- Modify: `components/theme-toggle.tsx`
- Modify: `messages/es.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add missing i18n keys to `messages/es.json`**

Add a `"trial"` namespace (new top-level key). Also replace the existing `"theme"` keys (`darkMode`, `lightMode`, `systemMode`, `themeDescription`) with the new keys used by the updated component. Verify no other component uses the old theme keys first (`grep -r "theme\.\(darkMode\|lightMode\|systemMode\)" components/`).

Add to `es.json`:
```json
"theme": {
  "light": "Claro",
  "dark": "Oscuro",
  "system": "Sistema",
  "toggleTheme": "Cambiar tema"
},
"trial": {
  "active": "Trial activo:",
  "daysRemaining": "{daysLeft} días restantes de tu prueba gratis",
  "close": "Cerrar"
}
```

- [ ] **Step 2: Add the same keys to `messages/en.json`**

Replace `"theme"` and add `"trial"`:
```json
"theme": {
  "light": "Light",
  "dark": "Dark",
  "system": "System",
  "toggleTheme": "Toggle theme"
},
"trial": {
  "active": "Active trial:",
  "daysRemaining": "{daysLeft} days remaining on your free trial",
  "close": "Close"
}
```

- [ ] **Step 3: Update `theme-toggle.tsx` to use i18n**

Replace hardcoded strings with `useTranslations('theme')`:

```typescript
"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { setTheme } = useTheme()
  const t = useTranslations('theme')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">{t('toggleTheme')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          {t('light')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          {t('dark')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          {t('system')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

- [ ] **Step 4: Update `trial-banner.tsx` line 92 to use i18n**

Note: `TrialBanner` is a client component. It does NOT currently import `useTranslations`. Add:

```typescript
import { useTranslations } from "next-intl"
```

Inside the component:
```typescript
const t = useTranslations('trial')
```

Replace the content `<div>` block (lines 91-93) from:
```tsx
<div className="text-sm flex-1">
  <span className="font-medium">Trial activo:</span> {daysLeft} días restantes de tu prueba gratis
</div>
```

To:
```tsx
<div className="text-sm flex-1">
  <span className="font-medium">{t('active')}</span> {t('daysRemaining', { daysLeft })}
</div>
```

Replace `aria-label="Cerrar"` on line 95 with:
```tsx
aria-label={t('close')}
```

- [ ] **Step 5: Note on `error-boundary.tsx`**

`ErrorBoundary` is a **class component** — it cannot use hooks (`useTranslations`). The hardcoded Spanish strings ("Algo salió mal", etc.) stay as-is for now. This is an acceptable trade-off because error boundaries are rarely seen and the app's primary language is Spanish. To fix properly would require wrapping in a function component that passes translations as props — defer to Phase C if desired.

- [ ] **Step 6: Update Calendar loading fallbacks**

In `new-subscription-dialog.tsx` line 32 and `edit-subscription-dialog.tsx` line 19, the lazy-load fallback text is hardcoded. These are also outside the i18n context (dynamic import callback). Leave as-is — it's a loading spinner context, not user-facing copy.

- [ ] **Step 7: Commit**

```bash
git add messages/es.json messages/en.json components/theme-toggle.tsx components/trial-banner.tsx
git commit -m "feat: complete i18n for theme-toggle and trial-banner"
```

---

### Task 7: Extract `toTitleCase` Utility

Duplicated in `new-subscription-dialog.tsx:122` and `new-customer-dialog.tsx:27`.

**Files:**
- Create: `lib/string-utils.ts`
- Modify: `components/new-subscription-dialog.tsx`
- Modify: `components/new-customer-dialog.tsx`

- [ ] **Step 1: Create `lib/string-utils.ts`**

```typescript
/**
 * Converts a string to Title Case, normalizing whitespace.
 */
export function toTitleCase(s: string): string {
  return s
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
}
```

- [ ] **Step 2: Update `new-subscription-dialog.tsx`**

Remove inline `toTitleCase` definition (lines 122-129). Add import:
```typescript
import { toTitleCase } from "@/lib/string-utils"
```

- [ ] **Step 3: Update `new-customer-dialog.tsx`**

Remove the `useCallback` `toTitleCase` (lines 27-28). Add import:
```typescript
import { toTitleCase } from "@/lib/string-utils"
```

- [ ] **Step 4: Commit**

```bash
git add lib/string-utils.ts components/new-subscription-dialog.tsx components/new-customer-dialog.tsx
git commit -m "refactor: extract toTitleCase to shared utility"
```

---

### Task 8: Remove Duplicate Route Re-exports

The routes `/[locale]/customers`, `/[locale]/subscriptions`, `/[locale]/settings` are re-exports of `/[locale]/app/*`. This is confusing and doubles the route surface.

**Precondition:** These files may have already been removed. Run `ls app/[locale]/customers/page.tsx 2>/dev/null` first. **If the files do not exist, skip this entire task.**

**Files:**
- Delete: `app/[locale]/customers/page.tsx`
- Delete: `app/[locale]/customers/[id]/page.tsx`
- Delete: `app/[locale]/subscriptions/page.tsx`
- Delete: `app/[locale]/subscriptions/[id]/page.tsx`
- Delete: `app/[locale]/settings/page.tsx`

- [ ] **Step 1: Check if files exist**

```bash
ls app/[locale]/customers/page.tsx app/[locale]/subscriptions/page.tsx app/[locale]/settings/page.tsx 2>/dev/null
```

If no output, skip to Task 9.

- [ ] **Step 2: Verify no internal links point to the short routes**

Search the codebase for href patterns like `/customers`, `/subscriptions`, `/settings` (without `/app/` prefix). If any exist, update them to use `/app/customers`, etc.

Run: `grep -r "\/customers\|\/subscriptions\|\/settings" --include="*.tsx" --include="*.ts" app/ components/ | grep -v "/app/customers\|/app/subscriptions\|/app/settings\|node_modules"`

- [ ] **Step 3: Delete the re-export files**

```bash
rm app/[locale]/customers/page.tsx
rm app/[locale]/customers/[id]/page.tsx
rm app/[locale]/subscriptions/page.tsx
rm app/[locale]/subscriptions/[id]/page.tsx
rm app/[locale]/settings/page.tsx
```

Also remove empty directories if any remain.

- [ ] **Step 4: Commit**

```bash
git add -A app/[locale]/customers app/[locale]/subscriptions app/[locale]/settings
git commit -m "refactor: remove duplicate route re-exports, canonical routes are under /app/"
```

---

## Chunk 3: DX & Dependencies (Phase C)

### Task 9: Pin Floating Dependencies

Three deps use `"latest"` which makes builds non-reproducible.

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Check current installed versions**

Run:
```bash
npm ls @tabler/icons-react @vercel/analytics recharts --depth=0
```

- [ ] **Step 2: Pin to the currently installed versions in `package.json`**

Replace:
```json
"@tabler/icons-react": "latest",
"@vercel/analytics": "latest",
"recharts": "latest",
```

With the actual installed versions (e.g.):
```json
"@tabler/icons-react": "^3.35.0",
"@vercel/analytics": "^1.5.0",
"recharts": "^2.15.0",
```

(Use the exact versions from `npm ls` output.)

- [ ] **Step 3: Remove unused animation library**

The project uses `tw-animate-css` (imported in `app/globals.css` via `@import "tw-animate-css"`). Remove `tailwindcss-animate` from `dependencies` in `package.json`. Keep `tw-animate-css` in `devDependencies`.

Verify first:
```bash
grep -r "tailwindcss-animate\|tw-animate-css" --include="*.css" --include="*.ts" --include="*.mjs" app/ components/
```

- [ ] **Step 4: Run `npm install` to update lockfile**

```bash
npm install
```

This updates `package-lock.json` to reflect the pinned versions and removed dependency.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: pin floating dependencies, remove unused animation lib"
```

---

### Task 10: Add NPM Scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add `type-check` script**

In `package.json` scripts, add:
```json
"scripts": {
  "build": "next build",
  "dev": "next dev",
  "lint": "next lint",
  "start": "next start",
  "type-check": "tsc --noEmit"
}
```

- [ ] **Step 2: Remove `allowJs` from `tsconfig.json`**

Remove `"allowJs": true` from the compilerOptions (the project is pure TypeScript).

- [ ] **Step 3: Verify type-check passes**

Run: `npx tsc --noEmit`

If any `.js` files in the include scope cause errors, revert the `allowJs` removal and keep it.

- [ ] **Step 4: Commit**

```bash
git add package.json tsconfig.json
git commit -m "chore: add type-check script, remove unnecessary allowJs"
```

---

### Task 11: Update `environment.example.txt`

The template is missing MercadoPago and Google OAuth variables added in later phases.

**Files:**
- Modify: `environment.example.txt`

- [ ] **Step 1: Add missing variables (only those NOT already added by Tasks 1 and 5)**

Check which variables already exist in the file. Only add variables not yet present. Tasks 1 and 5 already added `MP_WEBHOOK_SECRET` and `NEXT_PUBLIC_APP_URL`. Append only the remaining:

```
# Google OAuth (for Google Sign-In button)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# MercadoPago (access keys from MP Dashboard > Credentials)
NEXT_PUBLIC_MP_PUBLIC_KEY=TEST-your-mp-public-key
MP_ACCESS_TOKEN=TEST-your-mp-access-token
```

- [ ] **Step 2: Commit**

```bash
git add environment.example.txt
git commit -m "docs: add missing env vars to environment example"
```

---

## Summary — Task Dependency Graph

```
Phase A (Security) — do first, in order:
  Task 1 (webhook signature) → Task 2 (idempotency) → Task 3 (error sanitization) → Task 4 (env validation) → Task 5 (localhost fallback)

Phase B (Code Quality) — independent of each other:
  Task 6 (i18n) | Task 7 (toTitleCase) | Task 8 (route cleanup)

Phase C (DX) — independent of each other:
  Task 9 (pin deps) | Task 10 (npm scripts) | Task 11 (env example)
```

Phase A tasks are sequential (each builds on the previous webhook file changes). Phases B and C tasks can run in parallel with subagents.
