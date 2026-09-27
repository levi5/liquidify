import { ASTParser } from '../dist/infra/adapters/parsers/babel/ASTParser.js'
import { ComponentExtractor } from '../dist/infra/adapters/parsers/babel/component/index.js'
import { CSSImportExtractor } from '../dist/infra/adapters/parsers/babel/css/import-extractor.js'
import { LiquidParser } from '../dist/infra/adapters/parsers/babel/liquid-parser.js'
import { ReactComponentCompiler } from '../dist/infra/adapters/compilers/react/component-compiler.js'
import { CssInjector } from '../dist/infra/adapters/compilers/react/runtime/css-injector.js'
import { EsbuildCompiler } from '../dist/infra/adapters/compilers/esbuild/esbuild-compiler.js'
import { ScriptGenerator } from '../dist/infra/adapters/parsers/babel/script/script-generator.js'
import { BabelLiquidParser } from '../dist/infra/adapters/parsers/babel/babel-parser.js'
import { SchemaExtractor } from '../dist/infra/adapters/parsers/babel/schema/schema-extractor.js'
import { ModuleResolver } from '../dist/infra/adapters/fs/module-resolver.js'
import { NodeFileSystem } from '../dist/infra/adapters/fs/node-file-system.js'
import { ConsoleLogger } from '../dist/shared/logger.js'

export function makeParser() {
  const compiler = new EsbuildCompiler()
  const fileSystem = new NodeFileSystem()
  const logger = new ConsoleLogger()
  return new BabelLiquidParser({
    astParser: new ASTParser(),
    componentExtractor: new ComponentExtractor(),
    cssExtractor: new CSSImportExtractor(fileSystem, logger),
    jsxConverter: new LiquidParser(compiler, fileSystem, logger),
    reactCompiler: new ReactComponentCompiler(compiler, new CssInjector(), {}, process.cwd(), logger),
    schemaExtractor: new SchemaExtractor(fileSystem, new ModuleResolver(fileSystem), logger),
    scriptGenerator: new ScriptGenerator(compiler),
  })
}

export async function captureConsole(fn) {
  const warns = []
  const errors = []
  const origWarn = console.warn
  const origError = console.error
  console.warn = (...args) => warns.push(args.map(String).join(' '))
  console.error = (...args) => errors.push(args.map(String).join(' '))
  try {
    const result = await fn()
    return { result, warns, errors }
  } finally {
    console.warn = origWarn
    console.error = origError
  }
}
