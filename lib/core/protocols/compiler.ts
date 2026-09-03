export interface TranspileOptions {
  loader?: 'ts' | 'js' | 'jsx' | 'tsx'
  format?: 'esm' | 'cjs' | 'iife'
  minify?: boolean
}

export type BuildOptions = any

export interface Compiler {
  transpileSync(code: string, options?: TranspileOptions): { code: string }
  build(options: BuildOptions): Promise<any>
}
