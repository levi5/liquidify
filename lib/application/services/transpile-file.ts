import { _match } from 'funcio'
import type { IParser } from '../../core/protocols/parser'
import type { IGenerator } from '../../core/protocols/generator'
import type { ParsedComponent } from '../../core/entities/parsed-component'
import type { ValidationService } from './validation-service'

export type TranspileStatus = 'ok' | 'skipped-empty' | 'skipped-unnamed'

export class TranspileFileUseCase {
  constructor(
    private readonly parser: IParser,
    private readonly generator: IGenerator,
    private readonly validator: ValidationService,
  ) {}

  async beginBuild(files: string[], changed: Set<string>): Promise<void> {
    await this.generator.beginBuild?.(files, changed)
  }

  async finishBuild(): Promise<void> {
    await this.generator.finishBuild?.()
  }

  async execute(source: string, filePath?: string): Promise<TranspileStatus> {
    return _match(source.trim() === '')
      .with(true, () => Promise.resolve<TranspileStatus>('skipped-empty'))
      .with(false, () => this.transpile(source, filePath))
      .exec() as Promise<TranspileStatus>
  }

  private async transpile(source: string, filePath?: string): Promise<TranspileStatus> {
    const component = await this.parser.parse(source, filePath)
    return _match(!component.name)
      .with(true, () => Promise.resolve<TranspileStatus>('skipped-unnamed'))
      .with(false, () => this.validateAndGenerate(component, filePath))
      .exec() as Promise<TranspileStatus>
  }

  private async validateAndGenerate(component: ParsedComponent, filePath?: string): Promise<TranspileStatus> {
    this.validator.validate(component, filePath)
    await this.generator.generate(component, filePath)
    return 'ok'
  }
}
