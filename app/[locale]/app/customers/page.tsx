"use client"

import { useEffect, useMemo, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { IconSearch, IconPlus } from "@tabler/icons-react"
import { useAuth } from "@/components/auth-provider"
import { db } from "@/lib/firebase"
import { collection, onSnapshot, orderBy, query } from "firebase/firestore"
import { NewCustomerDialog } from "@/components/new-customer-dialog"

export default function CustomersPage() {
  const [search, setSearch] = useState("")
  const t = useTranslations('customers')
  const locale = useLocale()
  const { user } = useAuth()
  const [rows, setRows] = useState<Array<{ id: string; name: string; email: string; subscriptions?: number; totalValue?: number }>>([])

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'users', user.uid, 'customers'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const list: Array<any> = []
      snap.forEach((d) => {
        const data = d.data() as any
        list.push({ id: d.id, name: data.name ?? '', email: data.email ?? '', subscriptions: data.subscriptions ?? 0, totalValue: data.totalValue ?? 0 })
      })
      setRows(list)
    })
    return () => unsub()
  }, [user])

  const filteredCustomers = useMemo(() => rows.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  ), [rows, search])

  return (
    <div className="space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-0 flex-col sm:flex-row">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">{t('manageDescription')}</p>
        </div>
        <NewCustomerDialog />
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchCustomersPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Customer Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredCustomers.map((customer) => (
          <Card key={customer.id} className="p-6">
            <div className="flex items-start gap-4">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {customer.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{customer.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{customer.email}</p>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{t('subscriptions')}</p>
                    <p className="text-sm font-medium">{customer.subscriptions ?? 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{t('totalValue')}</p>
                    <p className="text-sm font-medium">${customer.totalValue ?? 0}/mo</p>
                  </div>
                </div>
                <div className="mt-4">
                  <Link href={`/${locale}/customers/${customer.id}`}>
                    <Button className="pointer w-full sm:w-auto" size="sm" variant="outline">{t('details')}</Button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
