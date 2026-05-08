import { IParser } from '../../core/protocols/parser'
import { IGenerator } from '../../core/protocols/generator'
import { ValidationService } from './validation-service'

export class TranspileFileUseCase {
	constructor(
		private parser: IParser,
		private generator: IGenerator,
		private validator: ValidationService = new ValidationService(),
	) {}

	async execute(source: string, filePath?: string): Promise<void> {
		if (!source.trim()) return
		const component = await this.parser.parse(source, filePath)
		if (!component.name) return

		this.validator.validate(component, filePath)

		await this.generator.generate(component)
	}
}
