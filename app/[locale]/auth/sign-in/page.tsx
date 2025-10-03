"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { GoogleLoginButton } from "@/components/google-login-button"
import { useTranslations, useLocale } from "next-intl"

export default function SignInPage() {
  const router = useRouter()
  const { toast } = useToast()
  const tAuth = useTranslations('auth')
  const tCommon = useTranslations('common')
  const locale = useLocale()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const user = cred.user
      const userRef = doc(db, 'users', user.uid)
      const snap = await getDoc(userRef)
      const base = {
        uid: user.uid,
        email: user.email ?? '',
        displayName: user.displayName ?? '',
        photoURL: user.photoURL ?? '',
        providerId: user.providerData?.[0]?.providerId ?? 'password',
        emailVerified: user.emailVerified ?? false,
        lastLoginAt: serverTimestamp(),
      }
      const payload = snap.exists() ? base : { ...base, createdAt: serverTimestamp() }
      await setDoc(userRef, payload, { merge: true })
      toast({ title: tAuth('signIn'), description: tAuth('welcomeBack') })
      router.replace(`/${locale}`)
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? tAuth('signUpFailed') })
    } finally {
      setLoading(false)
    }
  }

  // Google login se maneja con <GoogleLoginButton />

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xl">C</span>
            </div>
            <span className="text-2xl font-bold">Cobri</span>
          </Link>
          <h1 className="text-2xl font-bold mb-2">{tAuth('welcomeBack')}</h1>
          <p className="text-muted-foreground">{tAuth('signInToYourAccount')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{tAuth('email')}</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{tAuth('password')}</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? tAuth('signingIn') : tAuth('signIn')}
          </Button>
        </form>

        <div className="my-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm text-muted-foreground">
          <span className="h-px bg-border" />
          <span>{tCommon('or')}</span>
          <span className="h-px bg-border" />
        </div>

        <div className="w-full flex justify-center">
          <GoogleLoginButton />
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {tAuth('dontHaveAccount')} {" "}
          <Link href="/auth/sign-up" className="text-primary hover:underline">
            {tAuth('signUp')}
          </Link>
        </p>
      </Card>
    </div>
  )
}
