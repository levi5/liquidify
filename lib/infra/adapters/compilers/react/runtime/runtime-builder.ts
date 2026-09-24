import { _match } from 'funcio'
import { LiquidifyError } from '../../../../../core/errors/liquidify-error'
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

    const output = result.outputFiles?.[0]?.text
    return _match(output === undefined || output === '')
      .with(true, () => {
        throw new LiquidifyError('Failed to bundle the React runtime: esbuild returned no output.')
      })
      .with(false, () => output as string)
      .exec() as string
  }
}
