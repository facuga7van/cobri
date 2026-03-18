# Monetización Cobri — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan.

**Goal:** Enable trial expiration enforcement and Pro plan subscription via MercadoPago.

**Architecture:** Trial utils for status checks → upgrade page with MP checkout → app-shell blocking → webhook handling for platform subs → settings plan display.

**Tech Stack:** Next.js 14, Firebase Auth/Firestore, MercadoPago SDK, next-intl.

---

### Task 1: i18n Keys + Trial Utils

**Files:**
- Modify: `messages/es.json`, `messages/en.json`
- Create: `lib/trial-utils.ts`

- [ ] **Step 1: Add i18n keys to both message files**

Add new `"upgrade"` namespace to `messages/es.json`:
```json
"upgrade": {
  "title": "Actualizá a Pro",
  "subtitle": "Tu prueba gratuita expiró. Suscribite para seguir usando Cobri.",
  "trialExpired": "Prueba expirada",
  "subscribePro": "Suscribirse a Pro",
  "priceLabel": "$5/mes",
  "subscribing": "Redirigiendo a MercadoPago...",
  "errorSubscribing": "Error al crear la suscripción",
  "currentPlan": "Plan actual",
  "trialDaysLeft": "Trial ({days} días restantes)",
  "trialExpiredLabel": "Trial expirado",
  "proPlan": "Pro",
  "upgradeNow": "Actualizar ahora"
}
```

Same in English for `messages/en.json`:
```json
"upgrade": {
  "title": "Upgrade to Pro",
  "subtitle": "Your free trial has expired. Subscribe to continue using Cobri.",
  "trialExpired": "Trial expired",
  "subscribePro": "Subscribe to Pro",
  "priceLabel": "$5/month",
  "subscribing": "Redirecting to MercadoPago...",
  "errorSubscribing": "Error creating subscription",
  "currentPlan": "Current plan",
  "trialDaysLeft": "Trial ({days} days remaining)",
  "trialExpiredLabel": "Trial expired",
  "proPlan": "Pro",
  "upgradeNow": "Upgrade now"
}
```

- [ ] **Step 2: Create `lib/trial-utils.ts`**

```typescript
/**
 * Parses a Firestore date field into a Date object.
 */
function parseDate(input: any): Date | null {
  if (!input) return null
  if (typeof input?.toDate === "function") return input.toDate()
  if (typeof input?.seconds === "number") return new Date(input.seconds * 1000)
  const d = new Date(input)
  return isNaN(d.getTime()) ? null : d
}

/**
 * Returns true if the user's trial has expired.
 */
export function isTrialExpired(status: string | null, trialEndsAt: any): boolean {
  if (status !== "trial") return false
  const end = parseDate(trialEndsAt)
  if (!end) return false
  return end.getTime() < Date.now()
}

/**
 * Returns true if the user has an active paid subscription.
 */
export function isPaidUser(status: string | null): boolean {
  return status === "authorized"
}

/**
 * Returns days remaining in trial, or 0 if expired/not in trial.
 */
export function trialDaysLeft(status: string | null, trialEndsAt: any): number {
  if (status !== "trial") return 0
  const end = parseDate(trialEndsAt)
  if (!end) return 0
  const diff = end.getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
```

- [ ] **Step 3: Commit**

```bash
git add messages/es.json messages/en.json lib/trial-utils.ts
git commit -m "feat: add trial utilities and upgrade i18n keys"
```

---

### Task 2: Billing Subscribe Endpoint

**Files:**
- Create: `app/api/billing/subscribe/route.ts`

- [ ] **Step 1: Create the endpoint**

