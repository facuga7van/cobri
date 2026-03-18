"use client"

import { useState } from "react"
import { useTranslations } from "@/hooks/use-translations"
import { useAuth } from "@/components/auth-provider"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { IconCheck } from "@tabler/icons-react"
import { useToast } from "@/hooks/use-toast"

export default function UpgradePage() {
  const t = useTranslations('upgrade')
  const tPricing = useTranslations('pricing')
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  async function handleSubscribe() {
    if (!user) return
    setLoading(true)
    try {
      const token = await user.getIdToken()
      const res = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })
      const data = await res.json()
      if (data.initPoint) {
        window.location.href = data.initPoint
      } else {
        toast({ title: t('errorSubscribing'), variant: "destructive" })
      }
    } catch {
      toast({ title: t('errorSubscribing'), variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const features = [
    tPricing('unlimitedSubscriptions'),
    tPricing('customerManagement'),
    tPricing('revenueTracking'),
    tPricing('statusMonitoring'),
    tPricing('mpIntegration'),
    tPricing('prioritySupport'),
  ]

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8 animate-fade-in-up">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-2">{t('title')}</h1>
          <p className="text-muted-foreground">{t('subtitle')}</p>
        </div>

        <div className="text-center mb-6">
          <div className="text-5xl font-bold mb-2">
            $5<span className="text-xl text-muted-foreground">/{tPricing('month')}</span>
          </div>
          <p className="text-muted-foreground">{tPricing('billedMonthly')}</p>
        </div>

        <div className="space-y-3 mb-8">
          {features.map((feature, i) => (
            <div key={i} className="flex items-center gap-3">
              <IconCheck className="w-5 h-5 text-success flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        <Button className="w-full" size="lg" onClick={handleSubscribe} disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {t('subscribing')}
            </span>
          ) : t('subscribePro')}
        </Button>
      </Card>
    </div>
  )
}
