import { _match } from 'funcio'
import { ValidationError } from '../../core/errors/validation-error'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  _match(typeof value === 'object' && value !== null && !Array.isArray(value))
    .with(true, () => true)
    .with(false, () => false)
    .exec() as boolean

export class SchemaValidator {
  public validate(schema: unknown, filePath?: string): void {
    const value = this.asObject(schema, 'schema', filePath)
    this.validateName(value, filePath)
    this.validateSettingsBlock(value, filePath)
    this.validateBlocksBlock(value, filePath)
    this.validatePresetsBlock(value, filePath)
  }

  private fail(message: string, filePath?: string): never {
    throw new ValidationError(`Invalid schema: ${message}`, filePath)
  }

  private asObject(value: unknown, location: string, filePath?: string): Record<string, unknown> {
    return _match(isRecord(value))
      .with(true, () => value as Record<string, unknown>)
      .with(false, () => this.fail(`${location} must be an object`, filePath))
      .exec() as Record<string, unknown>
  }

  private asEntries(value: unknown, location: string, filePath?: string): Record<string, unknown>[] {
    return _match(Array.isArray(value))
      .with(true, () => (value as unknown[]).map((entry, index) => this.asObject(entry, `${location}[${index}]`, filePath)))
      .with(false, () => this.fail(`${location} must be an array`, filePath))
      .exec() as Record<string, unknown>[]
  }

  private validateName(value: Record<string, unknown>, filePath?: string): void {
    _match('name' in value && (typeof value.name !== 'string' || !value.name.trim()))
      .with(true, () => this.fail('name must be a nonempty string', filePath))
      .with(false, () => null)
      .exec()
  }

  private validateSettingsBlock(value: Record<string, unknown>, filePath?: string): void {
    _match('settings' in value)
      .with(true, () => this.validateSettings(value.settings, 'settings', filePath))
      .with(false, () => null)
      .exec()
  }

  private validateBlocksBlock(value: Record<string, unknown>, filePath?: string): void {
    _match('blocks' in value)
      .with(true, () => this.validateBlocks(value.blocks, filePath))
      .with(false, () => null)
      .exec()
  }

  private validatePresetsBlock(value: Record<string, unknown>, filePath?: string): void {
    _match('presets' in value)
      .with(true, () => this.validatePresets(value.presets, filePath))
      .with(false, () => null)
      .exec()
  }

  private validateSettings(value: unknown, location: string, filePath?: string): void {
    const ids = new Set<string>()
    this.asEntries(value, location, filePath).forEach((setting) => {
      this.validateSetting(setting, location, ids, filePath)
    })
  }

  private validateSetting(setting: Record<string, unknown>, location: string, ids: Set<string>, filePath?: string): void {
    _match(typeof setting.type !== 'string' || !setting.type)
      .with(true, () => this.fail(`${location} entries require a type`, filePath))
      .with(false, () => this.validateSettingId(setting, location, ids, filePath))
      .exec()
  }

  private validateSettingId(setting: Record<string, unknown>, location: string, ids: Set<string>, filePath?: string): void {
    _match(setting.type === 'header' || setting.type === 'paragraph')
      .with(true, () => null)
      .with(false, () => this.requireSettingId(setting, location, ids, filePath))
      .exec()
  }

  private requireSettingId(setting: Record<string, unknown>, location: string, ids: Set<string>, filePath?: string): void {
    _match(typeof setting.id !== 'string' || !setting.id)
      .with(true, () => this.fail(`${location} entries require an id`, filePath))
      .with(false, () => this.registerSettingId(setting.id as string, location, ids, filePath))
      .exec()
  }

  private registerSettingId(id: string, location: string, ids: Set<string>, filePath?: string): void {
    _match(ids.has(id))
      .with(true, () => this.fail(`duplicate setting id "${id}" in ${location}`, filePath))
      .with(false, () => ids.add(id))
      .exec()
  }

  private validateBlocks(blocks: unknown, filePath?: string): void {
    const types = new Set<string>()
    this.asEntries(blocks, 'blocks', filePath).forEach((block) => {
      this.validateBlock(block, types, filePath)
    })
  }

  private validateBlock(block: Record<string, unknown>, types: Set<string>, filePath?: string): void {
    _match(typeof block.type !== 'string' || !block.type)
      .with(true, () => this.fail('blocks require a type', filePath))
      .with(false, () => this.registerBlockType(block, types, filePath))
      .exec()
  }

  private registerBlockType(block: Record<string, unknown>, types: Set<string>, filePath?: string): void {
    const type = block.type as string
    _match(types.has(type))
      .with(true, () => this.fail(`duplicate block type "${type}"`, filePath))
      .with(false, () => this.validateBlockSettings(block, type, types, filePath))
      .exec()
  }

  private validateBlockSettings(block: Record<string, unknown>, type: string, types: Set<string>, filePath?: string): void {
    types.add(type)
    _match('settings' in block)
      .with(true, () => this.validateSettings(block.settings, `block ${type}.settings`, filePath))
      .with(false, () => null)
      .exec()
  }

  private validatePresets(presets: unknown, filePath?: string): void {
    this.asEntries(presets, 'presets', filePath).forEach((preset) => {
      this.validatePreset(preset, filePath)
    })
  }

  private validatePreset(preset: Record<string, unknown>, filePath?: string): void {
    _match(typeof preset.name !== 'string' || !preset.name.trim())
      .with(true, () => this.fail('presets require a name', filePath))
      .with(false, () => null)
      .exec()
  }
}
