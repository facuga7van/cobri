"use client"

import { useTranslations } from "@/hooks/use-translations"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card } from "@/components/ui/card"

export type PaymentRecord = {
  id: string
  date: Date | string
  amount: number
  source: string
  mercadopagoId?: string
  subscriptionPlan?: string
}

export function PaymentHistoryTable({ payments, showSubscriptionColumn, loading }: {
  payments: PaymentRecord[]
  showSubscriptionColumn?: boolean
  loading?: boolean
}) {
  const t = useTranslations('payments')

  if (loading) {
    return <p className="text-sm text-muted-foreground">{t('title')}...</p>
  }

  return (
    <Card className="p-4">
      <h2 className="text-lg font-semibold mb-3">{t('title')}</h2>
      {payments.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('noPayments')}</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('date')}</TableHead>
                <TableHead>{t('amount')}</TableHead>
                <TableHead>{t('source')}</TableHead>
                {showSubscriptionColumn && <TableHead>{t('subscription')}</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => {
                const dateStr = p.date instanceof Date
                  ? p.date.toLocaleDateString()
                  : new Date(p.date).toLocaleDateString()
                return (
                  <TableRow key={p.id}>
                    <TableCell>{dateStr}</TableCell>
                    <TableCell>${p.amount}</TableCell>
                    <TableCell>{t(p.source === 'mercadopago' ? 'mercadopago' : 'manual')}</TableCell>
                    {showSubscriptionColumn && <TableCell>{p.subscriptionPlan ?? '—'}</TableCell>}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </Card>
  )
}
