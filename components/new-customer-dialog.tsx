"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { IconPlus } from "@tabler/icons-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { db } from "@/lib/firebase"
import { addDoc, collection, serverTimestamp } from "firebase/firestore"

export function NewCustomerDialog() {
  const t = useTranslations('customers')
  const tCommon = useTranslations('common')
  const { toast } = useToast()
  const { user } = useAuth()

  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  const toTitleCase = React.useCallback((s: string) =>
    s.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), [] )

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!user) return
    const cleanedName = toTitleCase(name)
    const cleanedEmail = email.trim()
    if (!cleanedName || !cleanedEmail) return
    setSaving(true)
    try {
      await addDoc(collection(db, 'users', user.uid, 'customers'), {
        name: cleanedName,
        email: cleanedEmail,
        createdAt: serverTimestamp(),
        subscriptions: 0,
        totalValue: 0,
      })
      toast({ title: t('customerCreated', { default: 'Customer created' }) })
      setOpen(false)
      setName("")
      setEmail("")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconPlus className="h-4 w-4 mr-2" />
          {t('addCustomer')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('addCustomer')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSave} className="contents">
          <Card className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cust-name">{t('customerName')}</Label>
              <Input id="cust-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('customerName')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cust-email">{t('email')}</Label>
              <Input id="cust-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
            </div>
          </Card>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>{tCommon('cancel')}</Button>
            <Button type="submit" disabled={saving}>{tCommon('save')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}


