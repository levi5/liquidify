export interface LiquidifyConfig {
  componentsDir: string
  output: string
  react?: { strictCsp?: boolean }
}

export const DEFAULT_CONFIG: LiquidifyConfig = {
  componentsDir: 'src/components',
  output: 'liquidify',
  react: { strictCsp: true },
}
