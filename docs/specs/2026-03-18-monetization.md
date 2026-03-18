# Monetización Cobri — Design Spec

## Goal

Enable Cobri to monetize: users on expired trials get redirected to an upgrade page, where they can subscribe to the Pro plan via MercadoPago. Active subscribers can use the app normally.

## Context

- Trial is 15 days, tracked via `subscriptionStatus: 'trial'` + `trialEndsAt` in Firestore
- MercadoPago preapproval endpoint exists at `/api/subscriptions/create-preapproval`
- Webhook handler updates `subscriptionStatus` on payment events
- Currently NO enforcement — expired trial users can use app indefinitely

---

## Feature 1: Trial Utilities

Shared helper `lib/trial-utils.ts`:
- `isTrialExpired(status, trialEndsAt)` — returns true if status is 'trial' and trialEndsAt < now
- `isPaidUser(status)` — returns true if status is 'authorized'

---

## Feature 2: Upgrade Page

New page at `/app/upgrade`:
- Shows the Pro plan ($5/mo) with features list (reuse pricing page content)
- "Subscribe" button calls `/api/subscriptions/create-preapproval` to create a Cobri platform subscription (not a user's client subscription)
- On success, redirects to MercadoPago checkout (`init_point`)
- This is for the USER subscribing to Cobri, NOT for managing their clients' subscriptions

**Important distinction:** The existing preapproval endpoint creates subscriptions for the user's clients. For the user's own Cobri subscription, we need a separate endpoint or adapt the existing one.

**Approach:** Create a new API endpoint `/api/billing/subscribe` that creates a MercadoPago preapproval for the Cobri Pro plan specifically, with `external_reference: userId` (no subscription ID). The webhook handler already maps status updates, so when payment is authorized, `subscriptionStatus` gets updated to `'authorized'`.

Wait — the webhook currently updates subscriptions in `users/{uid}/subscriptions/{id}`. For the Cobri platform subscription, we need to update the user's root document `subscriptionStatus` field instead.

**Revised approach:** Keep it simple for MVP. The upgrade page calls a new endpoint `/api/billing/subscribe` that:
1. Creates a MercadoPago preapproval for $5/mo
2. Uses `external_reference: "cobri__userId"` format
3. Returns `init_point` for redirect
4. The webhook handler needs a small addition: if external_reference starts with `"cobri__"`, update `users/{userId}.subscriptionStatus` instead of a subscription document

---

## Feature 3: Post-Trial Blocking

In `app-shell.tsx`, add trial expiration check:
- After auth check, fetch user's `subscriptionStatus` and `trialEndsAt` from Firestore
- If trial expired and not authorized → redirect to `/app/upgrade`
- The upgrade page itself must NOT be blocked (allow access even with expired trial)

---

## Feature 4: Plan Info in Settings

Add current plan display to settings page:
- Show "Trial (X days remaining)" or "Pro" or "Trial expired"
- If trial/expired, show "Upgrade" button linking to `/app/upgrade`

---

## Files Summary

### New Files
- `lib/trial-utils.ts` — trial status helpers
- `app/[locale]/app/upgrade/page.tsx` — upgrade/checkout page
- `app/api/billing/subscribe/route.ts` — Cobri Pro subscription endpoint

### Modified Files
- `components/app-shell.tsx` — add trial expiration redirect
- `app/api/webhooks/mercadopago/route.ts` — handle `cobri__` prefix for platform subscriptions
- `app/[locale]/app/settings/page.tsx` — show plan status
- `messages/es.json` + `messages/en.json` — i18n keys
