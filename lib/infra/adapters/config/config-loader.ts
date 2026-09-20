import { _Maybe, _try } from 'funcio'
import fs from 'node:fs'
import path from 'node:path'
import { DEFAULT_CONFIG, type LiquidifyConfig } from '../../../core/entities/config'
import { ValidationError } from '../../../core/errors/validation-error'

const configFiles = ['liquidify.config.json', '.liquidifyrc.json', '.liquidifyrc', 'liquidx.config.json', '.liquidxrc.json', '.liquidxrc']

export function loadConfig(cwd: string = process.cwd()): LiquidifyConfig {
  const fullPath = configFiles.map((file) => path.resolve(cwd, file)).find((file) => fs.existsSync(file))
  return _Maybe
    .of(fullPath)
    .map((file) => readConfig(file!))
    .getOrElse({ ...DEFAULT_CONFIG, react: { ...DEFAULT_CONFIG.react } })
}

function readConfig(fullPath: string): LiquidifyConfig {
  const read = <T>(operation: () => T, message: string): T =>
    _try.sync(operation).match({
      right: (value) => value,
      left: (error) => {
        throw new ValidationError(`${message} ${path.basename(fullPath)}: ${error.message}`, fullPath)
      },
    })

  const content = read(() => fs.readFileSync(fullPath, 'utf-8'), 'Unable to read')
  const value: unknown = read(() => JSON.parse(content), 'Invalid JSON in')
  return validateConfig(fullPath, value)
}

function validateConfig(fullPath: string, value: unknown): LiquidifyConfig {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ValidationError('Configuration must be a JSON object.', fullPath)
  }
  const raw = value as Record<string, unknown>
  const merged = { ...DEFAULT_CONFIG, ...raw }
  if (typeof merged.componentsDir !== 'string' || typeof merged.output !== 'string') {
    throw new ValidationError('Configuration requires string componentsDir and output.', fullPath)
  }
  if (raw.react !== undefined) {
    if (typeof raw.react !== 'object' || raw.react === null || Array.isArray(raw.react)) {
      throw new ValidationError('Configuration react must be an object.', fullPath)
    }
    const react = raw.react as Record<string, unknown>
    if (react.strictCsp !== undefined && typeof react.strictCsp !== 'boolean') {
      throw new ValidationError('Configuration react.strictCsp must be a boolean.', fullPath)
    }
  }
  return { ...merged, react: { ...DEFAULT_CONFIG.react, ...(raw.react as LiquidifyConfig['react']) } }
}

/** Compatibility facade for consumers of the original configuration API. */
export const ConfigLoader = { load: loadConfig }
