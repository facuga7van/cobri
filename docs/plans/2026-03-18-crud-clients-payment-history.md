# CRUD Clients + Payment History — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add edit/delete client functionality and payment history views to both customer and subscription detail pages.

**Architecture:** Three new components (edit-customer-dialog, delete-customer-dialog, payment-history-table) integrated into existing detail pages. Payment field normalization at read time. Follows existing dialog patterns (EditSubscriptionDialog).

**Tech Stack:** Next.js 14, Firebase Firestore (client SDK), shadcn/ui, next-intl, Zod (email validation).

**Spec:** `docs/specs/2026-03-18-crud-clients-payment-history.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `components/edit-customer-dialog.tsx` | Modal dialog to edit customer name, email, phone, notes |
| `components/delete-customer-dialog.tsx` | Confirmation dialog with active-subscription detection, batch delete |
| `components/payment-history-table.tsx` | Reusable table for displaying payment records |

### Modified Files
| File | Changes |
|------|---------|
| `messages/es.json` | Add i18n keys for edit, delete, payments |
| `messages/en.json` | Add i18n keys for edit, delete, payments |
| `app/[locale]/app/customers/[id]/page.tsx` | Expand state type, add edit/delete/payments UI |
| `app/[locale]/app/subscriptions/[id]/page.tsx` | Add payment history, fix mark-as-paid `source` field |

---

## Chunk 1: Components + i18n

### Task 1: Add i18n Keys

**Files:**
- Modify: `messages/es.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add keys to `messages/es.json`**

Add to the `"customers"` namespace (after existing keys):
```json
"editCustomer": "Editar Cliente",
"deleteCustomer": "Eliminar Cliente",
"confirmDelete": "¿Estás seguro de que querés eliminar este cliente?",
"confirmDeleteWithSubs": "Este cliente tiene {count} suscripciones activas. Cancelarlas detendrá los cobros asociados. ¿Cancelar todo y eliminar?",
"cancelAllAndDelete": "Cancelar todo y eliminar",
"goBack": "Volver",
"customerDeleted": "Cliente eliminado",
"customerUpdated": "Cliente actualizado",
"notes": "Notas"
```

Add a new top-level `"payments"` namespace:
```json
"payments": {
  "title": "Historial de Pagos",
  "date": "Fecha",
  "amount": "Monto",
  "source": "Origen",
  "subscription": "Suscripción",
  "manual": "Manual",
  "mercadopago": "MercadoPago",
  "noPayments": "No hay pagos registrados aún"
}
```

- [ ] **Step 2: Add same keys to `messages/en.json`**

Add to `"customers"` namespace:
```json
"editCustomer": "Edit Customer",
"deleteCustomer": "Delete Customer",
"confirmDelete": "Are you sure you want to delete this customer?",
"confirmDeleteWithSubs": "This customer has {count} active subscriptions. Cancelling them will stop all associated charges. Cancel all and delete?",
"cancelAllAndDelete": "Cancel all and delete",
"goBack": "Go back",
"customerDeleted": "Customer deleted",
"customerUpdated": "Customer updated",
"notes": "Notes"
```

Add `"payments"` namespace:
```json
"payments": {
  "title": "Payment History",
  "date": "Date",
  "amount": "Amount",
  "source": "Source",
  "subscription": "Subscription",
  "manual": "Manual",
  "mercadopago": "MercadoPago",
  "noPayments": "No payments recorded yet"
}
```

- [ ] **Step 3: Commit**

```bash
git add messages/es.json messages/en.json
git commit -m "feat: add i18n keys for customer edit/delete and payment history"
```

---

### Task 2: Create Edit Customer Dialog

