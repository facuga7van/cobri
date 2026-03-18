# Landing Page + SEO — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan.

**Goal:** Create a public landing page with value proposition and CTA, and add basic SEO (meta tags, OG tags).

**Architecture:** Replace the current root page redirect with a real landing page. Add metadata to the locale layout. Landing page is public (AppShell already allows unauthenticated access to pricing, we'll add landing too).

**Tech Stack:** Next.js 14, Tailwind CSS, shadcn/ui, next-intl.

---

### Task 1: i18n Keys for Landing Page

**Files:**
- Modify: `messages/es.json`, `messages/en.json`

- [ ] **Step 1: Add `"landing"` namespace to both files**

ES (`messages/es.json`):
```json
"landing": {
  "hero": "Gestioná tus suscripciones y cobros recurrentes",
  "heroSub": "Cobri te ayuda a trackear clientes, automatizar cobros con MercadoPago y ver cuánto facturás en tiempo real.",
  "cta": "Empezar gratis",
  "ctaSignIn": "Ya tengo cuenta",
  "feature1Title": "Clientes organizados",
  "feature1Desc": "Agregá, editá y organizá tu base de clientes en un solo lugar.",
  "feature2Title": "Cobros automáticos",
  "feature2Desc": "Integrá MercadoPago y cobrá automáticamente cada mes.",
  "feature3Title": "Dashboard en tiempo real",
  "feature3Desc": "Visualizá ingresos, suscripciones activas y métricas de tu negocio.",
  "feature4Title": "Historial completo",
  "feature4Desc": "Consultá el historial de pagos de cada cliente y suscripción.",
  "footerText": "Cobri — Gestión de suscripciones recurrentes"
}
```

EN (`messages/en.json`):
```json
"landing": {
  "hero": "Manage your subscriptions and recurring payments",
  "heroSub": "Cobri helps you track clients, automate payments with MercadoPago, and see your revenue in real time.",
  "cta": "Start for free",
  "ctaSignIn": "I already have an account",
  "feature1Title": "Organized clients",
  "feature1Desc": "Add, edit, and organize your client base in one place.",
  "feature2Title": "Automatic payments",
  "feature2Desc": "Integrate MercadoPago and collect payments automatically every month.",
  "feature3Title": "Real-time dashboard",
  "feature3Desc": "Visualize revenue, active subscriptions, and business metrics.",
  "feature4Title": "Complete history",
  "feature4Desc": "Check payment history for each client and subscription.",
  "footerText": "Cobri — Recurring subscription management"
}
```

- [ ] **Step 2: Commit**

```bash
git add messages/es.json messages/en.json
git commit -m "feat: add i18n keys for landing page"
```

---

### Task 2: Create Landing Page

**Files:**
- Modify: `app/[locale]/page.tsx`
- Modify: `components/app-shell.tsx`

- [ ] **Step 1: Update AppShell to allow landing page**

Read `components/app-shell.tsx`. The current logic redirects unauthenticated users to `/pricing`. We need to also allow the root page (`/${locale}`).

Find the line:
```typescript
const isPricing = pathname === `/${locale}/pricing`
```

Change to:
```typescript
const isPricing = pathname === `/${locale}/pricing`
const isLanding = pathname === `/${locale}`
```

Update the unauthenticated redirect check from:
```typescript
if (!loading && !user && !isPricing && !isAuthRoute) {
```
To:
```typescript
if (!loading && !user && !isPricing && !isAuthRoute && !isLanding) {
```

Update the render check from:
```typescript
if (isPricing || isAuthRoute) return <>{children}</>
```
To:
```typescript
if (isPricing || isAuthRoute || isLanding) return <>{children}</>
```

Add `isLanding` to the first useEffect dependency array.

- [ ] **Step 2: Replace root page with landing page**

The current `app/[locale]/page.tsx` just re-exports `./app/page` (the dashboard). Replace its entire content with a proper landing page:

```typescript
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { IconUsers, IconCreditCard, IconChartBar, IconHistory } from "@tabler/icons-react"
import { useTranslations, useLocale } from "next-intl"

export default function LandingPage() {
  const t = useTranslations('landing')
  const tAuth = useTranslations('auth')
  const locale = useLocale()

  const features = [
    { icon: IconUsers, title: t('feature1Title'), desc: t('feature1Desc') },
    { icon: IconCreditCard, title: t('feature2Title'), desc: t('feature2Desc') },
    { icon: IconChartBar, title: t('feature3Title'), desc: t('feature3Desc') },
    { icon: IconHistory, title: t('feature4Title'), desc: t('feature4Desc') },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-bold">Cobri</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href={`/${locale}/auth/sign-in`}>
              <Button variant="ghost" size="sm">{tAuth('signIn')}</Button>
            </Link>
            <Link href={`/${locale}/auth/sign-up`}>
              <Button size="sm">{t('cta')}</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 max-w-3xl mx-auto leading-tight">
          {t('hero')}
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t('heroSub')}
        </p>
        <div className="flex gap-4 justify-center">
          <Link href={`/${locale}/auth/sign-up`}>
            <Button size="lg">{t('cta')}</Button>
          </Link>
          <Link href={`/${locale}/auth/sign-in`}>
            <Button variant="outline" size="lg">{t('ctaSignIn')}</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <Card key={i} className="p-6 text-center">
              <f.icon className="h-10 w-10 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>{t('footerText')}</p>
      </footer>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/[locale]/page.tsx components/app-shell.tsx
git commit -m "feat: add public landing page with hero, features, and CTA"
```

---

### Task 3: Add SEO Metadata

**Files:**
- Modify: `app/layout.tsx`

- [ ] **Step 1: Update root metadata**

Read `app/layout.tsx`. Replace the current metadata with more complete SEO:

```typescript
export const metadata: Metadata = {
  title: {
    default: "Cobri — Gestión de suscripciones recurrentes",
    template: "%s | Cobri",
  },
  description: "Cobri te ayuda a gestionar suscripciones, automatizar cobros con MercadoPago y visualizar ingresos en tiempo real.",
  keywords: ["suscripciones", "cobros recurrentes", "MercadoPago", "gestión de clientes", "SaaS", "facturación"],
  authors: [{ name: "Cobri" }],
  openGraph: {
    title: "Cobri — Gestión de suscripciones recurrentes",
    description: "Gestioná suscripciones, automatizá cobros con MercadoPago y visualizá tus ingresos en tiempo real.",
    type: "website",
    locale: "es_AR",
    siteName: "Cobri",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cobri — Gestión de suscripciones recurrentes",
    description: "Gestioná suscripciones, automatizá cobros con MercadoPago y visualizá tus ingresos en tiempo real.",
  },
  robots: {
    index: true,
    follow: true,
  },
}
```

Also remove the `generator: "v0.app"` line.

- [ ] **Step 2: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: add SEO metadata with OpenGraph and Twitter cards"
```

---

## Task Dependency Graph

```
Task 1 (i18n) → Task 2 (landing page)
Task 3 (SEO) — independent, can run in parallel with Task 2
```
