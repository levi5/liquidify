import { IParser } from '../../core/protocols/parser'
import { IGenerator } from '../../core/protocols/generator'
import { ValidationService } from './validation-service'

export type TranspileStatus = 'ok' | 'skipped-empty' | 'skipped-unnamed'

export class TranspileFileUseCase {
  constructor(
    private parser: IParser,
    private generator: IGenerator,
    private validator: ValidationService = new ValidationService(),
  ) {}

  async execute(source: string, filePath?: string): Promise<TranspileStatus> {
    if (!source.trim()) return 'skipped-empty'
    const component = await this.parser.parse(source, filePath)
    if (!component.name) return 'skipped-unnamed'

    this.validator.validate(component, filePath)

    await this.generator.generate(component)
    return 'ok'
  }
}
