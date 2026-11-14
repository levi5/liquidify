import path from 'node:path'
import type { CompileOptions, CompileResult } from '@core/entities/compile-result'
import { SilentLogger } from '@shared/logger'
import { NodeFileSystem } from '@adapters/fs/node-file-system'
import { EsbuildCompiler } from '@adapters/compilers/esbuild/esbuild-compiler'
import { makeComponentParser } from '@main/factories/make-component-parser'
import { ValidationService } from '@application/services/validation-service'
import { SchemaValidator } from '@application/services/schema-validation'
import { buildLiquidContent } from '@adapters/generators/liquid/liquid-content'
import { toSafeFileName } from '@shared/string'
import { errorDiagnostic } from '@application/services/diagnostics'
import { DEFAULT_BUILD_LIMITS } from '@core/entities/build-limits'

export async function compile(source: string, options: CompileOptions = {}): Promise<CompileResult> {
  const projectRoot = path.resolve(options.cwd ?? process.cwd())
  const filename = options.filename ? path.resolve(projectRoot, options.filename) : undefined
  const result: CompileResult = { assets: [], diagnostics: [] }
  try {
    options.signal?.throwIfAborted()
    if (Buffer.byteLength(source, 'utf8') > DEFAULT_BUILD_LIMITS.maxSourceBytes)
      throw new Error('Source exceeds the default maxSourceBytes limit.')
    if (!source.trim()) return result
    const { parser } = makeComponentParser({
      projectRoot,
      fileSystem: new NodeFileSystem(),
      compiler: new EsbuildCompiler({ mode: options.mode, sourcemap: options.sourcemap }),
      logger: options.logger ?? new SilentLogger(),
      react: options.react,
    })
    const component = await parser.parse(source, filename)
    new ValidationService(new SchemaValidator()).validate(component, filename)
    options.signal?.throwIfAborted()
    if (!component.name) return result
    result.name = component.name
    const basename = toSafeFileName(component.name)
    const scriptOnly = component.mode === 'react' || (!component.type && (component.mode === 'dom' || component.mode === 'dom:global'))
    if (!scriptOnly) result.liquid = buildLiquidContent(component, basename)
    if (component.hasScript && component.script) result.assets.push({ filename: `${basename}.js`, content: component.script })
    if (component.globalCss) result.assets.push({ filename: 'global.css', content: component.globalCss })
  } catch (error) {
    result.diagnostics.push(errorDiagnostic(error, source))
  }
  return result
}
