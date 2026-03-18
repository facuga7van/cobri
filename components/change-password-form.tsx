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
