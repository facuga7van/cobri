"use client"

import * as React from "react"
import { onAuthStateChanged, User, setPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence } from "firebase/auth"
import { auth } from "@/lib/firebase"

type AuthContextValue = {
  user: User | null
  loading: boolean
}

const AuthContext = React.createContext<AuthContextValue>({ user: null, loading: true })

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let unsub: (() => void) | null = null

    async function init() {
      try {
        await setPersistence(auth, browserLocalPersistence)
      } catch {
        try {
          await setPersistence(auth, browserSessionPersistence)
        } catch {
          await setPersistence(auth, inMemoryPersistence)
        }
      }

      unsub = onAuthStateChanged(auth, (u) => {
        setUser(u)
        setLoading(false)
      })
    }

    init()

    return () => {
      if (unsub) unsub()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return React.useContext(AuthContext)
}


