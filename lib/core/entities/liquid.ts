export interface GeneratorOptions {
  outputDir: string
  sectionsDir?: string
  blocksDir?: string
  snippetsDir?: string
  assetsDir?: string
}

export interface ResolvedGeneratorOptions {
  outputDir: string
  sectionsDir: string
  blocksDir: string
  snippetsDir: string
  assetsDir: string
}
