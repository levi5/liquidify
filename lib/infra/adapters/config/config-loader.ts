import { _match, _try } from 'funcio'
import fs from 'node:fs'
import path from 'node:path'
import { DEFAULT_CONFIG, type LiquidifyConfig } from '../../../core/entities/config'
import { ValidationError } from '../../../core/errors/validation-error'

const configFiles = ['liquidify.config.json', '.liquidifyrc.json', '.liquidifyrc', 'liquidx.config.json', '.liquidxrc.json', '.liquidxrc']

const ALLOWED_KEYS = new Set(['componentsDir', 'output', 'react', 'force', 'plugins'])

export function loadConfig(cwd: string = process.cwd(), explicitPath?: string): LiquidifyConfig {
  if (explicitPath !== undefined && explicitPath.trim() !== '') {
    return loadConfigFromFile(path.resolve(cwd, explicitPath))
  }
  const fullPath = configFiles.map((file) => path.resolve(cwd, file)).find((file) => fs.existsSync(file))
  return _match(fullPath === undefined)
    .with(true, () => ({ ...DEFAULT_CONFIG, react: { ...DEFAULT_CONFIG.react } }))
    .with(false, () => readConfig(fullPath as string))
    .exec() as LiquidifyConfig
}

export function loadConfigFromFile(filePath: string): LiquidifyConfig {
  const resolved = path.resolve(filePath)
  if (!fs.existsSync(resolved)) {
    throw new ValidationError(`Config file not found: ${resolved}.`, resolved)
  }
  return readConfig(resolved)
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1
  const cols = b.length + 1
  const grid: number[][] = Array.from({ length: rows }, (_, i) => [i, ...Array(cols - 1).fill(0)])
  for (let j = 1; j < cols; j += 1) grid[0][j] = j
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      grid[i][j] = Math.min(grid[i - 1][j] + 1, grid[i][j - 1] + 1, grid[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1))
    }
  }
  return grid[a.length][b.length]
}

function suggestKey(unknownKey: string, allowed: Set<string> | string[]): string {
  const candidates = [...allowed]
  let best: string | undefined
  let bestScore = Number.POSITIVE_INFINITY
  for (const candidate of candidates) {
    const score = levenshtein(unknownKey, candidate)
    if (score < bestScore) {
      bestScore = score
      best = candidate
    }
  }
  if (best !== undefined && bestScore <= Math.max(2, Math.floor(unknownKey.length / 2))) return ` Did you mean "${best}"?`
  return ''
}

function readConfig(fullPath: string): LiquidifyConfig {
  const content = attempt(() => fs.readFileSync(fullPath, 'utf-8'), `Unable to read ${path.basename(fullPath)}`, fullPath)
  const value: unknown = attempt(() => JSON.parse(content) as unknown, `Invalid JSON in ${path.basename(fullPath)}`, fullPath)
  return validateConfig(fullPath, value)
}

function attempt<T>(operation: () => T, message: string, fullPath: string): T {
  return _try.sync(operation).match({
    right: (value) => value,
    left: (error) => {
      throw new ValidationError(`${message}: ${error.message}`, fullPath)
    },
  })
}

function validateConfig(fullPath: string, value: unknown): LiquidifyConfig {
  const raw = _match(typeof value === 'object' && value !== null && !Array.isArray(value))
    .with(true, () => value as Record<string, unknown>)
    .with(false, () => {
      throw new ValidationError('Configuration must be a JSON object.', fullPath)
    })
    .exec() as Record<string, unknown>
  const unknownKey = Object.keys(raw).find((key) => !ALLOWED_KEYS.has(key))
  _match(unknownKey === undefined)
    .with(true, () => undefined)
    .with(false, () => {
      throw new ValidationError(`Unknown configuration key "${unknownKey}".${suggestKey(unknownKey as string, ALLOWED_KEYS)}`, fullPath)
    })
    .exec()
  const merged = { ...DEFAULT_CONFIG, ...raw }
  _match(isNonEmptyString(merged.componentsDir) && isNonEmptyString(merged.output))
    .with(true, () => undefined)
    .with(false, () => {
      throw new ValidationError('Configuration requires non-empty string componentsDir and output.', fullPath)
    })
    .exec()
  _match(merged.force === undefined || typeof merged.force === 'boolean')
    .with(true, () => undefined)
    .with(false, () => {
      throw new ValidationError('Configuration force must be a boolean.', fullPath)
    })
    .exec()
  const react = validateReact(fullPath, raw.react)
  const cwd = path.dirname(fullPath)
  return {
    ...merged,
    componentsDir: path.resolve(cwd, merged.componentsDir as string),
    output: path.resolve(cwd, merged.output as string),
    react: { ...DEFAULT_CONFIG.react, ...react },
  }
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== ''
}

function validateReact(fullPath: string, react: unknown): LiquidifyConfig['react'] {
  return _match(react === undefined)
    .with(true, () => undefined)
    .with(false, () => checkReactShape(fullPath, react as Record<string, unknown>))
    .exec() as LiquidifyConfig['react']
}

function checkReactShape(fullPath: string, react: Record<string, unknown>): LiquidifyConfig['react'] {
  _match(typeof react === 'object' && react !== null && !Array.isArray(react))
    .with(true, () => undefined)
    .with(false, () => {
      throw new ValidationError('Configuration react must be an object.', fullPath)
    })
    .exec()
  const unknownKey = Object.keys(react).find((key) => key !== 'strictCsp')
  _match(unknownKey === undefined)
    .with(true, () => undefined)
    .with(false, () => {
      throw new ValidationError(`Unknown configuration key "react.${unknownKey}".`, fullPath)
    })
    .exec()
  _match(react.strictCsp === undefined || typeof react.strictCsp === 'boolean')
    .with(true, () => undefined)
    .with(false, () => {
      throw new ValidationError('Configuration react.strictCsp must be a boolean.', fullPath)
    })
    .exec()
  return react as LiquidifyConfig['react']
}

export const ConfigLoader = { load: loadConfig, loadFromFile: loadConfigFromFile }
