# Email Notifications — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan.

**Goal:** Send email notifications to the business owner when client subscription payments succeed or are cancelled.

**Architecture:** Resend API for email delivery, HTML templates, triggered from webhook handler.

**Tech Stack:** Resend API, Next.js API routes, Firebase Firestore.

---

### Task 1: Install Resend + Create Email Service

**Files:**
- Create: `lib/email.ts`

- [ ] **Step 1: Install resend**

```bash
cd E:/Usuario/Documentos/cobri && npm install resend
```

- [ ] **Step 2: Create `lib/email.ts`**

```typescript
import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY

let resend: Resend | null = null
if (resendApiKey) {
  resend = new Resend(resendApiKey)
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!resend) {
    console.log(`[Email] Would send to ${to}: ${subject}`)
    return
  }

  try {
    await resend.emails.send({
      from: 'Cobri <noreply@cobri.app>',
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error('[Email] Failed to send:', error)
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/email.ts package.json package-lock.json
git commit -m "feat: add email service with Resend API"
```

---

### Task 2: Create Email Templates

**Files:**
- Create: `lib/email-templates.ts`

- [ ] **Step 1: Create the templates**

```typescript
export function paymentSuccessEmail(customerName: string, plan: string, amount: number) {
  return {
    subject: `Pago recibido: ${customerName} - ${plan}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #18181b; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">Cobri</h1>
        </div>
        <div style="padding: 24px; border: 1px solid #e4e4e7; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #16a34a; margin-top: 0;">Pago recibido</h2>
          <p><strong>Cliente:</strong> ${customerName}</p>
          <p><strong>Plan:</strong> ${plan}</p>
          <p><strong>Monto:</strong> $${amount}</p>
          <p style="color: #71717a; font-size: 14px; margin-top: 24px;">
            Este pago fue procesado automáticamente por MercadoPago.
          </p>
        </div>
      </div>
    `,
  }
}

export function paymentCancelledEmail(customerName: string, plan: string) {
  return {
    subject: `Suscripción cancelada: ${customerName} - ${plan}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #18181b; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 20px;">Cobri</h1>
        </div>
        <div style="padding: 24px; border: 1px solid #e4e4e7; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #ef4444; margin-top: 0;">Suscripción cancelada</h2>
          <p><strong>Cliente:</strong> ${customerName}</p>
          <p><strong>Plan:</strong> ${plan}</p>
          <p style="color: #71717a; font-size: 14px; margin-top: 24px;">
            La suscripción de este cliente fue cancelada en MercadoPago. No se realizarán más cobros automáticos.
          </p>
        </div>
      </div>
    `,
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/email-templates.ts
git commit -m "feat: add email templates for payment notifications"
```

---

### Task 3: Integrate Emails into Webhook Handler

**Files:**
- Modify: `app/api/webhooks/mercadopago/route.ts`
- Modify: `environment.example.txt`

- [ ] **Step 1: Add email imports to webhook**

At the top of the webhook file, add:
```typescript
import { sendEmail } from "@/lib/email"
import { paymentSuccessEmail, paymentCancelledEmail } from "@/lib/email-templates"
```

- [ ] **Step 2: Send email on authorized status**

In the existing `if (cobriStatus === "authorized")` block (the one that creates payment records), AFTER the payment is recorded and customer counters are updated, add:

```typescript
// Send payment success email to the business owner
const userDoc = await adminDb.collection("users").doc(userId).get()
const ownerEmail = userDoc.data()?.email
const customerName = customerSnap?.exists ? (customerSnap.data()?.name ?? "—") : "—"
if (ownerEmail) {
  const { subject, html } = paymentSuccessEmail(customerName, subData.plan ?? "—", subData.price ?? 0)
  await sendEmail({ to: ownerEmail, subject, html })
}
```

Note: `customerSnap` is already fetched in the existing code (around line 112). Use it to get the customer name. If the variable is scoped differently, fetch the customer data here.

- [ ] **Step 3: Send email on cancelled status**

In the existing `if (cobriStatus === "cancelled")` block, AFTER the customer MRR update, add:

```typescript
// Send cancellation email to the business owner
const userDocCancel = await adminDb.collection("users").doc(userId).get()
const ownerEmailCancel = userDocCancel.data()?.email
if (ownerEmailCancel && subData.customerId) {
  const customerRefCancel = adminDb.collection("users").doc(userId).collection("customers").doc(subData.customerId)
  const customerSnapCancel = await customerRefCancel.get()
  const custName = customerSnapCancel.exists ? (customerSnapCancel.data()?.name ?? "—") : "—"
  const { subject, html } = paymentCancelledEmail(custName, subData.plan ?? "—")
  await sendEmail({ to: ownerEmailCancel, subject, html })
}
```

- [ ] **Step 4: Add RESEND_API_KEY to environment.example.txt**

Append:
```

# Resend (email notifications)
RESEND_API_KEY=re_your_resend_api_key
```

- [ ] **Step 5: Commit**

```bash
git add app/api/webhooks/mercadopago/route.ts environment.example.txt
git commit -m "feat: send email notifications on payment success and cancellation"
```

---

## Task Dependency Graph

```
Task 1 (email service) → Task 2 (templates) → Task 3 (webhook integration)
```

Sequential — each depends on the previous.
