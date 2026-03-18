# CRUD Clientes + Historial de Pagos — Design Spec

## Goal

Complete the client management CRUD (edit, delete) and add payment history views so users can fully manage their clients and verify payment status.

## Context

Cobri is a SaaS subscription management platform (Next.js 14, Firebase, MercadoPago). Clients are stored at `users/{uid}/customers/{id}`, subscriptions at `users/{uid}/subscriptions/{id}`, payments at `users/{uid}/subscriptions/{id}/payments/{paymentId}`.

Currently: clients can be created and viewed. No edit, no delete, no payment history.

**Existing payment field names:** The manual "mark as paid" flow in `subscriptions/[id]/page.tsx` writes payments with `paidAt`, `amount`, `coveredUntil`. The MercadoPago webhook writes `date`, `amount`, `source: "mercadopago"`, `mercadopagoId`. These field names are inconsistent and must be normalized.

---

## Feature 1: Edit Client

### Requirements

- Dialog modal triggered from the customer detail page (`/app/customers/[id]`)
- Editable fields: name, email, phone (new), notes (new)
- Phone and notes are optional fields (no validation beyond trimming)
- Name uses `toTitleCase()` from `lib/string-utils.ts` (already exists)
- Email validated as valid email format
- Follow existing patterns: `EditSubscriptionDialog` component structure
- Toast notification on success (import `useToast` in customer detail page)

### Firestore Schema Change

```
customers/{id}:
  + phone: string (optional)
  + notes: string (optional)
```

No migration needed — new optional fields. Existing documents simply won't have them.

### Component

New file: `components/edit-customer-dialog.tsx`

Props (inline type, no shared `Customer` type needed — follow `EditableSubscription` pattern):
```typescript
export type EditableCustomer = {
  id: string
  name: string
  email: string
  phone?: string
  notes?: string
}

{
  customer: EditableCustomer | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved?: (updated: Partial<EditableCustomer>) => void
}
```

Uses `useAuth()` to get `user.uid`, `updateDoc` on `users/{uid}/customers/{id}`.

### UI Location

Customer detail page (`app/[locale]/app/customers/[id]/page.tsx`) — add an "Edit" button next to the customer info section. The page's customer state type must be expanded to include `phone?: string` and `notes?: string`.

---

## Feature 2: Delete Client

### Requirements

- Button on customer detail page (next to Edit button)
- Two flows based on active subscriptions:
  - **No active subs:** Simple confirmation dialog — "Are you sure you want to delete this client?"
  - **Has active subs:** Warning dialog — "This client has X active subscriptions. Cancelling them will stop all associated MercadoPago charges. Cancel all and delete?" with "Cancel all and delete" (destructive) and "Go back" buttons
- On confirm with active subs:
  1. Fetch all active subscriptions for this customer (needed for MRR calculation)
  2. Compute total MRR delta from all active subs
  3. Cancel all active subscriptions (set status to `cancelled`) via `writeBatch`
  4. Delete the customer document in the same batch
  5. Redirect to `/app/customers` with toast notification
- On confirm without active subs:
  1. Delete the customer document
  2. Redirect to `/app/customers` with toast notification

### Implementation

New file: `components/delete-customer-dialog.tsx`

The component must receive enough data to perform the deletion. It fetches active subscriptions internally when the dialog opens (using `useAuth` + Firestore query), so the parent only needs to pass the customer ID:

```typescript
{
  customer: { id: string; name: string } | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onDeleted?: () => void
}
```

Internally, when `open` becomes true:
1. Query `users/{uid}/subscriptions` where `customerId == customer.id` and `status == "authorized"`
2. Store the active subs list (with price, billingCycle for MRR calculation)
3. Show appropriate dialog variant based on count

Deletion uses `writeBatch`:
- For each active subscription: `batch.update(subRef, { status: "cancelled" })`
- `batch.delete(customerRef)`
- No need to update customer `totalValue`/`subscriptions` counters — the document is being deleted

Note: MercadoPago preapprovals are NOT cancelled automatically. This only changes the internal status. This keeps the delete operation simple and avoids API failures blocking deletion.

### i18n

Add keys to `customers` namespace in both `messages/es.json` and `messages/en.json`:
- `editCustomer`, `deleteCustomer`, `confirmDelete`, `confirmDeleteWithSubs`, `cancelAllAndDelete`, `goBack`, `customerDeleted`, `notes`

Note: `phone` key already exists in `messages/es.json`. Do not duplicate.

---

## Feature 3: Payment History

### Requirements

Two views showing payment history:

#### View A: Subscription Detail (`/app/subscriptions/[id]`)

- Table below the existing subscription details section
- Query: `users/{uid}/subscriptions/{id}/payments` ordered by date desc
- Columns: Date, Amount, Source (mercadopago/manual)
- Empty state: "No payments recorded yet"

#### View B: Customer Detail (`/app/customers/[id]`)

- Table below the customer's subscriptions list
- Shows consolidated payments from ALL of the customer's subscriptions
- Query: for each subscription belonging to this customer, fetch its `payments` subcollection, merge and sort by date desc
- Columns: Date, Amount, Source, Subscription (plan name)
- Empty state: "No payments recorded yet"

### Payment Field Normalization

Existing payments have inconsistent field names:
- Manual payments: `{ paidAt, amount, coveredUntil }`
- Webhook payments: `{ date, amount, source, mercadopagoId }`

**Strategy:** Normalize at read time in the data-fetching layer. Map both formats to a unified shape:

```typescript
type Payment = {
  id: string
  date: Date          // from `paidAt` or `date` field
  amount: number
  source: string      // "manual" if no source field, else the source value
  mercadopagoId?: string
  subscriptionPlan?: string  // only populated in customer consolidated view
}
```

Also update the manual "mark as paid" handler in `subscriptions/[id]/page.tsx` to write `source: "manual"` alongside existing fields, for consistency going forward.

### Component

New file: `components/payment-history-table.tsx`

Props:
```typescript
{
  payments: Payment[]
  showSubscriptionColumn?: boolean  // true in customer view
  loading?: boolean
}
```

Reusable table component used in both views. Uses shadcn/ui `Table` component.

### Data Fetching

- Subscription detail page: direct query to `payments` subcollection
- Customer detail page: fetch all subscriptions for customer, then fetch payments for each, merge and sort. Done client-side.

### Performance Consideration

For the customer consolidated view, if a customer has many subscriptions, this could mean many queries. For MVP this is acceptable — the typical Cobri user will have < 50 subscriptions per customer. Pagination can be added post-MVP.

---

## Files Summary

### New Files
- `components/edit-customer-dialog.tsx`
- `components/delete-customer-dialog.tsx`
- `components/payment-history-table.tsx`

### Modified Files
- `app/[locale]/app/customers/[id]/page.tsx` — expand customer state type to include `phone`/`notes`, add Edit/Delete buttons, add payment history table, import `useToast`
- `app/[locale]/app/subscriptions/[id]/page.tsx` — add payment history table, add `source: "manual"` to mark-as-paid handler
- `messages/es.json` — add i18n keys for edit/delete/payments
- `messages/en.json` — add i18n keys for edit/delete/payments

### Patterns to Follow
- Dialog structure: follow `edit-subscription-dialog.tsx`
- Type exports: follow `EditableSubscription` pattern (export type from component file)
- Data fetching: follow existing `onSnapshot` pattern in customer/subscription pages
- Toast: use existing `useToast()` hook (import where missing)
- i18n: use `useTranslations()` hook
- Imports: use `@/` path aliases
