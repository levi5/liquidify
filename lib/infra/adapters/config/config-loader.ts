import { _match, _try } from 'funcio'
import fs from 'node:fs'
import path from 'node:path'
import { DEFAULT_CONFIG, type LiquidifyConfig } from '@core/entities/config'
import { ValidationError } from '@core/errors/validation-error'
import { resolvePlugins } from '@adapters/config/plugin-loader'
import { resolveBuildLimits } from '@core/entities/build-limits'
import { configurationKeySuggestion } from '@adapters/config/key-suggestion'

const configFiles = ['liquidify.config.json', '.liquidifyrc.json', '.liquidifyrc', 'liquidx.config.json', '.liquidxrc.json', '.liquidxrc']

export function configWatchPaths(cwd: string, explicitPath?: string): string[] {
  return explicitPath ? [path.resolve(cwd, explicitPath)] : configFiles.map((filename) => path.resolve(cwd, filename))
}

const ALLOWED_KEYS = new Set(['componentsDir', 'output', 'react', 'force', 'plugins', 'concurrency', 'limits', 'mode', 'sourcemap'])

export interface ConfigLoadOptions {
  plugins?: boolean
}

export function loadConfig(cwd: string = process.cwd(), explicitPath?: string, options: ConfigLoadOptions = {}): LiquidifyConfig {
  if (explicitPath !== undefined && explicitPath.trim() !== '') {
    return loadConfigFromFile(path.resolve(cwd, explicitPath), options)
  }
  const fullPath = configFiles.map((file) => path.resolve(cwd, file)).find((file) => fs.existsSync(file))
  return _match(fullPath === undefined)
    .with(true, () => ({
      ...DEFAULT_CONFIG,
      componentsDir: path.resolve(cwd, DEFAULT_CONFIG.componentsDir),
      output: path.resolve(cwd, DEFAULT_CONFIG.output),
      cwd: path.resolve(cwd),
      react: { ...DEFAULT_CONFIG.react },
    }))
    .with(false, () => readConfig(fullPath as string, options))
    .exec() as LiquidifyConfig
}

export function loadConfigFromFile(filePath: string, options: ConfigLoadOptions = {}): LiquidifyConfig {
  const resolved = path.resolve(filePath)
  if (!fs.existsSync(resolved)) {
    throw new ValidationError(`Config file not found: ${resolved}.`, resolved)
  }
  return readConfig(resolved, options)
}

function readConfig(fullPath: string, options: ConfigLoadOptions): LiquidifyConfig {
  const content = attempt(() => fs.readFileSync(fullPath, 'utf-8'), `Unable to read ${path.basename(fullPath)}`, fullPath)
  const value: unknown = attempt(() => JSON.parse(content) as unknown, `Invalid JSON in ${path.basename(fullPath)}`, fullPath)
  return validateConfig(fullPath, value, options)
}

function attempt<T>(operation: () => T, message: string, fullPath: string): T {
  return _try.sync(operation).match({
    right: (value) => value,
    left: (error) => {
      throw new ValidationError(`${message}: ${error.message}`, fullPath)
    },
  })
}

function validateConfig(fullPath: string, value: unknown, options: ConfigLoadOptions): LiquidifyConfig {
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
      throw new ValidationError(
        `Unknown configuration key "${unknownKey}".${configurationKeySuggestion(unknownKey as string, ALLOWED_KEYS)}`,
        fullPath,
      )
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
  if (raw.limits !== undefined) {
    if (typeof raw.limits !== 'object' || raw.limits === null || Array.isArray(raw.limits))
      throw new ValidationError('Configuration limits must be an object.', fullPath)
    attempt(() => resolveBuildLimits(raw.limits as Parameters<typeof resolveBuildLimits>[0]), 'Invalid build limits', fullPath)
  }
  if (raw.mode !== undefined && raw.mode !== 'development' && raw.mode !== 'production')
    throw new ValidationError('Configuration mode must be development or production.', fullPath)
  if (raw.sourcemap !== undefined && typeof raw.sourcemap !== 'boolean')
    throw new ValidationError('Configuration sourcemap must be boolean.', fullPath)
  const cwd = path.dirname(fullPath)
  const plugins = options.plugins === false ? [] : resolvePlugins(raw.plugins, fullPath)
  if (
    raw.concurrency !== undefined &&
    (!Number.isInteger(raw.concurrency) || Number(raw.concurrency) < 1 || Number(raw.concurrency) > 64)
  ) {
    throw new ValidationError('Configuration concurrency must be an integer between 1 and 64.', fullPath)
  }
  return {
    ...merged,
    cwd,
    componentsDir: path.resolve(cwd, merged.componentsDir as string),
    output: path.resolve(cwd, merged.output as string),
    react: { ...DEFAULT_CONFIG.react, ...react },
    plugins,
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
