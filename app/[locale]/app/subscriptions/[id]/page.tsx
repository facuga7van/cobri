"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { IconArrowLeft, IconMail, IconCalendar } from "@tabler/icons-react"
import { useAuth } from "@/components/auth-provider"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, addDoc, collection, serverTimestamp } from "firebase/firestore"
import { useTranslations } from "next-intl"
import { useToast } from "@/hooks/use-toast"

type RowStatus = "authorized" | "paused" | "cancelled" | "pending"

export default function SubscriptionDetailPage({ params }: { params: { id: string, locale: string } }) {
  const { user } = useAuth()
  const t = useTranslations('subscriptions')
  const tCommon = useTranslations('common')
  const tCust = useTranslations('customers')
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [sub, setSub] = useState<{
    id: string
    customerId: string
    customerName: string
    email: string
    plan: string
    price: number
    billingCycle: string
    status: RowStatus
    nextPayment?: string | null
    lastPayment?: string | null
  } | null>(null)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      try {
        const subRef = doc(db, 'users', user.uid, 'subscriptions', params.id)
        const subSnap = await getDoc(subRef)
        if (!subSnap.exists()) {
          setNotFound(true)
          setLoading(false)
          return
        }
        const s = subSnap.data() as any
        const custId = s.customerId as string
        let customerName = '—'
        let email = '—'
        if (custId) {
          const custRef = doc(db, 'users', user.uid, 'customers', custId)
          const custSnap = await getDoc(custRef)
          const c = custSnap.data() as any
          customerName = c?.name ?? '—'
          email = c?.email ?? '—'
        }
        setSub({
          id: subSnap.id,
          customerId: custId,
          customerName,
          email,
          plan: s.plan ?? '',
          price: typeof s.price === 'number' ? s.price : Number(s.price ?? 0),
          billingCycle: s.billingCycle ?? 'monthly',
          status: (['authorized','paused','cancelled','pending'].includes(s.status) ? s.status : 'authorized') as RowStatus,
          nextPayment: s.nextPayment ?? null,
          lastPayment: s.lastPayment ?? null,
        })
      } finally {
        setLoading(false)
      }
    })()
  }, [user, params.id])

  if (loading) return <div className="p-6 text-sm text-muted-foreground">{tCommon('loading')}</div>
  if (notFound || !sub) return <div className="p-6 text-sm text-muted-foreground">{t('notFound', { default: 'Subscription not found' })}</div>

  async function handleMarkPaid() {
    if (!user) return
    const subRef = doc(db, 'users', user.uid, 'subscriptions', params.id)
    const snap = await getDoc(subRef)
    if (!snap.exists()) return
    const data: any = snap.data()
    const billing: string = data.billingCycle ?? 'monthly'
    let baseDate: Date
    if (data.nextPayment?.toDate) {
      baseDate = data.nextPayment.toDate()
    } else if (data.nextPayment?.seconds) {
      baseDate = new Date(data.nextPayment.seconds * 1000)
    } else if (data.nextPayment) {
      baseDate = new Date(data.nextPayment)
    } else {
      baseDate = new Date()
    }
    let newNext = new Date(baseDate)
    if (billing === 'yearly') {
      newNext.setFullYear(newNext.getFullYear() + 1)
    } else {
      newNext.setMonth(newNext.getMonth() + 1)
    }

    await addDoc(collection(db, 'users', user.uid, 'subscriptions', params.id, 'payments'), {
      paidAt: serverTimestamp(),
      amount: data.price ?? null,
      coveredUntil: baseDate,
    })
    await updateDoc(subRef, {
      lastPayment: serverTimestamp(),
      nextPayment: newNext,
    })
    toast({ title: t('paidSaved', { default: 'Payment recorded' }) })
    // Local refresh
    setSub((prev) => prev ? { ...prev, lastPayment: new Date().toLocaleDateString(), nextPayment: newNext.toLocaleDateString() } : prev)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-col sm:flex-row">
        <Link href={`/${params.locale}/subscriptions`}>
          <Button variant="ghost" size="sm">
            <IconArrowLeft className="h-4 w-4 mr-2" />
            {tCommon('back')}
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{sub.customerName}</h1>
          <p className="text-muted-foreground break-all">{sub.email}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">{t('customerInfo', { default: 'Customer Information' })}</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <IconMail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{tCust('email')}</p>
                <p className="font-medium">{sub.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <IconCalendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">{t('nextPayment')}</p>
                <p className="font-medium">{sub.nextPayment ? String(new Date(sub.nextPayment as any).toLocaleDateString()) : '—'}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{t('subscriptionDetails', { default: 'Subscription Details' })}</h2>
            <Button size="sm" onClick={handleMarkPaid}>{t('markPaid', { default: 'Mark as Paid' })}</Button>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">{t('subscriptionName')}</p>
              <p className="font-medium">{sub.plan}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('price')}</p>
              <p className="font-medium">${sub.price}/{sub.billingCycle === 'yearly' ? 'yr' : 'mo'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('status')}</p>
              <div className="mt-1">
                <StatusBadge status={sub.status} />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
