import fs from 'fs'
import path from 'path'
import { _try } from 'funcio/lib/Monads/Either'
import { DEFAULT_CONFIG, LiquidifyConfig } from '../../../core/entities/config'

const KNOWN_KEYS = ['componentsDir', 'output'] as const

export class ConfigLoader {
  static load(cwd: string = process.cwd()): LiquidifyConfig {
    const configFiles = [
      'liquidify.config.json',
      '.liquidifyrc.json',
      '.liquidifyrc',
      'liquidx.config.json',
      '.liquidxrc.json',
      '.liquidxrc',
    ]

    for (const file of configFiles) {
      const fullPath = path.resolve(cwd, file)
      if (!fs.existsSync(fullPath)) continue

      const result = _try.sync(() => {
        const content = fs.readFileSync(fullPath, 'utf-8')
        return ConfigLoader.validate(JSON.parse(content) as unknown, file, cwd)
      })

      if (result.isLeft()) {
        console.error(`Failed to parse configuration from ${file}:`, result.value as Error)
        continue
      }

      return result.value as LiquidifyConfig
    }

    return DEFAULT_CONFIG
  }

  private static validate(parsed: unknown, file: string, cwd: string): LiquidifyConfig {
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      console.warn(
        `Invalid configuration in ${file}: expected an object like { "componentsDir": "src/components", "output": "." }. Using defaults.`,
      )
      return DEFAULT_CONFIG
    }

    const record = parsed as Record<string, unknown>
    for (const key of Object.keys(record)) {
      if (!(KNOWN_KEYS as readonly string[]).includes(key)) {
        console.warn(`Unknown configuration key "${key}" in ${file}. Expected only: ${KNOWN_KEYS.join(', ')}.`)
      }
    }

    const config: LiquidifyConfig = { ...DEFAULT_CONFIG }
    for (const key of KNOWN_KEYS) {
      const value = record[key]
      if (typeof value === 'undefined') continue
      if (typeof value !== 'string' || !value) {
        console.warn(
          `Invalid configuration value for "${key}" in ${file}: expected a non-empty string. Using default "${DEFAULT_CONFIG[key]}".`,
        )
        continue
      }
      config[key] = value
    }

    if (!fs.existsSync(path.resolve(cwd, config.componentsDir))) {
      console.warn(
        `Configured componentsDir "${config.componentsDir}" in ${file} does not exist (resolved from ${cwd}). The build will produce no output.`,
      )
    }

    return config
  }
}
