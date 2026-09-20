import fs from 'node:fs'
import path from 'node:path'
import { _Maybe, _match } from 'funcio'
import { _try } from 'funcio/lib/Monads/Either'
import { DEFAULT_CONFIG, type LiquidifyConfig } from '../../../core/entities/config'
import { ValidationError } from '../../../core/errors/validation-error'

const configFiles = ['liquidify.config.json', '.liquidifyrc.json', '.liquidifyrc', 'liquidx.config.json', '.liquidxrc.json', '.liquidxrc']

export function loadConfig(cwd: string = process.cwd()): LiquidifyConfig {
  const found = configFiles.map((file) => ({ file, fullPath: path.resolve(cwd, file) })).find(({ fullPath }) => fs.existsSync(fullPath))
  return _Maybe
    .of(found)
    .map((entry) => readConfig(entry!.file, entry!.fullPath))
    .getOrElse({ ...DEFAULT_CONFIG })
}

function readConfig(file: string, fullPath: string): LiquidifyConfig {
  const result = _try.sync(() => fs.readFileSync(fullPath, 'utf-8'))
  return result.match({
    right: (content: string) => parseConfig(file, fullPath, content),
    left: (error: Error) => {
      throw new ValidationError(`Unable to read ${file}: ${error.message}`, fullPath)
    },
  }) as LiquidifyConfig
}

function parseConfig(file: string, fullPath: string, content: string): LiquidifyConfig {
  const parsed = _try.sync(() => JSON.parse(content))
  return parsed.match({
    right: (value: unknown) => validateConfig(fullPath, value),
    left: (error: Error) => {
      throw new ValidationError(`Invalid JSON in ${file}: ${error.message}`, fullPath)
    },
  }) as LiquidifyConfig
}

function validateConfig(fullPath: string, value: unknown): LiquidifyConfig {
  return _match(typeof value === 'object' && value !== null && !Array.isArray(value))
    .with(false, () => {
      throw new ValidationError('Configuration must be a JSON object.', fullPath)
    })
    ._(() => {
      const raw = value as Record<string, unknown>
      const merged = { ...DEFAULT_CONFIG, ...raw }
      _match(typeof merged.componentsDir === 'string' && typeof merged.output === 'string')
        .with(false, () => {
          throw new ValidationError('Configuration requires string componentsDir and output.', fullPath)
        })
        ._(() => null)
        .exec()
      return merged as LiquidifyConfig
    })
    .exec() as LiquidifyConfig
}
