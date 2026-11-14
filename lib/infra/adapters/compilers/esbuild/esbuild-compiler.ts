import * as esbuild from 'esbuild'
import type { BuildResult, Compiler, BuildOptions, TranspileOptions } from '@core/protocols/compiler'

const PURE_ANNOTATION_PATTERN = /\/\*\s*@__PURE__\s*\*\/\s?/g

export class EsbuildCompiler implements Compiler {
  constructor(private readonly options: { mode?: 'development' | 'production'; sourcemap?: boolean } = {}) {}

  transpileSync(code: string, options?: TranspileOptions): { code: string } {
    const result = esbuild.transformSync(code, {
      loader: options?.loader ?? 'tsx',
      format: options?.format,
      minify: options?.minify,
      ...(this.options.mode === 'development' ? { minify: false } : {}),
      sourcemap: this.options.sourcemap ? 'inline' : false,
    })
    return { code: result.code.replace(PURE_ANNOTATION_PATTERN, '') }
  }

  async build(options: BuildOptions): Promise<BuildResult> {
    const result = await esbuild.build({
      ...options,
      ...(this.options.mode === 'development'
        ? { minify: false, minifySyntax: false, minifyWhitespace: false, minifyIdentifiers: false }
        : {}),
      ...(this.options.sourcemap ? { sourcemap: 'inline' } : {}),
    } as Parameters<typeof esbuild.build>[0])
    return result as unknown as BuildResult
  }
}
