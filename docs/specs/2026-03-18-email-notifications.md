# Email Notifications — Design Spec

## Goal

Send email notifications to the Cobri user (business owner) when their clients' subscription payments are upcoming, successful, or failed.

## Context

Cobri manages subscriptions with MercadoPago. The webhook handler already processes payment events. Emails are for the business owner (Cobri user), NOT for their clients.

## Approach Decision

For MVP, use **Firebase Extensions - Trigger Email** (via Firestore). This is the simplest approach:
1. Install the Firebase "Trigger Email from Firestore" extension
2. Write a document to a `mail` collection in Firestore
3. Firebase sends the email automatically via configured SMTP (SendGrid, Mailgun, etc.)

**Alternative considered:** Resend/SendGrid API directly from webhooks. More control but requires API key management, email templates, and more code. Overkill for MVP.

**Simpler alternative for MVP:** Since configuring Firebase Extensions requires Firebase Console setup and SMTP credentials (which is infrastructure, not code), we'll take an even simpler approach:

**Final approach:** Create a `lib/notifications.ts` module that writes notification records to `users/{uid}/notifications/{id}` in Firestore. For now, these are stored but not emailed. The notification records are structured so that when email sending is configured (via Firebase Extension or API), they can be picked up and sent. Additionally, show in-app notifications on the dashboard.

Wait — the user specifically asked for email notifications. Let's use **Resend** (simple email API):

**Final final approach:** Use Resend API. Simple, 1 file, no extensions needed.
1. Create `lib/email.ts` with a `sendEmail` helper
2. Call it from the webhook handler when payment events occur
3. Three email types: upcoming payment reminder, payment successful, payment failed

---

## Feature 1: Email Service

New file `lib/email.ts`:
- Uses Resend API (or falls back to console.log in dev)
- `sendEmail({ to, subject, html })` function
- Requires `RESEND_API_KEY` env var

## Feature 2: Email Templates

New file `lib/email-templates.ts`:
- `paymentSuccessEmail(customerName, plan, amount)` → returns { subject, html }
- `paymentFailedEmail(customerName, plan)` → returns { subject, html }
- `paymentUpcomingEmail(customerName, plan, amount, date)` → returns { subject, html }
- Simple HTML templates, no external template engine

## Feature 3: Webhook Integration

Modify webhook handler to send emails when:
- Status changes to `authorized` → payment success email
- Status changes to `cancelled` → payment failed/cancelled email
- Need the user's email (fetch from auth or Firestore)

## Feature 4: Upcoming Payment Reminder

This requires a cron/scheduled function. For MVP, skip this — it needs Cloud Functions or a cron service. Only implement success/cancelled notifications triggered by webhooks.

---

## Files Summary

### New Files
- `lib/email.ts` — email sending service
- `lib/email-templates.ts` — HTML email templates

### Modified Files
- `app/api/webhooks/mercadopago/route.ts` — send emails on status changes
- `environment.example.txt` — add RESEND_API_KEY
