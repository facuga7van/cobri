"use client"

import { useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import { useLocale, useTranslations } from "next-intl"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/status-badge"
import { IconSearch, IconPlus, IconChevronRight, IconDownload } from "@tabler/icons-react"
import { downloadCsv } from "@/lib/csv-utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/components/auth-provider"
import { db } from "@/lib/firebase"
import { collection, getDocs, onSnapshot, orderBy, query } from "firebase/firestore"
import { useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { doc, updateDoc, addDoc, serverTimestamp, deleteDoc } from "firebase/firestore"
import { type EditableSubscription } from "@/components/edit-subscription-dialog"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"

// Lazy load heavy dialogs (only load when needed)
const NewSubscriptionDialog = dynamic(() => import("@/components/new-subscription-dialog").then(mod => ({ default: mod.NewSubscriptionDialog })), {
  ssr: false
})

const EditSubscriptionDialog = dynamic(() => import("@/components/edit-subscription-dialog").then(mod => ({ default: mod.EditSubscriptionDialog })), {
  ssr: false
})

export default function SubscriptionsPage() {
  const locale = useLocale()
  const t = useTranslations('subscriptions')
  const tCommon = useTranslations('common')
  const { user } = useAuth()
  const router = useRouter()
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  type RowStatus = "authorized" | "paused" | "cancelled" | "pending"
  const [rows, setRows] = useState<Array<{
    id: string
    customerId?: string
    customerName: string
    email: string
    plan: string
    price: number
    billingCycle: string
    status: RowStatus
    lastPayment?: string | null
    nextPayment?: string | null
    lastPaymentRaw?: Date | null
    nextPaymentRaw?: Date | null
  }>>([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [editRow, setEditRow] = useState<EditableSubscription | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const customerMap = new Map<string, { name: string; email: string }>()

    const unsubCustomers = onSnapshot(collection(db, 'users', user.uid, 'customers'), (snap) => {
      customerMap.clear()
      snap.forEach((d) => {
        const data = d.data() as any
        customerMap.set(d.id, { name: data.name ?? '', email: data.email ?? '' })
      })
    })

    const subsQ = query(collection(db, 'users', user.uid, 'subscriptions'), orderBy('createdAt', 'desc'))
    const unsubSubs = onSnapshot(subsQ, (snap) => {
      setLoading(false)
      const list: Array<any> = []
      const parseDate = (v: any): Date | null => {
        if (!v) return null
        if (typeof v?.toDate === 'function') {
          const d = v.toDate(); return isNaN(d.getTime()) ? null : d
        }
        if (typeof v?.seconds === 'number') {
          const d = new Date(v.seconds * 1000); return isNaN(d.getTime()) ? null : d
        }
        const d = new Date(v); return isNaN(d.getTime()) ? null : d
      }
      const formatDate = (d: Date | null) => (d ? d.toLocaleDateString() : null)
      snap.forEach((d) => {
        const s = d.data() as any
        const cust = customerMap.get(s.customerId ?? '')
        const lastPaymentDate = parseDate(s.lastPayment)
        const nextPaymentDate = parseDate(s.nextPayment)
        list.push({
          id: d.id,
          customerId: s.customerId ?? undefined,
          customerName: cust?.name ?? '—',
          email: cust?.email ?? '—',
          plan: s.plan ?? '',
          price: typeof s.price === 'number' ? s.price : Number(s.price ?? 0),
          billingCycle: s.billingCycle ?? 'monthly',
          status: (['authorized','paused','cancelled','pending'].includes(s.status) ? s.status : 'authorized') as RowStatus,
          lastPaymentRaw: lastPaymentDate,
          nextPaymentRaw: nextPaymentDate,
          lastPayment: formatDate(lastPaymentDate),
          nextPayment: formatDate(nextPaymentDate),
        })
      })
      setRows(list)
    })

    return () => { unsubCustomers(); unsubSubs() }
  }, [user])

  const filteredSubscriptions = useMemo(() => {
    const term = search.toLowerCase()
    return rows.filter((sub) => {
      const matchesSearch = sub.customerName.toLowerCase().includes(term) || sub.email.toLowerCase().includes(term)
      const matchesStatus = statusFilter === 'all' || sub.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [rows, search, statusFilter])

  function handleExportCsv() {
    const csvData = rows.map(s => ({
      Customer: s.customerName ?? "—",
      Plan: s.plan,
      Price: s.price,
      "Billing Cycle": s.billingCycle,
      Status: s.status,
      "Next Payment": s.nextPayment ?? "—",
      "Last Payment": s.lastPayment ?? "—",
    }))
    downloadCsv(csvData, "cobri-subscriptions")
  }

  async function handleMarkPaid(row: typeof rows[number]) {
    if (!user) return
    const subRef = doc(db, 'users', user.uid, 'subscriptions', row.id)
    // Calculate new next payment from current nextPayment or today
    const now = new Date()
    const base = row.nextPaymentRaw ?? now
    const next = new Date(base)
    if (row.billingCycle === 'yearly') {
      next.setFullYear(next.getFullYear() + 1)
    } else {
      next.setMonth(next.getMonth() + 1)
    }
    await addDoc(collection(db, 'users', user.uid, 'subscriptions', row.id, 'payments'), {
      paidAt: serverTimestamp(),
      amount: row.price ?? null,
      coveredUntil: base,
    })
    await updateDoc(subRef, {
      lastPayment: serverTimestamp(),
      nextPayment: next,
    })
    // Optimistic UI update
    const lastPaymentDate = new Date()
    setRows((prev) => prev.map((r) => r.id === row.id ? {
      ...r,
      lastPaymentRaw: lastPaymentDate,
      nextPaymentRaw: next,
      lastPayment: lastPaymentDate.toLocaleDateString(),
      nextPayment: next.toLocaleDateString()
    } : r))
  }

  async function handlePauseResume(row: typeof rows[number]) {
    if (!user) return
    const subRef = doc(db, 'users', user.uid, 'subscriptions', row.id)
    const newStatus = row.status === 'paused' ? 'authorized' : 'paused'
    await updateDoc(subRef, { status: newStatus })
    setRows((prev)=>prev.map((r)=>r.id===row.id?{...r, status: newStatus as any}:r))
  }

  async function handleDeleteConfirmed() {
    if (!user || !deleteConfirmId) return
    await deleteDoc(doc(db, 'users', user.uid, 'subscriptions', deleteConfirmId))
    setDeleteConfirmId(null)
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-0 flex-col sm:flex-row">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCsv}>
            <IconDownload className="h-4 w-4 mr-2" />
            {tCommon('exportCsv')}
          </Button>
          <NewSubscriptionDialog />
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="flex-1 relative">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t('filterByStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('allStatuses')}</SelectItem>
              <SelectItem value="authorized">{t('active')}</SelectItem>
              <SelectItem value="paused">{t('paused')}</SelectItem>
              <SelectItem value="cancelled">{t('cancelled')}</SelectItem>
              <SelectItem value="pending">{t('pending')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border">
              <tr>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-muted-foreground">{t('tableCustomer')}</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-muted-foreground">{t('tablePlan')}</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-muted-foreground">{t('status')}</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-muted-foreground hidden sm:table-cell">{t('lastPayment')}</th>
                <th className="text-left p-3 md:p-4 text-xs md:text-sm font-medium text-muted-foreground hidden sm:table-cell">{t('nextPayment')}</th>
                <th className="text-right p-3 md:p-4 text-xs md:text-sm font-medium text-muted-foreground">{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    <td className="p-3 md:p-4">
                      <div className="space-y-1.5">
                        <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                        <div className="h-3 w-24 rounded bg-muted animate-pulse" />
                      </div>
                    </td>
                    <td className="p-3 md:p-4">
                      <div className="space-y-1.5">
                        <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                        <div className="h-3 w-16 rounded bg-muted animate-pulse" />
                      </div>
                    </td>
                    <td className="p-3 md:p-4">
                      <div className="h-5 w-20 rounded-full bg-muted animate-pulse" />
                    </td>
                    <td className="p-3 md:p-4 hidden sm:table-cell">
                      <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                    </td>
                    <td className="p-3 md:p-4 hidden sm:table-cell">
                      <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                    </td>
                    <td className="p-3 md:p-4 text-right">
                      <div className="h-8 w-8 rounded bg-muted animate-pulse ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredSubscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-muted-foreground">
                    <IconSearch className="h-8 w-8 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">{t('noResults')}</p>
                  </td>
                </tr>
              ) : (
                filteredSubscriptions.map((sub) => (
                  <tr
                    key={sub.id}
                    className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                  >
                    <td className="p-3 md:p-4">
                      <div>
                        <p className="font-medium">{sub.customerName}</p>
                        <p className="text-sm text-muted-foreground">{sub.email}</p>
                      </div>
                    </td>
                    <td className="p-3 md:p-4">
                      <div>
                        <p className="font-medium">{sub.plan}</p>
                        <p className="text-sm text-muted-foreground">${sub.price}/{sub.billingCycle === 'yearly' ? 'yr' : 'mo'}</p>
                      </div>
                    </td>
                    <td className="p-3 md:p-4">
                      <StatusBadge status={sub.status} />
                    </td>
                    <td className="p-3 md:p-4 text-sm hidden sm:table-cell">{sub.lastPayment}</td>
                    <td className="p-3 md:p-4 text-sm hidden sm:table-cell">{sub.nextPayment}</td>
                    <td
                      className="p-3 md:p-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onPointerDown={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                          >
                            <IconChevronRight className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/${locale}/app/subscriptions/${sub.id}`)}>{tCommon('details') ?? 'Details'}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleMarkPaid(sub)}>{t('markPaid')}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setEditRow({ id: sub.id, customerId: sub.customerId || '', plan: sub.plan, price: sub.price, billingCycle: sub.billingCycle as any, status: sub.status as any, nextPayment: sub.nextPaymentRaw ? sub.nextPaymentRaw.toISOString() : null }); setEditOpen(true) }}>{t('edit')}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePauseResume(sub)}>{sub.status==='paused' ? t('resume') : t('pause')}</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setDeleteConfirmId(sub.id)}>{tCommon('delete')}</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete confirmation dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tCommon('delete')} {t('subscription')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground py-2">{t('deleteConfirm')}</p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>{tCommon('cancel')}</Button>
            <Button variant="destructive" onClick={handleDeleteConfirmed}>{tCommon('confirm')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EditSubscriptionDialog
        row={editRow}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSaved={(u)=>{
          setRows((prev)=>prev.map((r)=> r.id===editRow?.id? {
            ...r,
            plan: u.plan ?? r.plan,
            price: typeof u.price === 'number' ? u.price : r.price,
            billingCycle: (u.billingCycle as any) ?? r.billingCycle,
            nextPayment: u.nextPayment ? new Date(u.nextPayment).toLocaleDateString() : r.nextPayment,
          }: r))
        }}
      />
    </div>
  )
}