**Files:**
- Create: `components/edit-customer-dialog.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client"

import * as React from "react"
import { useTranslations } from "@/hooks/use-translations"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAuth } from "@/components/auth-provider"
import { db } from "@/lib/firebase"
import { doc, updateDoc } from "firebase/firestore"
import { toTitleCase } from "@/lib/string-utils"

export type EditableCustomer = {
  id: string
  name: string
  email: string
  phone?: string
  notes?: string
}

export function EditCustomerDialog({ customer, open, onOpenChange, onSaved }: {
  customer: EditableCustomer | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved?: (updated: Partial<EditableCustomer>) => void
}) {
  const t = useTranslations('customers')
  const tCommon = useTranslations('common')
  const { user } = useAuth()

  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [phone, setPhone] = React.useState("")
  const [notes, setNotes] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!open || !customer) return
    setName(customer.name)
    setEmail(customer.email)
    setPhone(customer.phone ?? "")
    setNotes(customer.notes ?? "")
  }, [open, customer])

  async function handleSave() {
    if (!user || !customer) return
    const cleanedName = toTitleCase(name)
    const cleanedEmail = email.trim()
    if (!cleanedName || !cleanedEmail) return
    setSaving(true)
    try {
      const custRef = doc(db, 'users', user.uid, 'customers', customer.id)
      const updates: Record<string, any> = {
        name: cleanedName,
        email: cleanedEmail,
        phone: phone.trim() || null,
        notes: notes.trim() || null,
      }
      await updateDoc(custRef, updates)
      onSaved?.({ name: cleanedName, email: cleanedEmail, phone: phone.trim() || undefined, notes: notes.trim() || undefined })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('editCustomer')}</DialogTitle>
        </DialogHeader>
        <Card className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">{t('customerName')}</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">{t('email')}</Label>
            <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">{t('phone')}</Label>
            <Input id="edit-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="edit-notes">{t('notes')}</Label>
            <Textarea id="edit-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </Card>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{tCommon('cancel')}</Button>
          <Button onClick={handleSave} disabled={saving}>{tCommon('save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Verify shadcn Textarea exists**

Run: `ls components/ui/textarea.tsx`

If it doesn't exist, install it: `npx shadcn@latest add textarea`

- [ ] **Step 3: Commit**

```bash
git add components/edit-customer-dialog.tsx
git commit -m "feat: add edit customer dialog component"
```

---

### Task 3: Create Delete Customer Dialog

**Files:**
- Create: `components/delete-customer-dialog.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client"

import * as React from "react"
import { useTranslations } from "@/hooks/use-translations"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useAuth } from "@/components/auth-provider"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, writeBatch, doc } from "firebase/firestore"

