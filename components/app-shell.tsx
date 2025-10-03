"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { useAuth } from "@/components/auth-provider"
import { AppSidebar } from "@/components/app-sidebar"
import { TrialBanner } from "@/components/trial-banner"

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const locale = useLocale()

  const isPricing = pathname === `/${locale}/pricing`
  const isAuthRoute = pathname?.startsWith(`/${locale}/auth`)

  React.useEffect(() => {
    if (!loading && !user && !isPricing && !isAuthRoute) {
      router.replace(`/${locale}/pricing`)
    }
  }, [loading, user, isPricing, isAuthRoute, router, locale])

  // Si ya estás autenticado y estás en rutas de auth, redirigí al home
  React.useEffect(() => {
    if (!loading && user && isAuthRoute) {
      router.replace(`/${locale}`)
    }
  }, [loading, user, isAuthRoute, router, locale])

  if (loading) return null

  if (!user) {
    // No mostrar contenido de rutas protegidas antes del redirect
    if (isPricing || isAuthRoute) return <>{children}</>
    return null
  }

  // Evitar renderizar auth pages cuando ya hay usuario (hasta que redirija)
  if (user && isAuthRoute) return null

  return (
    <div className="flex h-screen">
      <AppSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border flex items-center px-6">
          <TrialBanner />
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  )
}


