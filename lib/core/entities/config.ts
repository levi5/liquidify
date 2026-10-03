import type { LiquidifyPlugin } from '../protocols/plugin'

export interface LiquidifyConfig {
  componentsDir: string
  output: string
  react?: { strictCsp?: boolean }
  force?: boolean
  plugins?: LiquidifyPlugin[]
}

export const DEFAULT_CONFIG: LiquidifyConfig = {
  componentsDir: 'src/components',
  output: 'liquidify',
  react: { strictCsp: true },
}
