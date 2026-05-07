export interface LiquidXConfig {
	componentsDir: string
	output: string
}

export const DEFAULT_CONFIG: LiquidXConfig = {
	componentsDir: 'src/components',
	output: 'liquidx',
}
