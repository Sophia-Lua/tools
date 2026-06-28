import zh from './locales/zh.json'
import en from './locales/en.json'

export const locales = ['zh', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'zh'

const messages = { zh, en } as const

export function t(locale: Locale, path: string): string {
  const keys = path.split('.')
  let result: any = messages[locale]
  for (const key of keys) {
    result = result?.[key]
  }
  return typeof result === 'string' ? result : path
}

export function getLocaleFromPath(pathname: string): Locale {
  const firstSegment = pathname.split('/')[1]
  if (locales.includes(firstSegment as Locale)) {
    return firstSegment as Locale
  }
  return defaultLocale
}
