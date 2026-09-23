export interface GeneratorOptions {
  outputDir: string
  sectionsDir?: string
  blocksDir?: string
  snippetsDir?: string
  assetsDir?: string
  force?: boolean
}

export interface ResolvedGeneratorOptions {
  outputDir: string
  sectionsDir: string
  blocksDir: string
  snippetsDir: string
  assetsDir: string
  force?: boolean
}