export function DeleteCustomerDialog({ customer, open, onOpenChange, onDeleted }: {
  customer: { id: string; name: string } | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onDeleted?: () => void
}) {
  const t = useTranslations('customers')
  const tCommon = useTranslations('common')
  const { user } = useAuth()

  const [activeSubs, setActiveSubs] = React.useState<Array<{ id: string; price: number; billingCycle: string }>>([])
  const [loadingSubs, setLoadingSubs] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  React.useEffect(() => {
    if (!open || !customer || !user) {
      setActiveSubs([])
      return
    }
    setLoadingSubs(true)
    ;(async () => {
      try {
        const q = query(
          collection(db, 'users', user.uid, 'subscriptions'),
          where('customerId', '==', customer.id),
          where('status', '==', 'authorized')
        )
        const snap = await getDocs(q)
        const list: Array<{ id: string; price: number; billingCycle: string }> = []
        snap.forEach((d) => {
          const data = d.data() as any
          list.push({
            id: d.id,
            price: typeof data.price === 'number' ? data.price : 0,
            billingCycle: data.billingCycle ?? 'monthly',
          })
        })
        setActiveSubs(list)
      } finally {
        setLoadingSubs(false)
      }
    })()
  }, [open, customer, user])

  async function handleDelete() {
    if (!user || !customer) return
    setDeleting(true)
    try {
      const batch = writeBatch(db)

      // Cancel all active subscriptions
      for (const sub of activeSubs) {
        const subRef = doc(db, 'users', user.uid, 'subscriptions', sub.id)
        batch.update(subRef, { status: 'cancelled' })
      }

      // Delete customer
      const custRef = doc(db, 'users', user.uid, 'customers', customer.id)
      batch.delete(custRef)

      await batch.commit()
      onDeleted?.()
    } finally {
      setDeleting(false)
    }
  }

  const hasActiveSubs = activeSubs.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('deleteCustomer')}</DialogTitle>
          <DialogDescription>
            {loadingSubs
              ? tCommon('loading')
              : hasActiveSubs
                ? t('confirmDeleteWithSubs', { count: activeSubs.length })
                : t('confirmDelete')
            }
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {hasActiveSubs ? t('goBack') : tCommon('cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || loadingSubs}
          >
            {hasActiveSubs ? t('cancelAllAndDelete') : tCommon('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/delete-customer-dialog.tsx
git commit -m "feat: add delete customer dialog with cascade cancel"
```

---

### Task 4: Create Payment History Table

**Files:**
- Create: `components/payment-history-table.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client"

import { useTranslations } from "@/hooks/use-translations"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"

export type PaymentRecord = {
  id: string
  date: Date | string
  amount: number
  source: string
  mercadopagoId?: string
  subscriptionPlan?: string
}

export function PaymentHistoryTable({ payments, showSubscriptionColumn, loading }: {
  payments: PaymentRecord[]
  showSubscriptionColumn?: boolean
  loading?: boolean
}) {
  const t = useTranslations('payments')

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t('title')}...</p>
  }

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-3">{t('title')}</h2>
      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noPayments')}</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('date')}</TableHead>
                <TableHead>{t('amount')}</TableHead>
                <TableHead>{t('source')}</TableHead>
                {showSubscriptionColumn && <TableHead>{t('subscription')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => {
                const dateStr = p.date instanceof Date
                  ? p.date.toLocaleDateString()
                  : new Date(p.date).toLocaleDateString()
                return (
                  <TableRow key={p.id}>
                    <TableCell>{dateStr}</TableCell>
                    <TableCell>${p.amount}</TableCell>
                    <TableCell>{t(p.source === 'mercadopago' ? 'mercadopago' : 'manual')}</TableCell>
                    {showSubscriptionColumn && <TableCell>{p.subscriptionPlan ?? '—'}</TableCell>}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  )
}
```

- [ ] **Step 2: Verify shadcn Table exists**

Run: `ls components/ui/table.tsx`

If it doesn't exist, install it: `npx shadcn@latest add table`

- [ ] **Step 3: Commit**

```bash
git add components/payment-history-table.tsx
git commit -m "feat: add reusable payment history table component"
```

---

## Chunk 2: Page Integration

### Task 5: Integrate into Customer Detail Page

**Files:**
- Modify: `app/[locale]/app/customers/[id]/page.tsx`

- [ ] **Step 1: Add imports**

At the top of the file, add:
```typescript
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { IconEdit, IconTrash } from "@tabler/icons-react"
import { EditCustomerDialog, EditableCustomer } from "@/components/edit-customer-dialog"
import { DeleteCustomerDialog } from "@/components/delete-customer-dialog"
import { PaymentHistoryTable, PaymentRecord } from "@/components/payment-history-table"
import { collection, query, where, onSnapshot, orderBy, getDocs } from "firebase/firestore"
```

The existing `firebase/firestore` import already has `doc, getDoc, collection, query, where, onSnapshot, orderBy`. Add `getDocs` to that same import line (do NOT create a second import).

- [ ] **Step 2: Expand customer state type**

Change line 26 from:
```typescript
const [customer, setCustomer] = useState<{ name: string; email: string } | null>(null)
```
To:
```typescript
const [customer, setCustomer] = useState<{ name: string; email: string; phone?: string; notes?: string } | null>(null)
```

- [ ] **Step 3: Update customer data fetching**

Change line 48 from:
```typescript
setCustomer({ name: data.name ?? '', email: data.email ?? '' })
```
To:
```typescript
setCustomer({ name: data.name ?? '', email: data.email ?? '', phone: data.phone ?? undefined, notes: data.notes ?? undefined })
```

- [ ] **Step 4: Add dialog/payment state and hooks**

After the existing state declarations (after line 35), add:
```typescript
const { toast } = useToast()
const router = useRouter()

const [editOpen, setEditOpen] = useState(false)
const [deleteOpen, setDeleteOpen] = useState(false)
const [payments, setPayments] = useState<PaymentRecord[]>([])
const [loadingPayments, setLoadingPayments] = useState(true)
```

The existing file uses named imports from React (`import { useEffect, useMemo, useState } from "react"`). Keep that pattern — use `useState` (not `React.useState`).

- [ ] **Step 5: Add payment history fetching effect**

After the existing subscriptions `useEffect` (after line 82), add a new effect that fetches payments for all of the customer's subscriptions:

```typescript
// Fetch consolidated payments from all customer subscriptions
useEffect(() => {
  if (!user || subs.length === 0) {
    setPayments([])
    setLoadingPayments(false)
    return
  }
  setLoadingPayments(true)
  ;(async () => {
    try {
      const allPayments: PaymentRecord[] = []
      for (const sub of subs) {
        const paymentsSnap = await getDocs(
          query(
            collection(db, 'users', user.uid, 'subscriptions', sub.id, 'payments'),
            orderBy('date', 'desc')
          )
        )
        paymentsSnap.forEach((d) => {
          const data = d.data() as any
          // Normalize: webhook uses `date`, manual uses `paidAt`
          const rawDate = data.date ?? data.paidAt
          let date: Date
          if (rawDate?.toDate) date = rawDate.toDate()
          else if (rawDate?.seconds) date = new Date(rawDate.seconds * 1000)
          else date = new Date(rawDate)

          allPayments.push({
            id: d.id,
            date,
            amount: data.amount ?? 0,
            source: data.source ?? 'manual',
            mercadopagoId: data.mercadopagoId,
            subscriptionPlan: sub.plan,
          })
        })
      }
      // Sort all payments by date descending
      allPayments.sort((a, b) => {
        const da = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime()
        const db2 = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime()
        return db2 - da
      })
      setPayments(allPayments)
    } finally {
      setLoadingPayments(false)
    }
  })()
}, [user, subIds])
```

**Important:** To avoid re-fetching payments every time `subs` array reference changes, use a stable dependency. Add this before the effect:

```typescript
const subIds = useMemo(() => subs.map(s => s.id).join(','), [subs])
```

`useMemo` is already imported in the file. The effect uses `subIds` (a string) instead of `subs` (an array that changes on every onSnapshot callback).

- [ ] **Step 6: Add Edit/Delete buttons to the header**

Replace the header `<div>` (lines 96-99):
```tsx
<div>
  <h1 className="text-2xl sm:text-3xl font-bold">{customer.name}</h1>
  <p className="text-muted-foreground break-all">{customer.email}</p>
</div>
```

With:
```tsx
<div className="flex-1">
  <h1 className="text-2xl sm:text-3xl font-bold">{customer.name}</h1>
  <p className="text-muted-foreground break-all">{customer.email}</p>
  {customer.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
  {customer.notes && <p className="text-sm text-muted-foreground mt-1 italic">{customer.notes}</p>}
</div>
<div className="flex gap-2">
  <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
    <IconEdit className="h-4 w-4 mr-2" />
    {tCommon('edit')}
  </Button>
  <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
    <IconTrash className="h-4 w-4 mr-2" />
    {tCommon('delete')}
  </Button>
</div>
```

- [ ] **Step 7: Add payment history table and dialogs before closing `</div>`**

Before the final `</div>` of the return (after the subscriptions `</Card>`), add:

```tsx
<PaymentHistoryTable
  payments={payments}
  showSubscriptionColumn={true}
  loading={loadingPayments}
/>

<EditCustomerDialog
  customer={customer ? { id: params.id, ...customer } : null}
  open={editOpen}
  onOpenChange={setEditOpen}
  onSaved={(updated) => {
    setCustomer((prev) => prev ? { ...prev, ...updated } : prev)
    toast({ title: tCust('customerUpdated') })
  }}
/>

<DeleteCustomerDialog
  customer={customer ? { id: params.id, name: customer.name } : null}
  open={deleteOpen}
  onOpenChange={setDeleteOpen}
  onDeleted={() => {
    toast({ title: tCust('customerDeleted') })
    router.push(`/${locale}/app/customers`)
  }}
/>
```

- [ ] **Step 8: Commit**

```bash
git add app/[locale]/app/customers/[id]/page.tsx
git commit -m "feat: integrate edit/delete customer dialogs and payment history into customer detail"
```

---

### Task 6: Integrate Payment History into Subscription Detail Page

**Files:**
- Modify: `app/[locale]/app/subscriptions/[id]/page.tsx`

- [ ] **Step 1: Add imports**

Add at the top:
```typescript
import { PaymentHistoryTable, PaymentRecord } from "@/components/payment-history-table"
import { collection, query, orderBy, onSnapshot } from "firebase/firestore"
```

The existing `firebase/firestore` import has `doc, getDoc, updateDoc, addDoc, collection, serverTimestamp`. Add `query, orderBy, onSnapshot` to that same import line (`collection` is already there — do NOT duplicate it).

- [ ] **Step 2: Add payments state**

After the existing state declarations (after line 36), add:
```typescript
const [payments, setPayments] = useState<PaymentRecord[]>([])
const [loadingPayments, setLoadingPayments] = useState(true)
```

The file uses `useState` directly (named import). Follow that pattern.

- [ ] **Step 3: Add payments fetching effect**

After the existing `useEffect` (after line 76), add:

```typescript
useEffect(() => {
  if (!user) return
  const q = query(
    collection(db, 'users', user.uid, 'subscriptions', params.id, 'payments'),
    orderBy('date', 'desc')
  )
  const unsub = onSnapshot(q, (snap) => {
    const list: PaymentRecord[] = []
    snap.forEach((d) => {
      const data = d.data() as any
      const rawDate = data.date ?? data.paidAt
      let date: Date
      if (rawDate?.toDate) date = rawDate.toDate()
      else if (rawDate?.seconds) date = new Date(rawDate.seconds * 1000)
      else date = rawDate ? new Date(rawDate) : new Date()

      list.push({
        id: d.id,
        date,
        amount: data.amount ?? 0,
        source: data.source ?? 'manual',
        mercadopagoId: data.mercadopagoId,
      })
    })
    setPayments(list)
    setLoadingPayments(false)
  })
  return () => unsub()
}, [user, params.id])
```

- [ ] **Step 4: Fix handleMarkPaid to include `source: "manual"`**

In the `handleMarkPaid` function, change the `addDoc` call (line 105-109) from:
```typescript
await addDoc(collection(db, 'users', user.uid, 'subscriptions', params.id, 'payments'), {
  paidAt: serverTimestamp(),
  amount: data.price ?? null,
  coveredUntil: baseDate,
})
```

To:
```typescript
await addDoc(collection(db, 'users', user.uid, 'subscriptions', params.id, 'payments'), {
  paidAt: serverTimestamp(),
  date: serverTimestamp(),
  amount: data.price ?? null,
  coveredUntil: baseDate,
  source: "manual",
})
```

This writes both `paidAt` (backward compat) and `date` + `source` (new normalized fields).

- [ ] **Step 5: Add payment history table to the page**

Before the final `</div>` of the return (after the grid of cards, around line 178), add:

```tsx
<PaymentHistoryTable
  payments={payments}
  loading={loadingPayments}
/>
```

- [ ] **Step 6: Commit**

```bash
git add app/[locale]/app/subscriptions/[id]/page.tsx
git commit -m "feat: add payment history to subscription detail, normalize payment source field"
```

---

## Summary — Task Dependency Graph

```
Task 1 (i18n keys) — do first, all others depend on it

After Task 1, these are independent:
  Task 2 (edit dialog) | Task 3 (delete dialog) | Task 4 (payment table)

After Tasks 2-4 are done:
  Task 5 (customer page integration) — depends on Tasks 2, 3, 4
  Task 6 (subscription page integration) — depends on Task 4 only
```

Tasks 5 and 6 can run in parallel since they modify different files.
