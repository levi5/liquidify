import { _Maybe, _match } from 'funcio'
import { ValidationError } from '../../core/errors/validation-error'

export function validateSchema(schema: unknown, filePath?: string): void {
  const fail = (message: string): never => {
    throw new ValidationError(`Invalid schema: ${message}`, filePath)
  }
  const object = (value: unknown, location: string): Record<string, unknown> =>
    _match(Boolean(value && typeof value === 'object' && !Array.isArray(value)))
      .with(false, () => fail(`${location} must be an object`))
      .with(Boolean(value && typeof value === 'object' && !Array.isArray(value)), () => value as Record<string, unknown>)
      .exec() as Record<string, unknown>
  const entries = (value: unknown, location: string): Record<string, unknown>[] =>
    _match(Array.isArray(value))
      .with(false, () => fail(`${location} must be an array`))
      .with(Array.isArray(value), () => (value as unknown[]).map((entry, index) => object(entry, `${location}[${index}]`)))
      .exec() as Record<string, unknown>[]
  const settings = (value: unknown, location: string): void => {
    const ids = new Set<string>()
    entries(value, location).forEach((setting) => {
      checkSetting(setting, location, ids)
    })
  }
  const checkSetting = (setting: Record<string, unknown>, location: string, ids: Set<string>): void =>
    _match(typeof setting.type !== 'string' || !setting.type)
      .with(true, () => fail(`${location} entries require a type`))
      .with(typeof setting.type !== 'string' || !setting.type, () =>
        _match(setting.type === 'header' || setting.type === 'paragraph')
          .with(true, () => null)
          .with(setting.type === 'header' || setting.type === 'paragraph', () => {
            _match(typeof setting.id !== 'string' || !setting.id)
              .with(true, () => fail(`${location} entries require an id`))
              .with(typeof setting.id !== 'string' || !setting.id, () => null)
              .exec()
            const id = setting.id as string
            _match(ids.has(id))
              .with(true, () => fail(`duplicate setting id "${id}" in ${location}`))
              .with(ids.has(id), () => ids.add(id))
              .exec()
          })
          .exec(),
      )
      .exec()
  const value = object(schema, 'schema')
  _Maybe
    .of('name' in value && (typeof value.name !== 'string' || !(value.name as string).trim()))
    .map((invalid) => (invalid ? fail('name must be a nonempty string') : null))
    .getOrElse(null)
  _Maybe
    .of('settings' in value)
    .map((present) => (present ? settings(value.settings, 'settings') : null))
    .getOrElse(null)
  _Maybe
    .of('blocks' in value)
    .map((present) => (present ? checkBlocks(value.blocks) : null))
    .getOrElse(null)
  _Maybe
    .of('presets' in value)
    .map((present) => {
      if (present) {
        entries(value.presets, 'presets').forEach((preset) => {
          checkPreset(preset)
        })
      }
      return null
    })
    .getOrElse(null)

  function checkBlocks(blocks: unknown): void {
    const types = new Set<string>()
    entries(blocks, 'blocks').forEach((block) => {
      _match(typeof block.type !== 'string' || !block.type)
        .with(true, () => fail('blocks require a type'))
        .with(typeof block.type !== 'string' || !block.type, () => null)
        .exec()
      const type = block.type as string
      _match(types.has(type))
        .with(true, () => fail(`duplicate block type "${type}"`))
        .with(types.has(type), () => types.add(type))
        .exec()
      _Maybe
        .of('settings' in block)
        .map((present) => (present ? settings(block.settings, `block ${type}.settings`) : null))
        .getOrElse(null)
    })
  }

  function checkPreset(preset: Record<string, unknown>): void {
    _match(typeof preset.name !== 'string' || !(preset.name as string).trim())
      .with(true, () => fail('presets require a name'))
      .with(typeof preset.name !== 'string' || !(preset.name as string).trim(), () => null)
      .exec()
  }
}
