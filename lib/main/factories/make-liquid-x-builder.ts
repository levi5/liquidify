import { ASTParser } from '../../infra/adapters/parsers/babel/ASTParser'
import { BabelLiquidParser } from '../../infra/adapters/parsers/babel/babel-parser'
import { ComponentExtractor } from '../../infra/adapters/parsers/babel/component'
import { CSSImportExtractor } from '../../infra/adapters/parsers/babel/css/Import-extractor'
import { CssInjector } from '../../infra/adapters/compilers/react/runtime/css-injector'
import { EsbuildCompiler } from '../../infra/adapters/compilers/esbuild/esbuild-compiler'
import { LiquidFileSystemGenerator } from '../../infra/adapters/generators/liquid/liquid-generator'
import { LiquidParser } from '../../infra/adapters/parsers/babel/liquid-parser'
import { LiquidXBuilder } from '../../presentation/cli/commands/build'
import { NodeFileSystem } from '../../infra/adapters/fs/node-file-system'
import { ReactComponentCompiler } from '../../infra/adapters/compilers/react/component-compiler'
import { SchemaExtractor } from '../../infra/adapters/parsers/babel/schema/schema-extractor'
import { ScriptGenerator } from '../../infra/adapters/parsers/babel/script/script-generator'
import { TranspileFileUseCase } from '../../application/services/transpile-file'
import { ValidationService } from '../../application/services/validation-service'

export function makeLiquidXBuilder(options: { componentsDir: string; output: string }): LiquidXBuilder {
	const fileSystem = new NodeFileSystem()
	const compiler = new EsbuildCompiler()

	const parser = new BabelLiquidParser({
		astParser: new ASTParser(),
		componentExtractor: new ComponentExtractor(),
		cssExtractor: new CSSImportExtractor(),
		jsxConverter: new LiquidParser(compiler),
		reactCompiler: new ReactComponentCompiler(compiler, new CssInjector()),
		schemaExtractor: new SchemaExtractor(),
		scriptGenerator: new ScriptGenerator(compiler),
	})

	const generator = new LiquidFileSystemGenerator({ outputDir: options.output }, fileSystem)
	const validator = new ValidationService()
	const useCase = new TranspileFileUseCase(parser, generator, validator)

	return new LiquidXBuilder(options, parser, useCase)
}
