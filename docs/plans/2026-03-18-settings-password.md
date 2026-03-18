# Settings + Password Management — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete settings page with profile editing and password management, add password reset to sign-in.

**Architecture:** Profile editing inline on settings page. Change password as separate form component. Forgot password as dialog on sign-in page. All use Firebase Auth SDK methods.

**Tech Stack:** Next.js 14, Firebase Auth (client SDK), shadcn/ui, next-intl.

**Spec:** `docs/specs/2026-03-18-settings-password.md`

---

### Task 1: Add i18n Keys

**Files:**
- Modify: `messages/es.json`
- Modify: `messages/en.json`

- [ ] **Step 1: Add keys to `messages/es.json`**

Add to `"settings"` namespace:
```json
"editProfile": "Editar perfil",
"profileUpdated": "Perfil actualizado",
"displayName": "Nombre",
"changePassword": "Cambiar contraseña",
"currentPassword": "Contraseña actual",
"newPassword": "Nueva contraseña",
"confirmNewPassword": "Confirmar nueva contraseña",
"passwordChanged": "Contraseña actualizada",
"passwordMismatch": "Las contraseñas no coinciden",
"wrongPassword": "Contraseña actual incorrecta",
"passwordTooShort": "La contraseña debe tener al menos 6 caracteres",
"managedByGoogle": "Tu contraseña es administrada por Google"
```

Add to `"auth"` namespace:
```json
"forgotPasswordTitle": "Recuperar contraseña",
"forgotPasswordDesc": "Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña",
"sendResetEmail": "Enviar enlace",
"resetEmailSent": "Email enviado",
"resetEmailSentDesc": "Revisá tu bandeja de entrada para restablecer tu contraseña",
"sendingEmail": "Enviando..."
```

- [ ] **Step 2: Add same keys to `messages/en.json`**

Add to `"settings"`:
```json
"editProfile": "Edit profile",
"profileUpdated": "Profile updated",
"displayName": "Name",
"changePassword": "Change password",
"currentPassword": "Current password",
"newPassword": "New password",
"confirmNewPassword": "Confirm new password",
"passwordChanged": "Password changed",
"passwordMismatch": "Passwords don't match",
"wrongPassword": "Current password is incorrect",
"passwordTooShort": "Password must be at least 6 characters",
"managedByGoogle": "Your password is managed by Google"
```

Add to `"auth"`:
```json
"forgotPasswordTitle": "Reset password",
"forgotPasswordDesc": "Enter your email and we'll send you a link to reset your password",
"sendResetEmail": "Send reset link",
"resetEmailSent": "Email sent",
"resetEmailSentDesc": "Check your inbox to reset your password",
"sendingEmail": "Sending..."
```

- [ ] **Step 3: Commit**

```bash
git add messages/es.json messages/en.json
git commit -m "feat: add i18n keys for settings profile/password and forgot password"
```

---

### Task 2: Add Firebase Auth Exports

**Files:**
- Modify: `lib/firebase.ts`

- [ ] **Step 1: Add missing Firebase Auth re-exports**

The current re-exports from `firebase/auth` are: `signInWithEmailAndPassword`, `createUserWithEmailAndPassword`, `updateProfile`.

Update the re-export to also include `sendPasswordResetEmail`, `updatePassword`, `reauthenticateWithCredential`, `EmailAuthProvider`:

```typescript
export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth"
```

- [ ] **Step 2: Commit**

```bash
git add lib/firebase.ts
git commit -m "feat: export Firebase Auth password management methods"
```

---

### Task 3: Create Change Password Form

**Files:**
- Create: `components/change-password-form.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client"

import * as React from "react"
import { useTranslations } from "@/hooks/use-translations"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { auth, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from "@/lib/firebase"

export function ChangePasswordForm() {
  const t = useTranslations('settings')
  const { user } = useAuth()
  const { toast } = useToast()

  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  // Check if user logged in with email/password (not Google)
  const isPasswordUser = user?.providerData?.some(p => p.providerId === 'password')

  if (!isPasswordUser) {
    return (
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">{t('changePassword')}</h2>
        <p className="text-sm text-muted-foreground">{t('managedByGoogle')}</p>
      </Card>
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 6) {
      toast({ title: t('passwordTooShort'), variant: "destructive" })
      return
    }
    if (newPassword !== confirmPassword) {
      toast({ title: t('passwordMismatch'), variant: "destructive" })
      return
    }
    if (!auth.currentUser) return
    setSaving(true)
    try {
      const credential = EmailAuthProvider.credential(auth.currentUser.email!, currentPassword)
      await reauthenticateWithCredential(auth.currentUser, credential)
      await updatePassword(auth.currentUser, newPassword)
      toast({ title: t('passwordChanged') })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (err: any) {
      if (err?.code === 'auth/wrong-password' || err?.code === 'auth/invalid-credential') {
        toast({ title: t('wrongPassword'), variant: "destructive" })
      } else {
        toast({ title: err?.message ?? "Error", variant: "destructive" })
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">{t('changePassword')}</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="current-pw">{t('currentPassword')}</Label>
          <Input id="current-pw" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-pw">{t('newPassword')}</Label>
          <Input id="new-pw" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required autoComplete="new-password" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-pw">{t('confirmNewPassword')}</Label>
          <Input id="confirm-pw" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
        </div>
        <Button type="submit" disabled={saving}>
          {t('changePassword')}
        </Button>
      </form>
    </Card>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/change-password-form.tsx
git commit -m "feat: add change password form component"
```

---

### Task 4: Create Forgot Password Dialog

