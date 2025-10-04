"use client"

import * as React from "react"
import { IconInfoCircle, IconX } from "@tabler/icons-react"
import { useAuth } from "@/components/auth-provider"
import { db } from "@/lib/firebase"
import { doc, getDoc, getDocFromServer } from "firebase/firestore"

function parseFirestoreDate(input: any): Date | null {
  if (!input) return null
  if (typeof input?.toDate === "function") return input.toDate()
  if (typeof input?.seconds === "number") return new Date(input.seconds * 1000)
  const d = new Date(input)
  return isNaN(d.getTime()) ? null : d
}

function computeDaysLeft(end: Date): number {
  const now = new Date().getTime()
  const diff = end.getTime() - now
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function TrialBanner() {
  const { user } = useAuth()
  const [daysLeft, setDaysLeft] = React.useState<number | null>(null)
  const [status, setStatus] = React.useState<string | null>(null)
  const [dismissed, setDismissed] = React.useState<boolean>(false)

  React.useEffect(() => {
    if (!user) return
    let cancelled = false
    // Inicializa dismiss desde localStorage por usuario
    try {
      const key = `trialBannerDismissed_${user.uid}`
      const val = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
      setDismissed(val === '1')
    } catch {}
    // Listener para sincronizar entre instancias del componente
    const onDismissSync = () => setDismissed(true)
    if (typeof window !== 'undefined') {
      window.addEventListener('trialBanner:dismiss', onDismissSync as EventListener)
    }
    ;(async () => {
      try {
        const ref = doc(db, "users", user.uid)
        console.log("users", user.uid)
        let snap
        try {
          snap = await getDocFromServer(ref)
          console.log("getDoc", snap)
        } catch (e) {
          snap = await getDoc(ref)
          console.log("getDoc", snap)
        }
        if (!snap?.exists?.()) {
          if (!cancelled) {
            setStatus(null)
            setDaysLeft(null)
          }
          return
        }
        const data = snap.data() as any
        const currentStatus: string | null = typeof data?.subscriptionStatus === 'string' ? data.subscriptionStatus : null
        const trialEndsAtRaw = data?.trialEndsAt ?? data?.trialEndAt ?? data?.trialsEndsAt
        const trialEnd = parseFirestoreDate(trialEndsAtRaw)
        const localDaysLeft = trialEnd ? computeDaysLeft(trialEnd) : null

        if (!cancelled) {
          setStatus(currentStatus)
          setDaysLeft(localDaysLeft)
        }
      } catch (err) {
        if (!cancelled) {
          setStatus(null)
          setDaysLeft(null)
        }
      }
    })()
    return () => {
      cancelled = true
      if (typeof window !== 'undefined') {
        window.removeEventListener('trialBanner:dismiss', onDismissSync as EventListener)
      }
    }
  }, [user])

  if (!user) return null
  if (dismissed) return null
  if (status !== 'trial' || daysLeft === null) return null

  return (
    <div className="bg-info/10 border border-info/20 rounded-lg p-4 flex items-center gap-3">
      <IconInfoCircle className="h-5 w-5 text-info flex-shrink-0" />
      <div className="text-sm flex-1">
        <span className="font-medium">Trial activo:</span> {daysLeft} días restantes de tu prueba gratis
      </div>
      <button
        aria-label="Cerrar"
        className="text-info/80 hover:text-info p-1 rounded hover:bg-info/20"
        onClick={() => {
          setDismissed(true)
          try {
            const key = `trialBannerDismissed_${user.uid}`
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(key, '1')
              window.dispatchEvent(new Event('trialBanner:dismiss'))
            }
          } catch {}
        }}
      >
        <IconX className="h-4 w-4" />
      </button>
    </div>
  )
}

