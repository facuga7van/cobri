import { db } from './firebase'
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore'

export interface KPIData {
  activeSubscriptions: number
  mrr: number // Monthly Recurring Revenue
  newThisMonth: number
  growth: number // Percentage growth vs last month
  chartData: Array<{ month: string; revenue: number }>
  upcomingCharges: Array<{
    id: string
    customerName: string
    plan: string
    amount: number
    nextPayment: string
  }>
}

interface Subscription {
  id: string
  customerId: string
  plan: string
  price: number
  billingCycle: 'monthly' | 'yearly'
  status: 'authorized' | 'paused' | 'cancelled' | 'pending'
  createdAt: any
  nextPayment?: any
  lastPayment?: any
}

/**
 * Calculate Monthly Recurring Revenue (MRR)
 * Converts yearly subscriptions to monthly equivalent
 */
function calculateMRR(subscriptions: Subscription[]): number {
  return subscriptions.reduce((total, sub) => {
    if (sub.status !== 'authorized') return total
    
    const monthlyValue = sub.billingCycle === 'yearly' 
      ? sub.price / 12 
      : sub.price
    
    return total + monthlyValue
  }, 0)
}

/**
 * Get subscriptions created in a specific month
 */
function getSubscriptionsInMonth(subscriptions: Subscription[], monthsAgo: number): Subscription[] {
  const now = new Date()
  const targetDate = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1)
  const nextMonth = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 1)
  
  return subscriptions.filter(sub => {
    const createdAt = sub.createdAt?.toDate?.() || new Date(sub.createdAt)
    return createdAt >= targetDate && createdAt < nextMonth
  })
}

/**
 * Calculate revenue for chart based on selected period
 * Shows the total MRR (all active subscriptions) at the end of each period
 */
function calculateChartData(
  subscriptions: Subscription[], 
  locale: string = 'es',
  period: DashboardFilters['period'] = '6'
): Array<{ month: string; revenue: number }> {
  const monthsES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  const monthsEN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const months = locale === 'en' ? monthsEN : monthsES
  
  const data: Array<{ month: string; revenue: number }> = []
  const now = new Date()
  
  // Determine number of months to show based on period
  let monthsToShow = 6
  if (period === '1') monthsToShow = 1
  else if (period === '3') monthsToShow = 3
  else if (period === '6') monthsToShow = 6
  else if (period === '12') monthsToShow = 12
  else if (period === 'year') {
    // This year: from January to current month
    monthsToShow = now.getMonth() + 1 // 0-indexed, so +1 gives months from Jan to now
  } else if (period === 'all') {
    // All time: calculate from first subscription
    const firstSubDate = subscriptions.reduce((earliest, sub) => {
      const createdAt = sub.createdAt?.toDate?.() || new Date(sub.createdAt)
      return createdAt < earliest ? createdAt : earliest
    }, now)
    const monthsDiff = (now.getFullYear() - firstSubDate.getFullYear()) * 12 + (now.getMonth() - firstSubDate.getMonth())
    monthsToShow = Math.min(monthsDiff + 1, 24) // Max 24 months for performance
  }
  
  // Para "Este año", iterar de forma diferente (de enero hacia adelante)
  if (period === 'year') {
    for (let monthIndex = 0; monthIndex < monthsToShow; monthIndex++) {
      const targetDate = new Date(now.getFullYear(), monthIndex, 1)
      const isCurrentMonth = monthIndex === now.getMonth()
      const cutoffDate = isCurrentMonth ? now : new Date(now.getFullYear(), monthIndex + 1, 0)
      
      const activeSubs = subscriptions.filter(sub => {
        const createdAt = sub.createdAt?.toDate?.() || new Date(sub.createdAt)
        if (createdAt > cutoffDate) return false
        if (sub.status !== 'authorized') return false
        return true
      })
      
      const revenue = calculateMRR(activeSubs)
      data.push({
        month: months[monthIndex],
        revenue: Number(revenue.toFixed(2))
      })
    }
  } else {
    // Para otros períodos, contar hacia atrás desde ahora
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const year = now.getFullYear()
      const month = now.getMonth() - i
      const targetDate = new Date(year, month, 1)
      const cutoffDate = i === 0 ? now : new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0)
      
      const activeSubs = subscriptions.filter(sub => {
        const createdAt = sub.createdAt?.toDate?.() || new Date(sub.createdAt)
        if (createdAt > cutoffDate) return false
        if (sub.status !== 'authorized') return false
        return true
      })
      
      const revenue = calculateMRR(activeSubs)
      data.push({
        month: months[targetDate.getMonth()],
        revenue: Number(revenue.toFixed(2))
      })
    }
  }
  
  return data
}

/**
 * Get upcoming charges in next 7 days
 */
