export interface LiquidifyConfig {
  componentsDir: string
  output: string
}

export const DEFAULT_CONFIG: LiquidifyConfig = {
  componentsDir: 'src/components',
  output: 'liquidify',
}
