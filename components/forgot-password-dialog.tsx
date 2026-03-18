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
