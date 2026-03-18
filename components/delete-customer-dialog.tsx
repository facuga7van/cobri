"use client"

import * as React from "react"
import { useTranslations } from "@/hooks/use-translations"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useAuth } from "@/components/auth-provider"
import { db } from "@/lib/firebase"
import { collection, query, where, getDocs, writeBatch, doc } from "firebase/firestore"

export function DeleteCustomerDialog({ customer, open, onOpenChange, onDeleted }: {
  customer: { id: string; name: string } | null
  open: boolean
  onOpenChange: (v: boolean) => void
  onDeleted?: () => void
}) {
  const t = useTranslations('customers')
  const tCommon = useTranslations('common')
  const { user } = useAuth()

  const [activeSubs, setActiveSubs] = React.useState<Array<{ id: string; price: number; billingCycle: string }>>([])
  const [loadingSubs, setLoadingSubs] = React.useState(false)
  const [deleting, setDeleting] = React.useState(false)

  React.useEffect(() => {
    if (!open || !customer || !user) {
      setActiveSubs([])
      return
    }
    setLoadingSubs(true)
    ;(async () => {
      try {
        const q = query(
          collection(db, 'users', user.uid, 'subscriptions'),
          where('customerId', '==', customer.id),
          where('status', '==', 'authorized')
        )
        const snap = await getDocs(q)
        const list: Array<{ id: string; price: number; billingCycle: string }> = []
        snap.forEach((d) => {
          const data = d.data() as any
          list.push({
            id: d.id,
            price: typeof data.price === 'number' ? data.price : 0,
            billingCycle: data.billingCycle ?? 'monthly',
          })
        })
        setActiveSubs(list)
      } finally {
        setLoadingSubs(false)
      }
    })()
  }, [open, customer, user])

  async function handleDelete() {
    if (!user || !customer) return
    setDeleting(true)
    try {
      const batch = writeBatch(db)

      // Cancel all active subscriptions
      for (const sub of activeSubs) {
        const subRef = doc(db, 'users', user.uid, 'subscriptions', sub.id)
        batch.update(subRef, { status: 'cancelled' })
      }

      // Delete customer
      const custRef = doc(db, 'users', user.uid, 'customers', customer.id)
      batch.delete(custRef)

      await batch.commit()
      onDeleted?.()
    } finally {
      setDeleting(false)
    }
  }

  const hasActiveSubs = activeSubs.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('deleteCustomer')}</DialogTitle>
          <DialogDescription>
            {loadingSubs
              ? tCommon('loading')
              : hasActiveSubs
                ? t('confirmDeleteWithSubs', { count: activeSubs.length })
                : t('confirmDelete')
            }
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {hasActiveSubs ? t('goBack') : tCommon('cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || loadingSubs}
          >
            {hasActiveSubs ? t('cancelAllAndDelete') : tCommon('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
