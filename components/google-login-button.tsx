"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { auth, db } from "@/lib/firebase"
import { GoogleAuthProvider, signInWithCredential, signInWithPopup, signInWithRedirect } from "firebase/auth"
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore"
import { useTranslations } from "next-intl"

declare global {
  interface Window {
    google?: any
  }
}

export function GoogleLoginButton() {
  const { toast } = useToast()
  const router = useRouter()
  const buttonRef = React.useRef<HTMLDivElement>(null)
  const [fallback, setFallback] = React.useState(false)
  const tAuth = useTranslations('auth')

  const isMobile = React.useMemo(() => {
    if (typeof navigator === 'undefined') return false
    return /Mobi|Android/i.test(navigator.userAgent) || (typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(pointer:coarse)').matches)
  }, [])

  const handleFirebaseUser = React.useCallback(async (user: any) => {
    const userRef = doc(db, 'users', user.uid)
    const snap = await getDoc(userRef)
    const base = {
      uid: user.uid,
      email: user.email ?? '',
      displayName: user.displayName ?? '',
      photoURL: user.photoURL ?? '',
      providerId: user.providerData?.[0]?.providerId ?? 'google',
      emailVerified: user.emailVerified ?? false,
      lastLoginAt: serverTimestamp(),
    }
    const payload = snap.exists() ? base : { ...base, createdAt: serverTimestamp() }
    await setDoc(userRef, payload, { merge: true })
    toast({ title: 'Sign in successful', description: 'Redirecting to dashboard...' })
    router.push('../')
  }, [router, toast])

  React.useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    if (!clientId || isMobile) {
      setFallback(true)
      return
    }

    function handleCredentialResponse(resp: { credential: string }) {
      const credential = GoogleAuthProvider.credential(resp.credential)
      signInWithCredential(auth, credential)
        .then(async (cred) => handleFirebaseUser(cred.user))
        .catch((err) => {
          toast({ title: 'Error', description: err?.message ?? 'Google sign in failed' })
        })
    }

    const google = window.google
    if (!google?.accounts?.id) {
      setFallback(true)
      return
    }

    google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
      itp_support: true,
    })

    if (buttonRef.current) {
      google.accounts.id.renderButton(buttonRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        logo_alignment: 'left',
      })
    }

    google.accounts.id.prompt()
  }, [router, toast, isMobile, handleFirebaseUser])

  if (fallback) {
    return (
      <button
        onClick={async () => {
          try {
            const provider = new GoogleAuthProvider()
            provider.setCustomParameters({ prompt: 'select_account' })
            if (isMobile) {
              await signInWithRedirect(auth, provider)
            } else {
              const cred = await signInWithPopup(auth, provider)
              await handleFirebaseUser(cred.user)
            }
          } catch (err: any) {
            toast({ title: 'Error', description: err?.message ?? 'Google sign in failed' })
          }
        }}
        className="flex items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm hover:bg-accent"
      >
        <span className="Button-content flex items-center gap-2">
          <span className="Button-visual Button-leadingVisual">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
              <g clipPath="url(#clip0_643_9687)">
                <path d="M8.00018 3.16667C9.18018 3.16667 10.2368 3.57333 11.0702 4.36667L13.3535 2.08333C11.9668 0.793333 10.1568 0 8.00018 0C4.87352 0 2.17018 1.79333 0.853516 4.40667L3.51352 6.47C4.14352 4.57333 5.91352 3.16667 8.00018 3.16667Z" fill="#EA4335" />
                <path d="M15.66 8.18335C15.66 7.66002 15.61 7.15335 15.5333 6.66669H8V9.67335H12.3133C12.12 10.66 11.56 11.5 10.72 12.0667L13.2967 14.0667C14.8 12.6734 15.66 10.6134 15.66 8.18335Z" fill="#4285F4" />
                <path d="M3.51 9.53001C3.35 9.04668 3.25667 8.53334 3.25667 8.00001C3.25667 7.46668 3.34667 6.95334 3.51 6.47001L0.85 4.40668C0.306667 5.48668 0 6.70668 0 8.00001C0 9.29334 0.306667 10.5133 0.853333 11.5933L3.51 9.53001Z" fill="#FBBC05" />
                <path d="M8.0001 16C10.1601 16 11.9768 15.29 13.2968 14.0633L10.7201 12.0633C10.0034 12.5467 9.0801 12.83 8.0001 12.83C5.91343 12.83 4.14343 11.4233 3.5101 9.52667L0.850098 11.59C2.1701 14.2067 4.87343 16 8.0001 16Z" fill="#34A853" />
              </g>
              <defs>
                <clipPath id="clip0_643_9687">
                  <rect width="16" height="16" fill="white" />
                </clipPath>
              </defs>
            </svg>
          </span>
          <span className="Button-label">{tAuth('continueWithGoogle')}</span>
        </span>
      </button>
    )
  }

  return <div ref={buttonRef} />
}


