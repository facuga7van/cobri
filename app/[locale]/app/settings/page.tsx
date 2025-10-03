"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { useTranslations, useLocale } from 'next-intl'
import { useAuth } from "@/components/auth-provider"
import { db } from "@/lib/firebase"
import { doc, getDoc } from "firebase/firestore"
import { useTheme } from "next-themes"
import { ThemeSwitch } from "@/components/theme-switch"

export default function SettingsPage() {
  const t = useTranslations('settings')
  const tAuth = useTranslations('auth')
  const tTheme = useTranslations('theme')
  const { user } = useAuth()
  const { resolvedTheme } = useTheme()
  const locale = useLocale()

  const [name, setName] = useState<string>("")
  const [email, setEmail] = useState<string>("")
  const [joined, setJoined] = useState<string>("")

  useEffect(() => {
    if (!user) return
    ;(async () => {
      setEmail(user.email ?? "")
      const ref = doc(db, 'users', user.uid)
      const snap = await getDoc(ref)
      const data = snap.data() as any
      setName(data?.displayName ?? user.displayName ?? "")
      const ts = data?.createdAt
      let d: Date | null = null
      if (ts?.toDate) d = ts.toDate(); else if (ts?.seconds) d = new Date(ts.seconds * 1000); else if (ts) d = new Date(ts)
      setJoined(d ? d.toLocaleDateString(locale) : "—")
    })()
  }, [user, locale])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">{t('overview', { default: 'View your account information' })}</p>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">{t('profile')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">{tAuth('email')}</p>
            <p className="font-medium break-all">{email || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('joined', { default: 'Joined' })}</p>
            <p className="font-medium">{joined}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('account')}</p>
            <p className="font-medium">{name || '—'}</p>
          </div>
          <div>
            <ThemeSwitch />          
          </div>
        </div>
      </Card>
    </div>
  )
}
