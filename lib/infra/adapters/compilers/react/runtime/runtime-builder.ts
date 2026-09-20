import { readReactTemplate, reactTemplatesDirectory } from './template-loader'
import type { Compiler } from '../../../../../core/protocols/compiler'

export class ReactRuntimeBuilder {
  constructor(private readonly compiler: Compiler) {}

  public async build(): Promise<string> {
    const result = await this.compiler.build({
      stdin: {
        contents: readReactTemplate('runtime.ts'),
        resolveDir: reactTemplatesDirectory,
        loader: 'ts',
      },
      bundle: true,
      write: false,
      format: 'iife',
      platform: 'browser',
      minify: true,
      target: ['es2020'],
    })

    return result.outputFiles[0].text
  }
}
