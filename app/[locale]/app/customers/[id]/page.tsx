"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useLocale } from "next-intl"
import { useTranslations } from "next-intl"
import { useAuth } from "@/components/auth-provider"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, onSnapshot, orderBy } from "firebase/firestore"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { IconArrowLeft } from "@tabler/icons-react"

type RowStatus = "authorized" | "paused" | "cancelled" | "pending"

export default function CustomerDetailPage({ params }: { params: { id: string, locale: string } }) {
  const { user } = useAuth()
  const tCust = useTranslations('customers')
  const tSubs = useTranslations('subscriptions')
  const tCommon = useTranslations('common')
  const locale = useLocale()

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [customer, setCustomer] = useState<{ name: string; email: string } | null>(null)
  const [subs, setSubs] = useState<Array<{
    id: string
    plan: string
    price: number
    billingCycle: string
    status: RowStatus
    lastPayment?: string | null
    nextPayment?: string | null
  }>>([])

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const ref = doc(db, 'users', user.uid, 'customers', params.id)
      const snap = await getDoc(ref)
      if (!snap.exists()) {
        setNotFound(true)
        setLoading(false)
        return
      }
      const data = snap.data() as any
      setCustomer({ name: data.name ?? '', email: data.email ?? '' })
      setLoading(false)
    })()
  }, [user, params.id])

  useEffect(() => {
    if (!user) return
    const fmt = (v: any) => {
      if (!v) return null
      if (typeof v?.toDate === 'function') { const d = v.toDate(); return isNaN(d.getTime()) ? null : d.toLocaleDateString() }
      if (typeof v?.seconds === 'number') { const d = new Date(v.seconds * 1000); return isNaN(d.getTime()) ? null : d.toLocaleDateString() }
      const d = new Date(v); return isNaN(d.getTime()) ? null : d.toLocaleDateString()
    }
    const q = query(
      collection(db, 'users', user.uid, 'subscriptions'),
      where('customerId', '==', params.id)
    )
    const unsub = onSnapshot(q, (snap) => {
      const list: Array<any> = []
      snap.forEach((d) => {
        const s = d.data() as any
        list.push({
          id: d.id,
          plan: s.plan ?? '',
          price: typeof s.price === 'number' ? s.price : Number(s.price ?? 0),
          billingCycle: s.billingCycle ?? 'monthly',
          status: (['authorized','paused','cancelled','pending'].includes(s.status) ? s.status : 'authorized') as RowStatus,
          lastPayment: fmt(s.lastPayment),
          nextPayment: fmt(s.nextPayment),
        })
      })
      setSubs(list)
    })
    return () => unsub()
  }, [user, params.id])

  if (loading) return <div className="p-6 text-sm text-muted-foreground">{tCommon('loading')}</div>
  if (notFound || !customer) return <div className="p-6 text-sm text-muted-foreground">{tCust('notFound', { default: 'Customer not found' })}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/customers`}>
          <Button variant="ghost" size="sm">
            <IconArrowLeft className="h-4 w-4 mr-2" />
            {tCommon('back')}
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">{customer.name}</h1>
          <p className="text-muted-foreground">{customer.email}</p>
        </div>
      </div>

      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-3">{tSubs('title')}</h2>
        {subs.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tSubs('noSubscriptions', { default: 'No subscriptions yet' })}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">{tSubs('tablePlan')}</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">{tSubs('status')}</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">{tSubs('lastPayment')}</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">{tSubs('nextPayment')}</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{s.plan}</p>
                        <p className="text-sm text-muted-foreground">${s.price}/{s.billingCycle === 'yearly' ? 'yr' : 'mo'}</p>
                      </div>
                    </td>
                    <td className="p-4"><StatusBadge status={s.status} /></td>
                    <td className="p-4 text-sm">{s.lastPayment ?? '—'}</td>
                    <td className="p-4 text-sm">{s.nextPayment ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}


