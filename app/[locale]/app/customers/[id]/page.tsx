"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useLocale } from "next-intl"
import { useTranslations } from '@/hooks/use-translations';
import { useAuth } from "@/components/auth-provider"
import { db } from "@/lib/firebase"
import { doc, getDoc, collection, query, where, onSnapshot, orderBy, getDocs } from "firebase/firestore"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { IconArrowLeft, IconEdit, IconTrash } from "@tabler/icons-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { EditCustomerDialog } from "@/components/edit-customer-dialog"
import { DeleteCustomerDialog } from "@/components/delete-customer-dialog"
import { PaymentHistoryTable, PaymentRecord } from "@/components/payment-history-table"

type RowStatus = "authorized" | "paused" | "cancelled" | "pending"

export default function CustomerDetailPage({ params }: { params: { id: string, locale: string } }) {
  const { user } = useAuth()
  const tCust = useTranslations('customers')
  const tSubs = useTranslations('subscriptions')
  const tCommon = useTranslations('common')
  const locale = useLocale()

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [customer, setCustomer] = useState<{ name: string; email: string; phone?: string; notes?: string } | null>(null)
  const [subs, setSubs] = useState<Array<{
    id: string
    plan: string
    price: number
    billingCycle: string
    status: RowStatus
    lastPayment?: string | null
    nextPayment?: string | null
  }>>([])

  const { toast } = useToast()
  const router = useRouter()

  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loadingPayments, setLoadingPayments] = useState(true)

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
      setCustomer({ name: data.name ?? '', email: data.email ?? '', phone: data.phone ?? undefined, notes: data.notes ?? undefined })
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

  const subIds = useMemo(() => subs.map(s => s.id).join(','), [subs])

  // Fetch consolidated payments from all customer subscriptions
  useEffect(() => {
    if (!user || subs.length === 0) {
      setPayments([])
      setLoadingPayments(false)
      return
    }
    setLoadingPayments(true)
    ;(async () => {
      try {
        const allPayments: PaymentRecord[] = []
        for (const sub of subs) {
          const paymentsSnap = await getDocs(
            query(
              collection(db, 'users', user.uid, 'subscriptions', sub.id, 'payments'),
              orderBy('date', 'desc')
            )
          )
          paymentsSnap.forEach((d) => {
            const data = d.data() as any
            // Normalize: webhook uses `date`, manual uses `paidAt`
            const rawDate = data.date ?? data.paidAt
            let date: Date
            if (rawDate?.toDate) date = rawDate.toDate()
            else if (rawDate?.seconds) date = new Date(rawDate.seconds * 1000)
            else date = new Date(rawDate)

            allPayments.push({
              id: d.id,
              date,
              amount: data.amount ?? 0,
              source: data.source ?? 'manual',
              mercadopagoId: data.mercadopagoId,
              subscriptionPlan: sub.plan,
            })
          })
        }
        // Sort all payments by date descending
        allPayments.sort((a, b) => {
          const da = a.date instanceof Date ? a.date.getTime() : new Date(a.date).getTime()
          const db2 = b.date instanceof Date ? b.date.getTime() : new Date(b.date).getTime()
          return db2 - da
        })
        setPayments(allPayments)
      } finally {
        setLoadingPayments(false)
      }
    })()
  }, [user, subIds])

  if (loading) return <div className="p-6 text-sm text-muted-foreground">{tCommon('loading')}</div>
  if (notFound || !customer) return <div className="p-6 text-sm text-muted-foreground">{tCust('notFound', { default: 'Customer not found' })}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-col sm:flex-row">
        <Link href={`/${locale}/app/customers`}>
          <Button variant="ghost" size="sm">
            <IconArrowLeft className="h-4 w-4 mr-2" />
            {tCommon('back')}
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">{customer.name}</h1>
          <p className="text-muted-foreground break-all">{customer.email}</p>
          {customer.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
          {customer.notes && <p className="text-sm text-muted-foreground mt-1 italic">{customer.notes}</p>}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <IconEdit className="h-4 w-4 mr-2" />
            {tCommon('edit')}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setDeleteOpen(true)}>
            <IconTrash className="h-4 w-4 mr-2" />
            {tCommon('delete')}
          </Button>
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
                  <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-muted-foreground">{tSubs('tablePlan')}</th>
                  <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-muted-foreground">{tSubs('status')}</th>
                  <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-muted-foreground hidden sm:table-cell">{tSubs('lastPayment')}</th>
                  <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-muted-foreground hidden sm:table-cell">{tSubs('nextPayment')}</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-3 md:p-4">
                      <div>
                        <p className="font-medium">{s.plan}</p>
                        <p className="text-sm text-muted-foreground">${s.price}/{s.billingCycle === 'yearly' ? 'yr' : 'mo'}</p>
                      </div>
                    </td>
                    <td className="p-3 md:p-4"><StatusBadge status={s.status} /></td>
                    <td className="p-3 md:p-4 text-sm hidden sm:table-cell">{s.lastPayment ?? '—'}</td>
                    <td className="p-3 md:p-4 text-sm hidden sm:table-cell">{s.nextPayment ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <PaymentHistoryTable
        payments={payments}
        showSubscriptionColumn={true}
        loading={loadingPayments}
      />

      <EditCustomerDialog
        customer={customer ? { id: params.id, ...customer } : null}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={(updated) => {
          setCustomer((prev) => prev ? { ...prev, ...updated } : prev)
          toast({ title: tCust('customerUpdated') })
        }}
      />

      <DeleteCustomerDialog
        customer={customer ? { id: params.id, name: customer.name } : null}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onDeleted={() => {
          toast({ title: tCust('customerDeleted') })
          router.push(`/${locale}/app/customers`)
        }}
      />
    </div>
  )
}