async function getUpcomingCharges(
  userId: string, 
  subscriptions: Subscription[]
): Promise<KPIData['upcomingCharges']> {
  const now = new Date()
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  
  // Get customer data for names
  const customersSnap = await getDocs(collection(db, 'users', userId, 'customers'))
  const customersMap = new Map<string, string>()
  customersSnap.forEach(doc => {
    const data = doc.data()
    customersMap.set(doc.id, data.name || 'Unknown')
  })
  
  const upcoming = subscriptions
    .filter(sub => {
      if (sub.status !== 'authorized' || !sub.nextPayment) return false
      
      const nextPaymentDate = sub.nextPayment?.toDate?.() || new Date(sub.nextPayment)
      return nextPaymentDate >= now && nextPaymentDate <= next7Days
    })
    .map(sub => ({
      id: sub.id,
      customerName: customersMap.get(sub.customerId) || 'Unknown',
      plan: sub.plan,
      amount: sub.price,
      nextPayment: (sub.nextPayment?.toDate?.() || new Date(sub.nextPayment)).toLocaleDateString()
    }))
    .sort((a, b) => {
      const dateA = new Date(a.nextPayment).getTime()
      const dateB = new Date(b.nextPayment).getTime()
      return dateA - dateB
    })
  
  return upcoming.slice(0, 5) // Max 5 upcoming charges
}

export interface DashboardFilters {
  period: '1' | '3' | '6' | '12' | 'year' | 'all'
  customerId?: string
}

/**
 * Calculate all KPIs for dashboard with optional filters
 */
export async function calculateKPIs(
  userId: string, 
  locale: string = 'es',
  filters: DashboardFilters = { period: '6' }
): Promise<KPIData> {
  try {
    // Fetch all subscriptions
    const subsQuery = query(collection(db, 'users', userId, 'subscriptions'))
    const subsSnap = await getDocs(subsQuery)
    
    let subscriptions: Subscription[] = []
    subsSnap.forEach(doc => {
      const data = doc.data()
      subscriptions.push({
        id: doc.id,
        customerId: data.customerId || '',
        plan: data.plan || '',
        price: typeof data.price === 'number' ? data.price : Number(data.price || 0),
        billingCycle: data.billingCycle || 'monthly',
        status: data.status || 'pending',
        createdAt: data.createdAt,
        nextPayment: data.nextPayment,
        lastPayment: data.lastPayment,
      })
    })

    // Apply customer filter
    if (filters.customerId && filters.customerId !== 'all') {
      subscriptions = subscriptions.filter(sub => sub.customerId === filters.customerId)
    }
    
    // Calculate metrics
    const activeSubs = subscriptions.filter(s => s.status === 'authorized')
    const activeCount = activeSubs.length
    const currentMRR = calculateMRR(activeSubs)
    
    // New subscriptions this month
    const thisMonthSubs = getSubscriptionsInMonth(subscriptions, 0)
    const newThisMonth = thisMonthSubs.length
    
    // Calculate growth (compare with last month)
    const lastMonthSubs = subscriptions.filter(sub => {
      const createdAt = sub.createdAt?.toDate?.() || new Date(sub.createdAt)
      const lastMonthStart = new Date()
      lastMonthStart.setMonth(lastMonthStart.getMonth() - 1)
      lastMonthStart.setDate(1)
      lastMonthStart.setHours(0, 0, 0, 0)
      
      const thisMonthStart = new Date()
      thisMonthStart.setDate(1)
      thisMonthStart.setHours(0, 0, 0, 0)
      
      return createdAt < thisMonthStart && sub.status === 'authorized'
    })
    
    const lastMonthMRR = calculateMRR(lastMonthSubs)
    
    // Calculate growth percentage
    let growth = 0
    if (lastMonthMRR === 0 && currentMRR > 0) {
      // Started from nothing - show max growth
      growth = 100
    } else if (lastMonthMRR > 0 && currentMRR === 0) {
      // Lost everything - show -100%
      growth = -100
    } else if (lastMonthMRR > 0) {
      // Normal calculation
      growth = Math.round(((currentMRR - lastMonthMRR) / lastMonthMRR) * 100)
    }
    // If both are 0, growth remains 0
    
    // Chart data based on selected period
    const chartData = calculateChartData(subscriptions, locale, filters.period)
    
    // Upcoming charges
    const upcomingCharges = await getUpcomingCharges(userId, subscriptions)
    
    return {
      activeSubscriptions: activeCount,
      mrr: Number(currentMRR.toFixed(2)), // Mantener 2 decimales
      newThisMonth,
      growth,
      chartData,
      upcomingCharges,
    }
  } catch (error) {
    console.error('Error calculating KPIs:', error)
    
    // Return empty/default data on error
    return {
      activeSubscriptions: 0,
      mrr: 0,
      newThisMonth: 0,
      growth: 0,
      chartData: [],
      upcomingCharges: [],
    }
  }
}

