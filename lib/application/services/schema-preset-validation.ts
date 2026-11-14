import { ValidationError } from '../../core/errors/validation-error'

function fail(message: string, filename?: string): never {
  throw new ValidationError(`Invalid schema: ${message}`, filename)
}

export function validateSchemaPresets(schema: Record<string, unknown>, filename?: string): void {
  const blocks = Array.isArray(schema.blocks) ? (schema.blocks as Record<string, unknown>[]) : []
  const settings = Array.isArray(schema.settings) ? (schema.settings as Record<string, unknown>[]) : []
  const settingsIds = new Set(settings.map((setting) => setting.id).filter(Boolean))
  const blockTypes = new Set(blocks.map((block) => block.type))
  for (const preset of Array.isArray(schema.presets) ? (schema.presets as Record<string, unknown>[]) : []) {
    if (preset.settings !== undefined) {
      if (typeof preset.settings !== 'object' || preset.settings === null || Array.isArray(preset.settings)) {
        fail('preset settings must be an object', filename)
      }
      for (const settingId of Object.keys(preset.settings)) {
        if (!settingsIds.has(settingId)) fail(`preset references unknown setting "${settingId}"`, filename)
      }
    }
    if (preset.blocks === undefined) continue
    if (!Array.isArray(preset.blocks)) fail('preset blocks must be an array', filename)
    const counts = new Map<string, number>()
    for (const block of preset.blocks) {
      if (typeof block !== 'object' || block === null || typeof block.type !== 'string' || !blockTypes.has(block.type)) {
        fail('preset references an unknown block type', filename)
      }
      counts.set(block.type, (counts.get(block.type) ?? 0) + 1)
    }
    if (typeof schema.max_blocks === 'number' && preset.blocks.length > schema.max_blocks) {
      fail('preset exceeds max_blocks', filename)
    }
    for (const block of blocks) {
      if (typeof block.limit === 'number' && (counts.get(block.type as string) ?? 0) > block.limit) {
        fail(`preset exceeds limit for block "${block.type}"`, filename)
      }
    }
  }
}

export function validateSchemaLimits(schema: Record<string, unknown>, filename?: string): void {
  if (
    schema.max_blocks !== undefined &&
    (!Number.isInteger(schema.max_blocks) || Number(schema.max_blocks) < 0 || Number(schema.max_blocks) > 50)
  ) {
    fail('max_blocks must be an integer between 0 and 50', filename)
  }
  for (const block of Array.isArray(schema.blocks) ? (schema.blocks as Record<string, unknown>[]) : []) {
    if (block.limit !== undefined && (!Number.isInteger(block.limit) || Number(block.limit) < 1 || Number(block.limit) > 50)) {
      fail(`limit for block "${block.type}" must be an integer between 1 and 50`, filename)
    }
  }
}
