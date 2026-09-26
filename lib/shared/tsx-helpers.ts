export type ImageSizeOptions = {
  width?: number | string
  height?: number | string
  crop?: string
  scale?: number | string
}

export const raw = (value: unknown): any => value

// biome-ignore lint/suspicious/noShadowRestrictedNames: name mirrors the Liquid | escape filter
export const escape = (value: unknown): string => String(value ?? '')

export const escapeOnce = (value: unknown): string => String(value ?? '')

export const json = (value: unknown): string => JSON.stringify(value) ?? 'null'

export const defaultValue = (value: unknown, fallback: unknown): any => (value ?? fallback) as any

export const t = (key: string, params?: Record<string, string | number>): string => (params ? `${key} ${JSON.stringify(params)}` : key)

export const translate = t

export const assetUrl = (file: string): string => file

export const imageUrl = (src: unknown, _size?: number | string | ImageSizeOptions): string => String(src ?? '')

export const money = (cents: unknown): string => String(cents ?? '')

export const moneyWithCurrency = (cents: unknown): string => String(cents ?? '')

export const moneyWithoutCurrency = (cents: unknown): string => String(cents ?? '')

export const moneyWithoutTrailingZeros = (cents: unknown): string => String(cents ?? '')

export const weightWithUnit = (value: unknown): string => String(value ?? '')
