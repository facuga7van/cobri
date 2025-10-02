"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth"
import { auth, db } from "@/lib/firebase"
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { GoogleLoginButton } from "@/components/google-login-button"

export default function SignInPage() {
  const router = useRouter()
  const { toast } = useToast()
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
      toast({ title: "Sign in successful", description: "Redirecting to dashboard..." })
      router.push("../")
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Sign in failed" })
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setOauthLoading(true)
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      const cred = await signInWithPopup(auth, provider)
      const user = cred.user
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
      toast({ title: "Sign in successful", description: "Redirecting to dashboard..." })
      router.push("../")
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Google sign in failed" })
    } finally {
      setOauthLoading(false)
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
          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </form>

        <div className="my-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm text-muted-foreground">
          <span className="h-px bg-border" />
          <span>or</span>
          <span className="h-px bg-border" />
        </div>

        <div className="w-full flex justify-center">
          <GoogleLoginButton />
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Don't have an account?{" "}
          <Link href="/auth/sign-up" className="text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  )
}
