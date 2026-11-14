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
import { LiquidifyBuilder } from '../../application/services/liquidify-builder'
import { ModuleResolver } from '../../infra/adapters/fs/module-resolver'
import { NodeFileSystem } from '../../infra/adapters/fs/node-file-system'
import { ReactComponentCompiler } from '../../infra/adapters/compilers/react/component-compiler'
import { ReactRuntimeBuilder } from '../../infra/adapters/compilers/react/runtime/runtime-builder'
import { SchemaExtractor } from '../../infra/adapters/parsers/babel/schema/schema-extractor'
import { ScriptGenerator } from '../../infra/adapters/parsers/babel/script/script-generator'
import { ConsoleLogger, type Logger } from '../../shared/logger'
import path from 'node:path'
import type { IFileSystem } from '../../core/protocols/file-system'
import { ComponentRegistry, DirectiveScanner } from '../../application/services/component-registry'
import { DependencyTracker, ImportGraphBuilder } from '../../application/services/dependency-tracker'
import { SchemaValidator } from '../../application/services/schema-validation'
import { TranspileFileUseCase } from '../../application/services/transpile-file'
import { ValidationService } from '../../application/services/validation-service'

export interface BuilderDependencies {
  logger?: Logger
  fileSystem?: IFileSystem
}

export function makeLiquidifyBuilder(configuration: LiquidifyConfig, dependencies: BuilderDependencies = {}): LiquidifyBuilder {
  const projectRoot = path.resolve(configuration.cwd ?? process.cwd())
  const options = {
    ...configuration,
    componentsDir: path.resolve(projectRoot, configuration.componentsDir),
    output: path.resolve(projectRoot, configuration.output),
  }
  if (
    options.concurrency !== undefined &&
    (!Number.isInteger(options.concurrency) || options.concurrency < 1 || options.concurrency > 64)
  ) {
    throw new Error('Build concurrency must be an integer between 1 and 64.')
  }
  const logger = dependencies.logger ?? new ConsoleLogger()
  const fileSystem = dependencies.fileSystem ?? new NodeFileSystem(options.output)
  const compiler = new EsbuildCompiler()
  const astParser = new ASTParser()
  const resolver = new ModuleResolver(fileSystem)

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

  const builder = new LiquidifyBuilder(
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

  for (const plugin of options.plugins ?? []) {
    builder.registerPlugin(plugin)
  }

  return builder
}
