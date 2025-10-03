import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { AuthProvider } from "@/components/auth-provider"
import { AppShell } from "@/components/app-shell"
import Script from 'next/script'
import { ThemePreferenceSync } from "@/components/theme-preference-sync"

export default async function LocaleLayout({
  children,
  params: { locale }
}: Readonly<{
  children: React.ReactNode
  params: { locale: string }
}>) {
  const messages = await getMessages()

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <NextIntlClientProvider locale={locale} messages={messages}>
        <AuthProvider>
          {/* Google Identity Services */}
          <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
          <ThemePreferenceSync />
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </NextIntlClientProvider>
    </ThemeProvider>
  )
}
