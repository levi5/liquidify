import * as esbuild from 'esbuild'
import type { BuildResult, Compiler, BuildOptions, TranspileOptions } from '../../../../core/protocols/compiler'

export class EsbuildCompiler implements Compiler {
  transpileSync(code: string, options?: TranspileOptions): { code: string } {
    return esbuild.transformSync(code, {
      loader: options?.loader ?? 'tsx',
      format: options?.format,
      minify: options?.minify,
    })
  }

  async build(options: BuildOptions): Promise<BuildResult> {
    const result = await esbuild.build(options as Parameters<typeof esbuild.build>[0])
    return result as unknown as BuildResult
  }
}
