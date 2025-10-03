"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { useAuth } from "@/components/auth-provider"
import { db } from "@/lib/firebase"
import { doc, updateDoc, increment } from "firebase/firestore"

type RowStatus = "authorized" | "paused" | "cancelled" | "pending"

export type EditableSubscription = {
  id: string
  customerId: string
  plan: string
  price: number
  billingCycle: string
  status: RowStatus
  nextPayment?: string | null
}

export function EditSubscriptionDialog({ row, open, onOpenChange, onSaved }: {
  row: EditableSubscription | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onSaved?: (updated: Partial<EditableSubscription>) => void
}) {
  const t = useTranslations('subscriptions')
  const tCommon = useTranslations('common')
  const { user } = useAuth()

  const [plan, setPlan] = React.useState("")
  const [price, setPrice] = React.useState<string>("")
  const [billing, setBilling] = React.useState<'monthly' | 'yearly' | ''>('')
  const [nextChargeDate, setNextChargeDate] = React.useState<Date | null>(null)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (!open || !row) return
    setPlan(row.plan)
    setPrice(String(row.price ?? ''))
    setBilling((row.billingCycle as any) || '')
    setNextChargeDate(row.nextPayment ? new Date(row.nextPayment) : null)
  }, [open, row])

  async function handleSave() {
    if (!user || !row) return
    setSaving(true)
    try {
      const oldMonthly = row.billingCycle === 'yearly' ? row.price / 12 : row.price
      const newPrice = Number(price)
      const newMonthly = (billing === 'yearly' ? newPrice / 12 : newPrice)
      const delta = Number((newMonthly - oldMonthly).toFixed(2))

      const subRef = doc(db, 'users', user.uid, 'subscriptions', row.id)
      await updateDoc(subRef, {
        plan: plan || row.plan,
        price: newPrice,
        billingCycle: billing || row.billingCycle,
        nextPayment: nextChargeDate ?? null,
      })
      if (row.customerId && delta !== 0) {
        const custRef = doc(db, 'users', user.uid, 'customers', row.customerId)
        await updateDoc(custRef, { totalValue: increment(delta) })
      }
      onSaved?.({ plan, price: newPrice, billingCycle: billing, nextPayment: nextChargeDate?.toISOString() ?? null })
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('edit', { default: 'Edit Subscription' })}</DialogTitle>
        </DialogHeader>
        <Card className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="plan">{t('subscriptionName')}</Label>
            <Input id="plan" value={plan} onChange={(e)=>setPlan(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">{t('price')}</Label>
            <Input id="price" type="number" min="0" step="0.01" value={price} onChange={(e)=>setPrice(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billing">{t('billingCycle')}</Label>
            <Select value={billing} onValueChange={(v:any)=>setBilling(v)}>
              <SelectTrigger><SelectValue placeholder={t('billingCycle')} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">{t('monthly')}</SelectItem>
                <SelectItem value="yearly">{t('yearly')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-3">
            <Label>{t('chargeDate', { default: 'Charge date' })}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start w-full">{nextChargeDate ? nextChargeDate.toLocaleDateString() : t('selectDate', { default: 'Select date' })}</Button>
              </PopoverTrigger>
              <PopoverContent align="start" side="bottom" avoidCollisions={false} className="p-2 w-[320px]">
                <Calendar className="w-full" mode="single" selected={nextChargeDate ?? undefined} onSelect={(d:any)=>setNextChargeDate(d ?? null)} />
              </PopoverContent>
            </Popover>
          </div>
        </Card>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={()=>onOpenChange(false)}>{tCommon('cancel')}</Button>
          <Button onClick={handleSave} disabled={saving}>{tCommon('save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


