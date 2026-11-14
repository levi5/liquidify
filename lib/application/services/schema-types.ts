import { SchemaValidator } from './schema-validation'

const RESOURCE_TYPES: Record<string, string> = {
  product: 'Product',
  product_list: 'Product[]',
  collection: 'Collection',
  collection_list: 'Collection[]',
  image_picker: 'ShopifyImage',
  page: 'Page',
  article: 'Article',
  blog: 'Blog',
  link_list: 'Menu',
}

function settingType(setting: Record<string, unknown>): string {
  if (setting.type === 'checkbox') return 'boolean'
  if (setting.type === 'range' || setting.type === 'number') return 'number'
  if (setting.type === 'select' || setting.type === 'radio') {
    return (setting.options as Array<{ value: string }>).map((option) => JSON.stringify(option.value)).join(' | ')
  }
  const resource = RESOURCE_TYPES[setting.type as string]
  if (resource) return `${resource} | null`
  if (['metaobject', 'metaobject_list', 'video'].includes(setting.type as string)) return 'unknown'
  return 'string'
}

function settingsType(settings: unknown): string {
  const entries = (Array.isArray(settings) ? (settings as Record<string, unknown>[]) : [])
    .filter((setting) => typeof setting.id === 'string' && setting.type !== 'header' && setting.type !== 'paragraph')
    .map((setting) => `  ${JSON.stringify(setting.id)}: ${settingType(setting)}`)
  return `{\n${entries.join('\n')}\n}`
}

/** Resource settings remain nullable because merchants can leave them unset. */
export function generateSchemaTypes(schema: Record<string, unknown>): string {
  new SchemaValidator().validate(schema)
  const settings = `export type SectionSettings = ${settingsType(schema.settings)}`
  const blocks = (Array.isArray(schema.blocks) ? (schema.blocks as Record<string, unknown>[]) : []).map(
    (block) => `{ id: string; type: ${JSON.stringify(block.type)}; settings: ${settingsType(block.settings)} }`,
  )
  const declarations = `${settings}\n\nexport type SectionBlock = ${blocks.length ? blocks.join(' | ') : 'never'}\n`
  const names = ['Product', 'Collection', 'ShopifyImage', 'Page', 'Article', 'Blog', 'Menu'].filter((name) =>
    new RegExp(`\\b${name}\\b`).test(declarations),
  )
  const imports = names.length ? `import type { ${names.join(', ')} } from "liquidify"\n\n` : ''
  return `${imports}${declarations}`
}
