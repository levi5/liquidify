type MessageParams = Record<string, string | number>

const toI18nKey = (key: string) => key.replaceAll('.', '_')

const interpolate = (template: string, params: MessageParams = {}) =>
	Object.entries(params).reduce((text, [key, value]) => text.replaceAll(`{{ ${key} }}`, String(value)), template)

export const translate = (key: string, fallback: string, params?: MessageParams): string => {
	if (typeof window === 'undefined') return interpolate(fallback, params)

	const i18n = window.LiquidifyTheme?.i18n
	const entry = i18n?.[toI18nKey(key)]

	return interpolate(typeof entry === 'string' && entry ? entry : fallback, params)
}
