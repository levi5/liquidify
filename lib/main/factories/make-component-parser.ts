import type { IFileSystem } from '@core/protocols/file-system'
import type { Compiler } from '@core/protocols/compiler'
import type { Logger } from '@shared/logger'
import { ASTParser } from '@adapters/parsers/babel/ASTParser'
import { BabelLiquidParser } from '@adapters/parsers/babel/babel-parser'
import { ComponentExtractor } from '@adapters/parsers/babel/component'
import { CSSImportExtractor } from '@adapters/parsers/babel/css/import-extractor'
import { LiquidParser } from '@adapters/parsers/babel/liquid-parser'
import { SchemaExtractor } from '@adapters/parsers/babel/schema/schema-extractor'
import { ScriptGenerator } from '@adapters/parsers/babel/script/script-generator'
import { ModuleResolver } from '@adapters/fs/module-resolver'
import { ReactComponentCompiler } from '@adapters/compilers/react/component-compiler'
import { CssInjector } from '@adapters/compilers/react/runtime/css-injector'

export interface ParserDependencies {
  fileSystem: IFileSystem
  compiler: Compiler
  logger: Logger
  projectRoot: string
  react?: { strictCsp?: boolean }
}

export function makeComponentParser(dependencies: ParserDependencies) {
  const { fileSystem, compiler, logger, projectRoot, react } = dependencies
  const astParser = new ASTParser()
  const resolver = new ModuleResolver(fileSystem)
  const parser = new BabelLiquidParser({
    astParser,
    componentExtractor: new ComponentExtractor(),
    cssExtractor: new CSSImportExtractor(fileSystem, logger),
    jsxConverter: new LiquidParser(compiler, fileSystem, logger),
    reactCompiler: new ReactComponentCompiler(compiler, new CssInjector(), react ?? {}, projectRoot, logger),
    schemaExtractor: new SchemaExtractor(fileSystem, resolver, logger),
    scriptGenerator: new ScriptGenerator(compiler),
  })
  return { parser, astParser, resolver }
}
