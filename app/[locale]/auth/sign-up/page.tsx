"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, setDoc, serverTimestamp } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useTranslations, useLocale } from "next-intl"

export default function SignUpPage() {
  const router = useRouter()
  const { toast } = useToast()
  const tAuth = useTranslations('auth')
  const locale = useLocale()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password)
      if (name) {
        await updateProfile(cred.user, { displayName: name })
      }
      const trialEndsAt = new Date()
      trialEndsAt.setDate(trialEndsAt.getDate() + 15)
      await setDoc(doc(db, 'users', cred.user.uid), {
        email,
        displayName: name,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        theme: null,
        subscriptionStatus: 'trial',
        trialEndsAt,
      }, { merge: true })
      toast({ title: tAuth('accountCreated', { default: 'Account created' }), description: tAuth('welcomeTrial', { default: 'Welcome! Starting your free trial...' }) })
      router.replace(`/${locale}`)
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? tAuth('signUpFailed', { default: 'Sign up failed' }) })
    } finally {
      setLoading(false)
    }
  }

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
          <h1 className="text-2xl font-bold mb-2">{tAuth('startTrial', { default: 'Start your free trial' })}</h1>
          <p className="text-muted-foreground">{tAuth('noCard', { default: 'No credit card required' })}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">{tAuth('fullName', { default: 'Full Name' })}</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
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
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? tAuth('creatingAccount', { default: 'Creating account...' }) : tAuth('startTrialCta', { default: 'Start Free Trial' })}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {tAuth('alreadyHaveAccount')} {" "}
          <Link href="/auth/sign-in" className="text-primary hover:underline">
            {tAuth('signIn')}
          </Link>
        </p>
      </Card>
    </div>
  )
}