```typescript
import { NextResponse } from "next/server"
import { verifyAuth, isAuthError } from "@/lib/api-auth"
import { preApproval } from "@/lib/mercadopago"

export async function POST(request: Request) {
  try {
    const auth = await verifyAuth(request)
    if (isAuthError(auth)) return auth

    const { userId } = auth

    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL
    if (!origin) {
      console.error("NEXT_PUBLIC_APP_URL is not configured")
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    const backUrl = `${origin}/es/app`

    const result = await preApproval.create({
      body: {
        reason: "Cobri Pro",
        external_reference: `cobri__${userId}`,
        payer_email: auth.email ?? "",
        auto_recurring: {
          frequency: 1,
          frequency_type: "months",
          transaction_amount: 5,
          currency_id: "ARS",
        },
        back_url: backUrl,
        status: "pending",
      },
    })

    return NextResponse.json({
      id: result.id,
      initPoint: result.init_point,
      status: result.status,
    })
  } catch (error) {
    console.error("Error in POST /api/billing/subscribe:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add app/api/billing/subscribe/route.ts
git commit -m "feat: add billing subscribe endpoint for Cobri Pro plan"
```

---

### Task 3: Update Webhook for Platform Subscriptions

**Files:**
- Modify: `app/api/webhooks/mercadopago/route.ts`

- [ ] **Step 1: Add cobri__ prefix handling**

Read the webhook handler. After the external_reference is parsed (the `const [userId, subscriptionId] = ...split("__")` line), add handling for the `cobri__` prefix:

```typescript
// Check if this is a Cobri platform subscription (not a client subscription)
if (preapprovalData.external_reference.startsWith("cobri__")) {
  const cobriUserId = preapprovalData.external_reference.replace("cobri__", "")
  if (!cobriUserId) {
    return NextResponse.json({ received: true })
  }

  // Map status for platform subscription
  let platformStatus: string
  switch (preapprovalData.status) {
    case "authorized": platformStatus = "authorized"; break
    case "paused": platformStatus = "paused"; break
    case "cancelled": platformStatus = "cancelled"; break
    default: platformStatus = "trial"; break
  }

  // Update user's subscriptionStatus directly
  const userRef = adminDb.collection("users").doc(cobriUserId)
  await userRef.update({ subscriptionStatus: platformStatus })

  console.log(`Webhook: updated Cobri platform subscription for user ${cobriUserId} to ${platformStatus}`)
  return NextResponse.json({ received: true, status: platformStatus })
}
```

This should go BEFORE the existing `const [userId, subscriptionId]` split logic so that `cobri__userId` doesn't get incorrectly parsed as two parts.

- [ ] **Step 2: Commit**

```bash
git add app/api/webhooks/mercadopago/route.ts
git commit -m "feat: handle Cobri platform subscriptions in webhook"
```

---

### Task 4: Create Upgrade Page

**Files:**
- Create: `app/[locale]/app/upgrade/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
"use client"

import { useState } from "react"
import { useTranslations } from "@/hooks/use-translations"
import { useAuth } from "@/components/auth-provider"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconCheck } from "@tabler/icons-react"
import { useToast } from "@/hooks/use-toast"

export default function UpgradePage() {
  const t = useTranslations('upgrade')
  const tPricing = useTranslations('pricing')
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    if (!user) return
    setLoading(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      const data = await res.json()
      if (data.initPoint) {
        window.location.href = data.initPoint
      } else {
        toast({ title: t('errorSubscribing'), variant: "destructive" })
      }
    } catch {
      toast({ title: t('errorSubscribing'), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const features = [
    tPricing('unlimitedSubscriptions'),
    tPricing('customerManagement'),
    tPricing('revenueTracking'),
    tPricing('statusMonitoring'),
    tPricing('mpIntegration'),
    tPricing('prioritySupport'),
  ]

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        <div className="text-center mb-6">
          <div className="text-5xl font-bold mb-2">
            $5<span className="text-xl text-muted-foreground">/{tPricing('month')}</span>
          </div>
          <p className="text-muted-foreground">{tPricing('billedMonthly')}</p>
        </div>

        <div className="space-y-3 mb-8">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <IconCheck className="w-5 h-5 text-success flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        <Button className="w-full" size="lg" onClick={handleSubscribe} disabled={loading}>
          {loading ? t('subscribing') : t('subscribePro')}
        </Button>
      </Card>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/app/upgrade/page.tsx
git commit -m "feat: add upgrade page with MercadoPago Pro subscription"
```

