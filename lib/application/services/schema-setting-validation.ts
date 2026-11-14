import { ValidationError } from '@core/errors/validation-error'

const SETTING_TYPES = new Set([
  'article',
  'blog',
  'checkbox',
  'collection',
  'collection_list',
  'color',
  'color_background',
  'color_scheme',
  'font_picker',
  'header',
  'html',
  'image_picker',
  'inline_richtext',
  'link_list',
  'liquid',
  'metaobject',
  'metaobject_list',
  'number',
  'page',
  'paragraph',
  'product',
  'product_list',
  'radio',
  'range',
  'richtext',
  'select',
  'text',
  'textarea',
  'text_alignment',
  'url',
  'video',
  'video_url',
])

function fail(message: string, filename?: string): never {
  throw new ValidationError(`Invalid schema: ${message}`, filename)
}

function validateRange(setting: Record<string, unknown>, location: string, filename?: string): void {
  const { min, max, default: defaultValue } = setting
  const step = setting.step ?? 1
  if (![min, max, step, defaultValue].every((value) => typeof value === 'number' && Number.isFinite(value))) {
    fail(`${location} range requires finite min, max, default and an optional numeric step`, filename)
  }
  const minimum = min as number
  const maximum = max as number
  const increment = step as number
  const initial = defaultValue as number
  if (minimum >= maximum || increment <= 0 || initial < minimum || initial > maximum) {
    fail(`${location} range requires min < max, step > 0 and default within bounds`, filename)
  }
  const steps = (maximum - minimum) / increment
  const defaultSteps = (initial - minimum) / increment
  if (steps > 100 || Math.abs(steps - Math.round(steps)) > 1e-7 || Math.abs(defaultSteps - Math.round(defaultSteps)) > 1e-7) {
    fail(`${location} range must have at most 101 values and align max/default to step`, filename)
  }
}

function validateChoices(setting: Record<string, unknown>, location: string, filename?: string): void {
  if (!Array.isArray(setting.options) || setting.options.length === 0) fail(`${location} requires nonempty options`, filename)
  const values = new Set<string>()
  for (const option of setting.options) {
    if (typeof option !== 'object' || option === null || !('value' in option) || !('label' in option)) {
      fail(`${location} options require value and label`, filename)
    }
    if (typeof option.value !== 'string' || typeof option.label !== 'string' || !option.label.trim()) {
      fail(`${location} option value and label must be strings with a nonempty label`, filename)
    }
    if (values.has(option.value)) fail(`${location} has duplicate option "${option.value}"`, filename)
    values.add(option.value)
  }
  if (setting.default !== undefined && !values.has(setting.default as string)) fail(`${location} default must match an option`, filename)
}

export function validateSchemaSetting(setting: Record<string, unknown>, location: string, filename?: string): void {
  if (!SETTING_TYPES.has(setting.type as string)) fail(`${location} has unsupported setting type "${setting.type}"`, filename)
  if (setting.label !== undefined && (typeof setting.label !== 'string' || !setting.label.trim())) {
    fail(`${location} label must be a nonempty string`, filename)
  }
  if (setting.type === 'range') validateRange(setting, location, filename)
  if (setting.type === 'select' || setting.type === 'radio') validateChoices(setting, location, filename)
  if (setting.type === 'checkbox' && setting.default !== undefined && typeof setting.default !== 'boolean') {
    fail(`${location} checkbox default must be boolean`, filename)
  }
  if (
    setting.type === 'number' &&
    setting.default !== undefined &&
    (typeof setting.default !== 'number' || !Number.isFinite(setting.default))
  ) {
    fail(`${location} number default must be finite`, filename)
  }
}
