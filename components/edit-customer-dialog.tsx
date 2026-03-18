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
