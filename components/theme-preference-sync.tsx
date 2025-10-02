"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { useAuth } from "@/components/auth-provider"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc } from "firebase/firestore"

export function ThemePreferenceSync() {
  const { user } = useAuth()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const initializedRef = React.useRef(false)
  const lastSavedRef = React.useRef<string | null>(null)

  // On login, load user's preferred theme once
  React.useEffect(() => {
    if (!user || initializedRef.current) return

    (async () => {
      try {
        const ref = doc(db, 'users', user.uid)
        const snap = await getDoc(ref)
        const savedTheme = (snap.data() as any)?.theme as string | undefined
        if (savedTheme && savedTheme !== theme) {
          setTheme(savedTheme)
          lastSavedRef.current = savedTheme
        } else if (!savedTheme && resolvedTheme) {
          // If no preference saved yet, store current resolved theme
          await setDoc(ref, { theme: resolvedTheme }, { merge: true })
          lastSavedRef.current = resolvedTheme
        }
      } catch {
        // ignore
      } finally {
        initializedRef.current = true
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Whenever theme changes, persist it for the user
  React.useEffect(() => {
    if (!user) return
    const current = theme ?? resolvedTheme
    if (!current || current === lastSavedRef.current) return

    const ref = doc(db, 'users', user.uid)
    setDoc(ref, { theme: current }, { merge: true }).finally(() => {
      lastSavedRef.current = current
    })
  }, [theme, resolvedTheme, user])

  return null
}


