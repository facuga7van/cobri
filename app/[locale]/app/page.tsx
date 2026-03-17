"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"
import { useTranslations, useLocale } from "next-intl"
import { Card } from "@/components/ui/card"
import { KpiCard } from "@/components/kpi-card"
import { useAuth } from "@/components/auth-provider"
import { calculateKPIs, type KPIData, type DashboardFilters } from "@/lib/kpis"
import { DashboardFilters as FiltersComponent, type PeriodFilter } from "@/components/dashboard-filters"
import { IconCalendar, IconCurrencyDollar } from "@tabler/icons-react"
import { db } from "@/lib/firebase"
import { collection, getDocs } from "firebase/firestore"

// Lazy load the entire Recharts chart (heavy library ~100KB)
const RevenueChart = dynamic(() => import('@/components/revenue-chart'), {
  loading: () => (
    <div className="h-[300px] flex items-center justify-center">
      <div className="text-sm text-muted-foreground">...</div>
    </div>
  ),
  ssr: false
})

export default function DashboardPage() {
  const t = useTranslations('dashboard')
  const tSubs = useTranslations('subscriptions')
  const tFilters = useTranslations('filters')
  const { user } = useAuth()
  const locale = useLocale()
  
  const [kpis, setKpis] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  
  // Filters state
  const [period, setPeriod] = useState<PeriodFilter>('6')
  const [customerId, setCustomerId] = useState<string>('all')
  const [customers, setCustomers] = useState<Array<{ id: string; name: string }>>([])
  
  // Load filter preferences from localStorage
  useEffect(() => {
    try {
      const savedPeriod = localStorage.getItem('dashboard-period') as PeriodFilter
      const savedCustomer = localStorage.getItem('dashboard-customer')
      if (savedPeriod) setPeriod(savedPeriod)
      if (savedCustomer) setCustomerId(savedCustomer)
    } catch (error) {
      console.error('Error loading filter preferences:', error)
    }
  }, [])
  
  // Save filter preferences to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('dashboard-period', period)
      localStorage.setItem('dashboard-customer', customerId)
    } catch (error) {
      console.error('Error saving filter preferences:', error)
    }
  }, [period, customerId])
  
  // Load customers list
  useEffect(() => {
    if (!user) return
    
    async function loadCustomers() {
      try {
        const customersSnap = await getDocs(collection(db, 'users', user!.uid, 'customers'))
        const customersList: Array<{ id: string; name: string }> = []
        customersSnap.forEach(doc => {
          const data = doc.data()
          customersList.push({
            id: doc.id,
            name: data.name || 'Sin nombre'
          })
        })
        setCustomers(customersList)
      } catch (error) {
        console.error('Error loading customers:', error)
      }
    }
    
    loadCustomers()
  }, [user])

  // Load KPIs when user, locale, or filters change
  useEffect(() => {
    if (!user) return
    
    async function loadKPIs() {
      if (!user) return
      
      try {
        setLoading(true)
        const filters: DashboardFilters = {
          period,
          customerId: customerId === 'all' ? undefined : customerId
        }
        const data = await calculateKPIs(user.uid, locale, filters)
        setKpis(data)
      } catch (error) {
        console.error('Error loading KPIs:', error)
      } finally {
        setLoading(false)
      }
    }

    loadKPIs()
  }, [user, locale, period, customerId])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">{t('welcome')}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-6 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-muted rounded w-3/4"></div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!kpis) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">{t('errorLoading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">{t('welcome')}</p>
      </div>

      {/* Filters */}
      <FiltersComponent
        period={period}
        onPeriodChange={setPeriod}
        customerId={customerId}
        onCustomerChange={setCustomerId}
        customers={customers}
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title={t('activeSubscriptions')}
          value={kpis.activeSubscriptions}
        />
        <KpiCard
          title={t('monthlyRecurring')}
          value={`$${kpis.mrr.toFixed(2)}`}
        />
        <KpiCard
          title={t('newThisMonth')}
          value={kpis.newThisMonth}
        />
        <KpiCard
          title={t('growth')}
          value={`${kpis.growth}%`}
          delta={Math.abs(kpis.growth)}
          trend={kpis.growth >= 0 ? 'up' : 'down'}
        />
      </div>

      {/* Revenue Chart */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">
          {t('revenueTitle')} - {
            period === '1' ? tFilters('lastMonth') :
            period === '3' ? tFilters('threeMonths') :
            period === '6' ? tFilters('sixMonths') :
            period === '12' ? tFilters('twelveMonths') :
            period === 'year' ? tFilters('thisYear') :
            tFilters('allTime')
          }
        </h2>
        <div className="h-[300px]">
          <RevenueChart data={kpis.chartData} />
        </div>
      </Card>

      {/* Upcoming Charges */}
      {kpis.upcomingCharges.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <IconCalendar className="h-5 w-5" />
            {t('upcomingCharges')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">{t('tableCustomer')}</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">{t('tablePlan')}</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">{t('tableAmount')}</th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">{t('tableDate')}</th>
                </tr>
              </thead>
              <tbody>
                {kpis.upcomingCharges.map((charge) => (
                  <tr key={charge.id} className="border-b border-border last:border-0">
                    <td className="p-3 text-sm font-medium">{charge.customerName}</td>
                    <td className="p-3 text-sm text-muted-foreground">{charge.plan}</td>
                    <td className="p-3 text-sm font-medium">${charge.amount}</td>
                    <td className="p-3 text-sm text-muted-foreground">{charge.nextPayment}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {kpis.activeSubscriptions === 0 && (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto">
            <IconCurrencyDollar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">{t('noSubscriptionsYet')}</h3>
            <p className="text-muted-foreground mb-4">
              {t('noSubscriptionsDesc')}
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}
