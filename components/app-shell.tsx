"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { useLocale } from "next-intl"
import { useAuth } from "@/components/auth-provider"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarProvider, Sidebar, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
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

  React.useEffect(() => {
    if (!loading && user && isAuthRoute) {
      router.replace(`/${locale}`)
    }
  }, [loading, user, isAuthRoute, router, locale])

  if (loading) return null

  if (!user) {
    if (isPricing || isAuthRoute) return <>{children}</>
    return null
  }

  if (user && isAuthRoute) return null

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <Sidebar>
          <AppSidebar />
        </Sidebar>
        <SidebarInset>
          <header className="h-16 border-b border-border flex items-center px-4 md:px-6">
            <div className="flex w-full items-center justify-between">
              <SidebarTrigger className="md:hidden" />
              <div className="md:hidden">
                <Link href={`/${locale}`} className="inline-flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-lg">C</span>
                  </div>
                  <span className="text-lg font-bold">Cobri</span>
                </Link>
              </div>
              <div className="md:hidden w-8" />
              <div className="hidden md:block w-full">
                <TrialBanner />
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}


