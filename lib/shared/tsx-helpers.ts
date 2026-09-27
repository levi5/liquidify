export type ImageSizeOptions = {
  width?: number | string
  height?: number | string
  crop?: string
  scale?: number | string
}

export const raw = <T>(value: T): T => value

const escapeMap: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

// biome-ignore lint/suspicious/noShadowRestrictedNames: name mirrors the Liquid | escape filter
export const escape = (value: unknown): string => String(value ?? '').replace(/[&<>"']/g, (c) => escapeMap[c] ?? c)

export const escapeOnce = (value: unknown): string =>
  String(value ?? '')
    .replace(/&(?!amp;|lt;|gt;|quot;|#39;)/g, '&amp;')
    .replace(/[<>"']/g, (c) => escapeMap[c] ?? c)

export const json = (value: unknown): string => JSON.stringify(value) ?? 'null'

export const defaultValue = <T, F>(value: T | null | undefined, fallback: F): T | F => (value ?? fallback) as T | F

export const t = (key: string, params?: Record<string, string | number>): string => (params ? `${key} ${JSON.stringify(params)}` : key)

export const translate = t

export const assetUrl = (file: string): string => file

export const imageUrl = (src: unknown, _size?: number | string | ImageSizeOptions): string => String(src ?? '')

export const money = (cents: unknown): string => String(cents ?? '')

export const moneyWithCurrency = (cents: unknown): string => String(cents ?? '')

export const moneyWithoutCurrency = (cents: unknown): string => String(cents ?? '')

export const moneyWithoutTrailingZeros = (cents: unknown): string => String(cents ?? '')

export const weightWithUnit = (value: unknown): string => String(value ?? '')
