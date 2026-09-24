import type { LiquidifyConfig } from '../../core/entities/config'
import { ASTParser } from '../../infra/adapters/parsers/babel/ASTParser'
import { BabelLiquidParser } from '../../infra/adapters/parsers/babel/babel-parser'
import { ComponentExtractor } from '../../infra/adapters/parsers/babel/component'
import { CSSImportExtractor } from '../../infra/adapters/parsers/babel/css/import-extractor'
import { CssInjector } from '../../infra/adapters/compilers/react/runtime/css-injector'
import { EsbuildCompiler } from '../../infra/adapters/compilers/esbuild/esbuild-compiler'
import { LiquidFileSystemGenerator } from '../../infra/adapters/generators/liquid/liquid-generator'
import { OutputManifest } from '../../infra/adapters/generators/liquid/output-manifest'
import { LiquidParser } from '../../infra/adapters/parsers/babel/liquid-parser'
import { LiquidifyBuilder } from '../../presentation/cli/commands/build'
import { ModuleResolver } from '../../infra/adapters/fs/module-resolver'
import { NodeFileSystem } from '../../infra/adapters/fs/node-file-system'
import { ReactComponentCompiler } from '../../infra/adapters/compilers/react/component-compiler'
import { ReactRuntimeBuilder } from '../../infra/adapters/compilers/react/runtime/runtime-builder'
import { SchemaExtractor } from '../../infra/adapters/parsers/babel/schema/schema-extractor'
import { ScriptGenerator } from '../../infra/adapters/parsers/babel/script/script-generator'
import { ConsoleLogger } from '../../shared/logger'
import { ComponentRegistry, DirectiveScanner } from '../../application/services/component-registry'
import { DependencyTracker, ImportGraphBuilder } from '../../application/services/dependency-tracker'
import { SchemaValidator } from '../../application/services/schema-validation'
import { TranspileFileUseCase } from '../../application/services/transpile-file'
import { ValidationService } from '../../application/services/validation-service'

export function makeLiquidifyBuilder(options: LiquidifyConfig): LiquidifyBuilder {
  const logger = new ConsoleLogger()
  const fileSystem = new NodeFileSystem()
  const compiler = new EsbuildCompiler()
  const astParser = new ASTParser()
  const resolver = new ModuleResolver(fileSystem)
  const projectRoot = process.cwd()

  const parser = new BabelLiquidParser({
    astParser,
    componentExtractor: new ComponentExtractor(),
    cssExtractor: new CSSImportExtractor(fileSystem, logger),
    jsxConverter: new LiquidParser(compiler, fileSystem, logger),
    reactCompiler: new ReactComponentCompiler(compiler, new CssInjector(), options.react ?? {}, projectRoot, logger),
    schemaExtractor: new SchemaExtractor(fileSystem, resolver, logger),
    scriptGenerator: new ScriptGenerator(compiler),
  })

  const manifest = new OutputManifest(options.output, fileSystem, logger, { force: options.force })
  const generator = new LiquidFileSystemGenerator({ outputDir: options.output, force: options.force }, fileSystem, logger, manifest)
  const useCase = new TranspileFileUseCase(parser, generator, new ValidationService(new SchemaValidator()))

  return new LiquidifyBuilder(
    options,
    parser,
    useCase,
    fileSystem,
    new DependencyTracker(new ImportGraphBuilder(fileSystem, resolver, astParser)),
    new ComponentRegistry(parser, fileSystem, new DirectiveScanner(astParser)),
    new ReactRuntimeBuilder(compiler),
    new DirectiveScanner(astParser),
    logger,
  )
}
