import type { LiquidifyConfig } from '../../core/entities/config'
import { EsbuildCompiler } from '../../infra/adapters/compilers/esbuild/esbuild-compiler'
import { LiquidFileSystemGenerator } from '../../infra/adapters/generators/liquid/liquid-generator'
import { OutputManifest } from '../../infra/adapters/generators/liquid/output-manifest'
import { LiquidifyBuilder } from '../../application/services/liquidify-builder'
import { NodeFileSystem } from '../../infra/adapters/fs/node-file-system'
import { ReactRuntimeBuilder } from '../../infra/adapters/compilers/react/runtime/runtime-builder'
import { ConsoleLogger, type Logger } from '../../shared/logger'
import path from 'node:path'
import type { IFileSystem } from '../../core/protocols/file-system'
import { ComponentRegistry, DirectiveScanner } from '../../application/services/component-registry'
import { DependencyTracker, ImportGraphBuilder } from '../../application/services/dependency-tracker'
import { SchemaValidator } from '../../application/services/schema-validation'
import { TranspileFileUseCase } from '../../application/services/transpile-file'
import { ValidationService } from '../../application/services/validation-service'
import { makeComponentParser } from './make-component-parser'
import { PluginRunner } from '../../application/services/plugin-runner'
import { BuildDiagnostics, DiagnosticLogger } from '../../application/services/build-diagnostics'
import { resolveBuildLimits } from '../../core/entities/build-limits'
import { ProjectBuildPipeline } from '../../application/services/project-build-pipeline'
import { ProjectWatcher } from '../../infra/adapters/fs/project-watcher'

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
    limits: resolveBuildLimits(configuration.limits),
  }
  if (
    options.concurrency !== undefined &&
    (!Number.isInteger(options.concurrency) || options.concurrency < 1 || options.concurrency > 64)
  ) {
    throw new Error('Build concurrency must be an integer between 1 and 64.')
  }
  const diagnostics = new BuildDiagnostics()
  const logger = new DiagnosticLogger(dependencies.logger ?? new ConsoleLogger(), diagnostics)
  const fileSystem = dependencies.fileSystem ?? new NodeFileSystem(options.output)
  const compiler = new EsbuildCompiler({ mode: options.mode, sourcemap: options.sourcemap })
  const { parser, astParser, resolver } = makeComponentParser({ fileSystem, compiler, logger, projectRoot, react: options.react })

  const manifest = new OutputManifest(options.output, fileSystem, logger, { force: options.force })
  const generator = new LiquidFileSystemGenerator({ outputDir: options.output, force: options.force }, fileSystem, logger, manifest)
  const plugins = new PluginRunner(logger)
  const useCase = new TranspileFileUseCase(parser, generator, new ValidationService(new SchemaValidator()), plugins)

  const pipeline = new ProjectBuildPipeline(
    options,
    parser,
    useCase,
    fileSystem,
    new DependencyTracker(new ImportGraphBuilder(fileSystem, resolver, astParser, options.limits)),
    new ComponentRegistry(parser, fileSystem, new DirectiveScanner(astParser)),
    new ReactRuntimeBuilder(compiler),
    new DirectiveScanner(astParser),
  )
  const builder = new LiquidifyBuilder(
    pipeline,
    (callbacks) => new ProjectWatcher(options.componentsDir, fileSystem, callbacks),
    logger,
    plugins,
    diagnostics,
  )

  for (const plugin of options.plugins ?? []) {
    builder.registerPlugin(plugin)
  }

  return builder
}
