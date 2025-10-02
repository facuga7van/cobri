import { getRequestConfig } from 'next-intl/server';
import es from './messages/es.json';
import en from './messages/en.json';

const locales = ['en', 'es'] as const;
type Locale = (typeof locales)[number];

export default getRequestConfig(({ locale }) => {
  const safeLocale: Locale = (locales as readonly string[]).includes(locale as string)
    ? (locale as Locale)
    : 'es';
  const messages = safeLocale === 'es' ? es : en;
  return { locale: safeLocale, messages };
});
