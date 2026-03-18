"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslations } from '@/hooks/use-translations'
import { useLocale } from 'next-intl'
import { useAuth } from "@/components/auth-provider"
import { db, auth, updateProfile } from "@/lib/firebase"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { useTheme } from "next-themes"
import { ThemeSwitch } from "@/components/theme-switch"
import { ChangePasswordForm } from "@/components/change-password-form"
import { useToast } from "@/hooks/use-toast"
import { IconEdit } from "@tabler/icons-react"
import { isTrialExpired, isPaidUser, trialDaysLeft } from "@/lib/trial-utils"
import Link from "next/link"

export default function SettingsPage() {
  const t = useTranslations('settings')
  const tAuth = useTranslations('auth')
  const tUpgrade = useTranslations('upgrade')
  const { user } = useAuth()
  const { toast } = useToast()
  const locale = useLocale()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [joined, setJoined] = useState("")
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState("")
  const [saving, setSaving] = useState(false)
  const [planStatus, setPlanStatus] = useState<string>("")
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      setEmail(user.email ?? "")
      const ref = doc(db, 'users', user.uid)
      const snap = await getDoc(ref)
      const data = snap.data() as any
      const displayName = data?.displayName ?? user.displayName ?? ""
      setName(displayName)
      setEditName(displayName)
      const ts = data?.createdAt
      let d: Date | null = null
      if (ts?.toDate) d = ts.toDate(); else if (ts?.seconds) d = new Date(ts.seconds * 1000); else if (ts) d = new Date(ts)
      setJoined(d ? d.toLocaleDateString(locale) : "—")
      const subStatus = data?.subscriptionStatus ?? null
      const trialEnd = data?.trialEndsAt
      if (isPaidUser(subStatus)) {
        setPlanStatus(tUpgrade('proPlan'))
        setShowUpgrade(false)
      } else if (isTrialExpired(subStatus, trialEnd)) {
        setPlanStatus(tUpgrade('trialExpiredLabel'))
        setShowUpgrade(true)
      } else {
        const days = trialDaysLeft(subStatus, trialEnd)
        setPlanStatus(tUpgrade('trialDaysLeft', { days }))
        setShowUpgrade(false)
      }
    })()
  }, [user, locale, tUpgrade])

  async function handleSaveProfile() {
    if (!user || !editName.trim()) return
    setSaving(true)
    try {
      const trimmedName = editName.trim()
      // Update Firebase Auth profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: trimmedName })
      }
      // Update Firestore user doc
      const ref = doc(db, 'users', user.uid)
      await updateDoc(ref, { displayName: trimmedName })
      setName(trimmedName)
      setEditing(false)
      toast({ title: t('profileUpdated') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground">{t('overview')}</p>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('profile')}</h2>
          {!editing && (
            <Button variant="outline" size="sm" onClick={() => { setEditName(name); setEditing(true) }}>
              <IconEdit className="h-4 w-4 mr-2" />
              {t('editProfile')}
            </Button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">{tAuth('email')}</p>
            <p className="font-medium break-all">{email || '—'}</p>
          </div>
          <div>
            <p className="text-muted-foreground">{t('joined')}</p>
            <p className="font-medium">{joined}</p>
          </div>
          <div>
            {editing ? (
              <div className="space-y-2">
                <Label htmlFor="edit-display-name">{t('displayName')}</Label>
                <div className="flex gap-2">
                  <Input id="edit-display-name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <Button size="sm" onClick={handleSaveProfile} disabled={saving}>{t('profileUpdated', { default: 'Save' }).split(' ')[0]}</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditing(false)}>✕</Button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-muted-foreground">{t('displayName')}</p>
                <p className="font-medium">{name || '—'}</p>
              </>
            )}
          </div>
          <div>
            <ThemeSwitch />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">{tUpgrade('currentPlan')}</h2>
        <div className="flex items-center justify-between">
          <p className="font-medium">{planStatus}</p>
          {showUpgrade && (
            <Link href={`/${locale}/app/upgrade`}>
              <Button size="sm">{tUpgrade('upgradeNow')}</Button>
            </Link>
          )}
        </div>
      </Card>

      <ChangePasswordForm />
    </div>
  )
}