**Files:**
- Create: `components/forgot-password-dialog.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client"

import * as React from "react"
import { useTranslations } from "@/hooks/use-translations"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { auth, sendPasswordResetEmail } from "@/lib/firebase"

export function ForgotPasswordDialog({ open, onOpenChange }: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const t = useTranslations('auth')
  const { toast } = useToast()

  const [email, setEmail] = React.useState("")
  const [sending, setSending] = React.useState(false)

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setSending(true)
    try {
      await sendPasswordResetEmail(auth, email.trim())
      toast({ title: t('resetEmailSent'), description: t('resetEmailSentDesc') })
      onOpenChange(false)
      setEmail("")
    } catch {
      toast({ title: t('resetEmailSent'), description: t('resetEmailSentDesc') })
      onOpenChange(false)
      setEmail("")
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('forgotPasswordTitle')}</DialogTitle>
          <DialogDescription>{t('forgotPasswordDesc')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSend} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-email">{t('email')}</Label>
            <Input id="reset-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <Button type="submit" className="w-full" disabled={sending}>
            {sending ? t('sendingEmail') : t('sendResetEmail')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

Note: The catch block intentionally shows the same success message even on error (e.g., email not found). This prevents email enumeration attacks.

- [ ] **Step 2: Commit**

```bash
git add components/forgot-password-dialog.tsx
git commit -m "feat: add forgot password dialog component"
```

---

### Task 5: Update Settings Page

**Files:**
- Modify: `app/[locale]/app/settings/page.tsx`

- [ ] **Step 1: Rewrite the settings page**

The current page is read-only (69 lines). Rewrite it to add profile editing and change password section. Read the current file first, then replace its entire content with:

```typescript
"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslations } from '@/hooks/use-translations'
import { useLocale } from 'next-intl'
import { useAuth } from "@/components/auth-provider"
import { db, auth, updateProfile } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useTheme } from "next-themes"
import { ThemeSwitch } from "@/components/theme-switch"
import { ChangePasswordForm } from "@/components/change-password-form"
import { useToast } from "@/hooks/use-toast"
import { IconEdit } from "@tabler/icons-react"

export default function SettingsPage() {
  const t = useTranslations('settings')
  const tAuth = useTranslations('auth')
  const { user } = useAuth()
  const { toast } = useToast()
  const locale = useLocale()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [joined, setJoined] = useState("")
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      setEmail(user.email ?? "")
      const ref = doc(db, 'users', user.uid)
      const snap = await getDoc(ref)
      const data = snap.data() as any
      const displayName = data?.displayName ?? user.displayName ?? ""
      setName(displayName)
      setEditName(displayName)
      const ts = data?.createdAt
      let d: Date | null = null
      if (ts?.toDate) d = ts.toDate(); else if (ts?.seconds) d = new Date(ts.seconds * 1000); else if (ts) d = new Date(ts)
      setJoined(d ? d.toLocaleDateString(locale) : "—")
    })()
  }, [user, locale])

  async function handleSaveProfile() {
    if (!user || !editName.trim()) return
    setSaving(true)
    try {
      const trimmedName = editName.trim()
      // Update Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: trimmedName })
      }
      // Update Firestore user doc
      const ref = doc(db, 'users', user.uid)
      await updateDoc(ref, { displayName: trimmedName })
      setName(trimmedName)
      setEditing(false)
      toast({ title: t('profileUpdated') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">{t('overview')}</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('profile')}</h2>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => { setEditName(name); setEditing(true) }}>
              <IconEdit className="h-4 w-4 mr-2" />
              {t('editProfile')}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">{tAuth('email')}</p>
            <p className="font-medium break-all">{email || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('joined')}</p>
            <p className="font-medium">{joined}</p>
          </div>
          <div>
            {editing ? (
              <div className="space-y-2">
                <Label htmlFor="edit-display-name">{t('displayName')}</Label>
                <div className="flex gap-2">
                  <Input id="edit-display-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <Button size="sm" onClick={handleSaveProfile} disabled={saving}>{t('profileUpdated', { default: 'Save' }).split(' ')[0]}</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)}>✕</Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground">{t('displayName')}</p>
                <p className="font-medium">{name || '—'}</p>
              </>
            )}
          </div>
          <div>
            <ThemeSwitch />
          </div>
        </div>
      </Card>

      <ChangePasswordForm />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add app/[locale]/app/settings/page.tsx
git commit -m "feat: add profile editing and change password to settings page"
```

---

### Task 6: Add Forgot Password to Sign-In Page

**Files:**
- Modify: `app/[locale]/auth/sign-in/page.tsx`

- [ ] **Step 1: Add imports and state**

Add import at top:
```typescript
import { ForgotPasswordDialog } from "@/components/forgot-password-dialog"
```

Add state inside the component:
```typescript
const [forgotOpen, setForgotOpen] = useState(false)
```

- [ ] **Step 2: Add forgot password link**

After the password input field and before the submit button, add:
```tsx
<div className="flex justify-end">
  <button
    type="button"
    className="text-sm text-primary hover:underline"
    onClick={() => setForgotOpen(true)}
  >
    {tAuth('forgotPassword')}
  </button>
</div>
```

The `forgotPassword` i18n key already exists: "¿Olvidaste tu contraseña?" / "Forgot your password?"

- [ ] **Step 3: Add dialog before closing Card**

Before the closing `</Card>` tag, add:
```tsx
<ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />
```

- [ ] **Step 4: Commit**

```bash
git add app/[locale]/auth/sign-in/page.tsx
git commit -m "feat: add forgot password dialog to sign-in page"
```

---

## Summary — Task Dependency Graph

```
Task 1 (i18n) → Task 2 (firebase exports) → these are independent:
  Task 3 (change password form) | Task 4 (forgot password dialog)

After Tasks 3-4:
  Task 5 (settings page) — depends on Task 3
  Task 6 (sign-in page) — depends on Task 4
```

Tasks 5 and 6 can run in parallel.
