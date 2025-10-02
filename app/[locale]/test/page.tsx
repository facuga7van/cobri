"use client"

import { useTranslations, useLocale } from 'next-intl'

export default function TestPage() {
  const t = useTranslations('common')
  const locale = useLocale()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Página de Prueba</h1>
      <p>Locale actual: {locale}</p>
      <p>Traducción de "loading": {t('loading')}</p>
      <p>Si ves esto, la configuración i18n está funcionando!</p>
    </div>
  )
}
