"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { IconPlus } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"
import { db } from "@/lib/firebase"
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  doc as docRef,
  increment,
} from "firebase/firestore"

export function NewSubscriptionDialog() {
  const tSubs = useTranslations('subscriptions')
  const tCust = useTranslations('customers')
  const tCommon = useTranslations('common')
  const { toast } = useToast()
  const { user } = useAuth()

  const [open, setOpen] = React.useState(false)
  const [mode, setMode] = React.useState<'existing' | 'new'>('existing')

  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string>("")
  const [customers, setCustomers] = React.useState<Array<{ id: string; name: string; email: string }>>([])
  const [loadingCustomers, setLoadingCustomers] = React.useState(false)
  const [newCustomerName, setNewCustomerName] = React.useState("")
  const [newCustomerEmail, setNewCustomerEmail] = React.useState("")

  const [plan, setPlan] = React.useState("")
  const [price, setPrice] = React.useState<string>("")
  const [billing, setBilling] = React.useState<'monthly' | 'yearly' | ''>('')
  const [nextChargeDate, setNextChargeDate] = React.useState<Date | null>(null)
  const [userEditedDate, setUserEditedDate] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  // Default next charge date: 1st day of upcoming month
  const computeDefaultMonthly = React.useCallback(() => {
    const now = new Date()
    const firstThisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const firstNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return now.getDate() === 1 ? firstThisMonth : firstNextMonth
  }, [])

  React.useEffect(() => {
    if (!open) return
    setUserEditedDate(false)
    setNextChargeDate(computeDefaultMonthly())
  }, [open, computeDefaultMonthly])

  // Adjust default suggested date when switching billing cycle
  React.useEffect(() => {
    if (!open || userEditedDate) return
    const monthlyBase = computeDefaultMonthly()
    if (billing === 'yearly') {
      const target = new Date(monthlyBase)
      target.setFullYear(target.getFullYear() + 1)
      if (!nextChargeDate || target.getTime() !== nextChargeDate.getTime()) {
        setNextChargeDate(target)
      }
    } else if (billing === 'monthly') {
      if (!nextChargeDate || monthlyBase.getTime() !== nextChargeDate.getTime()) {
        setNextChargeDate(monthlyBase)
      }
    }
  }, [billing, open, userEditedDate, nextChargeDate, computeDefaultMonthly])

  // Load customers when dialog opens (users/{uid}/customers)
  React.useEffect(() => {
    if (!open || !user) return
    setLoadingCustomers(true)
    ;(async () => {
      try {
        const q = query(
          collection(db, 'users', user.uid, 'customers'),
          orderBy('createdAt', 'desc')
        )
        const snap = await getDocs(q)
        const list: Array<{ id: string; name: string; email: string }> = []
        snap.forEach((d) => {
          const data = d.data() as any
          list.push({ id: d.id, name: data.name ?? '', email: data.email ?? '' })
        })
        setCustomers(list)
      } catch (err) {
        console.error(err)
      } finally {
        setLoadingCustomers(false)
      }
    })()
  }, [open, user])

  const handleSave = async () => {
    if (mode === 'existing' && !selectedCustomerId) return
    if (mode === 'new' && (!newCustomerName || !newCustomerEmail)) return
    if (!plan || !price || !billing) return
    if (!user) return
    setSaving(true)
    try {
      const toTitleCase = (s: string) =>
        s
          .replace(/\s+/g, ' ')
          .trim()
          .split(' ')
          .filter(Boolean)
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ')

      // Create customer if needed under users/{uid}/customers
      let customerId = selectedCustomerId
      if (mode === 'new') {
        const cleanedName = toTitleCase(newCustomerName)
        const cleanedEmail = newCustomerEmail.trim()
        const newCust = await addDoc(collection(db, 'users', user.uid, 'customers'), {
          name: cleanedName,
          email: cleanedEmail,
          createdAt: serverTimestamp(),
          subscriptions: 0,
          totalValue: 0,
        })
        customerId = newCust.id
      }

      // Create subscription under users/{uid}/subscriptions
      const priceNumber = Number(price)
      await addDoc(collection(db, 'users', user.uid, 'subscriptions'), {
        customerId,
        plan,
        price: priceNumber,
        billingCycle: billing,
        status: 'authorized',
        createdAt: serverTimestamp(),
        nextPayment: nextChargeDate ?? null,
        lastPayment: null,
      })

      // Update customer counters: subscriptions +1 and totalValue (MRR)
      const monthlyValue = billing === 'yearly' ? priceNumber / 12 : priceNumber
      await updateDoc(docRef(db, 'users', user.uid, 'customers', customerId), {
        subscriptions: increment(1),
        totalValue: increment(Number(monthlyValue.toFixed(2))),
      })

      toast({ title: tSubs('createdTitle', { default: 'Subscription created' }), description: tSubs('createdDesc', { default: 'The subscription was created successfully' }) })
      setOpen(false)
      // Reset sencillo
      setSelectedCustomerId("")
      setNewCustomerName("")
      setNewCustomerEmail("")
      setPlan("")
      setPrice("")
      setBilling('')
      setNextChargeDate(null)
      setMode('existing')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <IconPlus className="h-4 w-4 mr-2" />
          {tSubs('addSubscription')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tSubs('addSubscription')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="p-4 space-y-4">
            <div className="inline-flex items-center gap-4 rounded-md border p-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="mode"
                  value="existing"
                  checked={mode === 'existing'}
                  onChange={() => setMode('existing')}
                  className="h-4 w-4"
                />
                {tSubs('existingCustomer')}
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input
                  type="radio"
                  name="mode"
                  value="new"
                  checked={mode === 'new'}
                  onChange={() => setMode('new')}
                  className="h-4 w-4"
                />
                {tSubs('createNewCustomer')}
              </label>
            </div>

            {mode === 'existing' ? (
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">{tCust('title')}</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={loadingCustomers ? '...' : tSubs('selectCustomer')} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name} ({c.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cust-name">{tCust('customerName')}</Label>
                  <Input id="cust-name" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder={tCust('customerName')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cust-email">{tCust('email')}</Label>
                  <Input id="cust-email" type="email" value={newCustomerEmail} onChange={(e) => setNewCustomerEmail(e.target.value)} placeholder="name@company.com" />
                </div>
              </div>
            )}
          </Card>

          <Card className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plan">{tSubs('subscriptionName')}</Label>
              <Input id="plan" value={plan} onChange={(e) => setPlan(e.target.value)} placeholder={tSubs('subscriptionName')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">{tSubs('price')}</Label>
              <Input id="price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing">{tSubs('billingCycle')}</Label>
              <Select value={billing} onValueChange={(v: any) => setBilling(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={tSubs('billingCycle')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{tSubs('monthly')}</SelectItem>
                  <SelectItem value="yearly">{tSubs('yearly')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-3">
              <Label>{tSubs('chargeDate', { default: 'Charge date' })}</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start w-full">
                    {nextChargeDate ? nextChargeDate.toLocaleDateString() : tSubs('selectDate', { default: 'Select date' })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" side="bottom" avoidCollisions={false} className="p-2 w-[320px]">
                  <Calendar
                    className="w-full"
                    mode="single"
                    selected={nextChargeDate ?? undefined}
                    onSelect={(d: any) => { setUserEditedDate(true); setNextChargeDate(d ?? null) }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </Card>
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>{tCommon('cancel')}</Button>
          <Button onClick={handleSave} disabled={saving}>{tCommon('save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


