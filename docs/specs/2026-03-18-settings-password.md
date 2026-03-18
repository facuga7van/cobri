# Settings + Password Management — Design Spec

## Goal

Complete the settings page with profile editing and password management. Add password reset flow to the sign-in page.

## Context

Cobri uses Firebase Auth (email/password + Google OAuth). The settings page at `/app/settings` is read-only. Firebase SDK provides `updateProfile`, `updatePassword`, `reauthenticateWithCredential`, and `sendPasswordResetEmail` — all available but unused.

---

## Feature 1: Profile Editing

### Requirements

- Edit `displayName` inline on the settings page
- Save updates both Firebase Auth profile (`updateProfile`) and Firestore `users/{uid}` doc
- Toast on success
- No email change (requires verification flow — out of scope for MVP)

### Implementation

Add an edit mode to the existing settings page. When user clicks "Edit", the name field becomes an input. Save button persists changes.

---

## Feature 2: Change Password

### Requirements

- New section on settings page: "Change Password"
- Only visible for email/password users (not Google OAuth users)
- Fields: current password, new password, confirm new password
- Requires reauthentication via `reauthenticateWithCredential` with current password
- Then calls `updatePassword` with new password
- Minimum 6 characters (Firebase default)
- Toast on success, error on failure (wrong current password, etc.)

### Implementation

New component: `components/change-password-form.tsx`
- Self-contained form with its own state
- Uses `EmailAuthProvider.credential()` + `reauthenticateWithCredential()` + `updatePassword()`
- Detects auth provider to show/hide (Google users see "Managed by Google" message)

---

## Feature 3: Password Reset

### Requirements

- "Forgot password?" link on sign-in page (already has i18n key `auth.forgotPassword`)
- Clicking opens a dialog asking for email
- Calls `sendPasswordResetEmail` from Firebase
- Shows success message: "Reset email sent, check your inbox"
- No custom reset page — uses Firebase's default reset flow

### Implementation

New component: `components/forgot-password-dialog.tsx`
- Simple dialog with email input and send button
- Uses Firebase `sendPasswordResetEmail`

---

## Files Summary

### New Files
- `components/change-password-form.tsx`
- `components/forgot-password-dialog.tsx`

### Modified Files
- `app/[locale]/app/settings/page.tsx` — add profile editing + change password section
- `app/[locale]/auth/sign-in/page.tsx` — add forgot password dialog trigger
- `messages/es.json` — add i18n keys
- `messages/en.json` — add i18n keys
