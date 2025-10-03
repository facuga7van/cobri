"use client"

import * as React from "react"
import { IconInfoCircle } from "@tabler/icons-react"
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

  React.useEffect(() => {
    if (!user) return
    let cancelled = false
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
    }
  }, [user])

  if (!user) return null
  if (status !== 'trial' || daysLeft === null) return null

  return (
    <div className="bg-info/10 border border-info/20 rounded-lg p-4 flex items-center gap-3">
      <IconInfoCircle className="h-5 w-5 text-info flex-shrink-0" />
      <p className="text-sm">
        <span className="font-medium">Trial activo:</span> {daysLeft} días restantes de tu prueba gratis
      </p>
    </div>
  )
}

