import fs from 'fs'
import path from 'path'
import { DEFAULT_CONFIG, LiquidifyConfig } from '../../../core/entities/config'

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
      if (fs.existsSync(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, 'utf-8')
          const parsed = JSON.parse(content)
          return { ...DEFAULT_CONFIG, ...parsed }
        } catch (e) {
          console.error(`Failed to parse configuration from ${file}:`, e)
        }
      }
    }

    return DEFAULT_CONFIG
  }
}
