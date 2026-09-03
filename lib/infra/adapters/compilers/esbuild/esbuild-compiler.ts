import * as esbuild from 'esbuild'
import { Compiler, BuildOptions, TranspileOptions } from '../../../../core/protocols/compiler'

export class EsbuildCompiler implements Compiler {
  transpileSync(code: string, options?: TranspileOptions): { code: string } {
    return esbuild.transformSync(code, options as any)
  }

  async build(options: BuildOptions): Promise<any> {
    return esbuild.build(options as any)
  }
}
