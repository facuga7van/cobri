"use client"

import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { IconFilter, IconX } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

export type PeriodFilter = '1' | '3' | '6' | '12' | 'year' | 'all'

interface DashboardFiltersProps {
  period: PeriodFilter
  onPeriodChange: (period: PeriodFilter) => void
  customerId: string
  onCustomerChange: (customerId: string) => void
  customers: Array<{ id: string; name: string }>
  locale: string
}

const periodLabelsES: Record<PeriodFilter, string> = {
  '1': 'Último mes',
  '3': '3 meses',
  '6': '6 meses',
  '12': '12 meses',
  'year': 'Este año',
  'all': 'Todo el tiempo'
}

const periodLabelsEN: Record<PeriodFilter, string> = {
  '1': 'Last month',
  '3': '3 months',
  '6': '6 months',
  '12': '12 months',
  'year': 'This year',
  'all': 'All time'
}

export function DashboardFilters({
  period,
  onPeriodChange,
  customerId,
  onCustomerChange,
  customers,
  locale
}: DashboardFiltersProps) {
  const periodLabels = locale === 'en' ? periodLabelsEN : periodLabelsES
  const hasFilters = customerId !== 'all'

  return (
    <Card className="p-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <div className="flex items-center gap-2 text-sm font-medium">
          <IconFilter className="h-4 w-4 text-muted-foreground" />
          <span>Filtros</span>
        </div>

        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Period Filter */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Período</Label>
            <Select value={period} onValueChange={(v) => onPeriodChange(v as PeriodFilter)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">{periodLabels['1']}</SelectItem>
                <SelectItem value="3">{periodLabels['3']}</SelectItem>
                <SelectItem value="6">{periodLabels['6']}</SelectItem>
                <SelectItem value="12">{periodLabels['12']}</SelectItem>
                <SelectItem value="year">{periodLabels['year']}</SelectItem>
                <SelectItem value="all">{periodLabels['all']}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Customer Filter */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Cliente</Label>
            <div className="flex gap-2">
              <Select value={customerId} onValueChange={onCustomerChange}>
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los clientes</SelectItem>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onCustomerChange('all')}
                  title="Limpiar filtros"
                >
                  <IconX className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

