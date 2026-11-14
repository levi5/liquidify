import type { LiquidifyPlugin } from '../protocols/plugin'
import type { BuildLimits } from './build-limits'

export interface LiquidifyConfig {
  componentsDir: string
  output: string
  react?: { strictCsp?: boolean }
  force?: boolean
  plugins?: LiquidifyPlugin[]
  cwd?: string
  concurrency?: number
  limits?: Partial<BuildLimits>
  mode?: 'development' | 'production'
  sourcemap?: boolean
}

export const DEFAULT_CONFIG: LiquidifyConfig = {
  componentsDir: 'src/components',
  output: 'liquidify',
  react: { strictCsp: true },
}
