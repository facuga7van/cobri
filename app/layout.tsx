import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "Cobri — Gestión de suscripciones recurrentes",
    template: "%s | Cobri",
  },
  description: "Cobri te ayuda a gestionar suscripciones, automatizar cobros con MercadoPago y visualizar ingresos en tiempo real.",
  keywords: ["suscripciones", "cobros recurrentes", "MercadoPago", "gestión de clientes", "SaaS", "facturación"],
  authors: [{ name: "Cobri" }],
  openGraph: {
    title: "Cobri — Gestión de suscripciones recurrentes",
    description: "Gestioná suscripciones, automatizá cobros con MercadoPago y visualizá tus ingresos en tiempo real.",
    type: "website",
    locale: "es_AR",
    siteName: "Cobri",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cobri — Gestión de suscripciones recurrentes",
    description: "Gestioná suscripciones, automatizá cobros con MercadoPago y visualizá tus ingresos en tiempo real.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html suppressHydrationWarning>
      <body className={`font-sans ${inter.variable} antialiased`}>
        {children}
      </body>
    </html>
  )
}
