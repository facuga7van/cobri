"use client"

import Link from "next/link"
import { usePathname, useLocale } from "next/navigation"
import { useTranslations } from 'next-intl'
import { IconLayoutDashboard, IconReceipt, IconUsers, IconSettings, IconLogout } from "@tabler/icons-react"
import { cn } from "@/lib/utils"
import { LanguageSwitch } from "./language-switch"

export function AppSidebar() {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('navigation')
  const tAuth = useTranslations('auth')

  const navigation = [
    { name: t('dashboard'), href: `/${locale}/app`, icon: IconLayoutDashboard },
    { name: t('subscriptions'), href: `/${locale}/app/subscriptions`, icon: IconReceipt },
    { name: t('customers'), href: `/${locale}/app/customers`, icon: IconUsers },
    { name: t('settings'), href: `/${locale}/app/settings`, icon: IconSettings },
  ]

  return (
    <div className="flex h-full w-64 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
        <div className="w-8 h-8 bg-sidebar-primary rounded-lg flex items-center justify-center">
          <span className="text-sidebar-primary-foreground font-bold text-lg">C</span>
        </div>
        <span className="text-xl font-bold">Cobri</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Language Switch */}
      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3">
          <LanguageSwitch />
        </div>
      </div>

      {/* User Section */}
      <div className="border-t border-sidebar-border p-4">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
          <IconLogout className="h-5 w-5" />
          {tAuth('signOut')}
        </button>
      </div>
    </div>
  )
}
