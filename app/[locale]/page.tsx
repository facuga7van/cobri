import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { IconUsers, IconCreditCard, IconChartBar, IconHistory } from "@tabler/icons-react"
import { useTranslations, useLocale } from "next-intl"

export default function LandingPage() {
  const t = useTranslations('landing')
  const tAuth = useTranslations('auth')
  const locale = useLocale()

  const features = [
    { icon: IconUsers, title: t('feature1Title'), desc: t('feature1Desc') },
    { icon: IconCreditCard, title: t('feature2Title'), desc: t('feature2Desc') },
    { icon: IconChartBar, title: t('feature3Title'), desc: t('feature3Desc') },
    { icon: IconHistory, title: t('feature4Title'), desc: t('feature4Desc') },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">C</span>
            </div>
            <span className="text-xl font-bold">Cobri</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href={`/${locale}/auth/sign-in`}>
              <Button variant="ghost" size="sm">{tAuth('signIn')}</Button>
            </Link>
            <Link href={`/${locale}/auth/sign-up`}>
              <Button size="sm">{t('cta')}</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 md:py-28 text-center animate-fade-in-up">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 max-w-3xl mx-auto leading-tight">
          {t('hero')}
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t('heroSub')}
        </p>
        <div className="flex gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <Link href={`/${locale}/auth/sign-up`}>
            <Button size="lg">{t('cta')}</Button>
          </Link>
          <Link href={`/${locale}/auth/sign-in`}>
            <Button variant="outline" size="lg">{t('ctaSignIn')}</Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <Card key={i} className={`p-6 text-center card-hover animate-fade-in-up stagger-${i + 1}`}>
              <f.icon className="h-10 w-10 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        <p>{t('footerText')}</p>
      </footer>
    </div>
  )
}