---

### Task 5: Post-Trial Blocking in App Shell

**Files:**
- Modify: `components/app-shell.tsx`

- [ ] **Step 1: Add trial expiration check**

Read the current file. Add these imports:
```typescript
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { isTrialExpired, isPaidUser } from "@/lib/trial-utils"
```

Add state and effect inside the component (after existing effects):
```typescript
const isUpgradePage = pathname === `/${locale}/app/upgrade`

React.useEffect(() => {
  if (!user || isUpgradePage) return
  ;(async () => {
    const ref = doc(db, 'users', user.uid)
    const snap = await getDoc(ref)
    if (!snap.exists()) return
    const data = snap.data() as any
    const status = data?.subscriptionStatus ?? null
    const trialEnd = data?.trialEndsAt

    if (isTrialExpired(status, trialEnd) && !isPaidUser(status)) {
      router.replace(`/${locale}/app/upgrade`)
    }
  })()
}, [user, pathname, locale, router, isUpgradePage])
```

- [ ] **Step 2: Commit**

```bash
git add components/app-shell.tsx
git commit -m "feat: add post-trial blocking redirect to upgrade page"
```

---

### Task 6: Plan Status in Settings

**Files:**
- Modify: `app/[locale]/app/settings/page.tsx`

- [ ] **Step 1: Add plan status section**

Read the current file. Add imports:
```typescript
import { isTrialExpired, isPaidUser, trialDaysLeft } from "@/lib/trial-utils"
import Link from "next/link"
```

Add state for plan info (after existing state declarations):
```typescript
const [planStatus, setPlanStatus] = useState<string>("")
const [showUpgrade, setShowUpgrade] = useState(false)
const tUpgrade = useTranslations('upgrade')
```

In the existing useEffect where user data is fetched, after setting `joined`, add:
```typescript
const subStatus = data?.subscriptionStatus ?? null
const trialEnd = data?.trialEndsAt
if (isPaidUser(subStatus)) {
  setPlanStatus(tUpgrade('proPlan'))
  setShowUpgrade(false)
} else if (isTrialExpired(subStatus, trialEnd)) {
  setPlanStatus(tUpgrade('trialExpiredLabel'))
  setShowUpgrade(true)
} else {
  const days = trialDaysLeft(subStatus, trialEnd)
  setPlanStatus(tUpgrade('trialDaysLeft', { days }))
  setShowUpgrade(false)
}
```

After the profile Card and before `<ChangePasswordForm />`, add:
```tsx
<Card className="p-6">
  <h2 className="text-lg font-semibold mb-4">{tUpgrade('currentPlan')}</h2>
  <div className="flex items-center justify-between">
    <p className="font-medium">{planStatus}</p>
    {showUpgrade && (
      <Link href={`/${locale}/app/upgrade`}>
        <Button size="sm">{tUpgrade('upgradeNow')}</Button>
      </Link>
    )}
  </div>
</Card>
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/app/settings/page.tsx
git commit -m "feat: show plan status and upgrade link in settings"
```

---

## Task Dependency Graph

```
Task 1 (i18n + utils) → all others depend on it

After Task 1, independent:
  Task 2 (billing endpoint) | Task 3 (webhook update)

After Task 2:
  Task 4 (upgrade page) — depends on Task 2

After Task 1:
  Task 5 (app-shell blocking) — depends on Task 1 only
  Task 6 (settings plan) — depends on Task 1 only

Parallel groups:
  Group A: Task 2 → Task 4
  Group B: Task 3
  Group C: Task 5 | Task 6
```
