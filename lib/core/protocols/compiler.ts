export interface TranspileOptions {
  loader?: 'ts' | 'js' | 'jsx' | 'tsx'
  format?: 'esm' | 'cjs' | 'iife'
  minify?: boolean
}

export interface EsbuildOptions {
  entryPoints?: string[]
  bundle?: boolean
  outfile?: string
  write?: boolean
  plugins?: unknown[]
  [key: string]: unknown
}

export interface BuildResult {
  outputFiles?: { path: string; text: string }[]
  [key: string]: unknown
}

export type BuildOptions = EsbuildOptions & Record<string, unknown>

export interface Compiler {
  transpileSync(code: string, options?: TranspileOptions): { code: string }
  build(options: BuildOptions): Promise<BuildResult>
}
