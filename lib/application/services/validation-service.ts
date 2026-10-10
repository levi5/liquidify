import { _Maybe, _match } from 'funcio'
import type { ParsedComponent } from '../../core/entities/parsed-component'
import { ValidationError } from '../../core/errors/validation-error'
import type { SchemaValidator } from './schema-validation'

const JS_EXTENSIONS = ['.tsx', '.jsx', '.js', '.ts']

export class ValidationService {
  constructor(private readonly schemaValidator: SchemaValidator) {}

  public validate(component: ParsedComponent, filePath?: string): void {
    this.schemaValidator.validate(component.schema ?? {}, filePath)
    _match(filePath === undefined)
      .with(true, () => null)
      .with(false, () => this.validatePath(component, filePath as string))
      .exec()
  }

  private validatePath(component: ParsedComponent, filePath: string): void {
    _Maybe
      .of(this.folderOf(component, filePath))
      .map((folder) =>
        _match(folder === '')
          .with(true, () => null)
          .with(false, () => {
            this.validateImplicitReturn(component, folder, filePath)
            this.validateMode(component, folder, filePath)
          })
          .exec(),
      )
      .getOrElse(null)
  }

  private validateImplicitReturn(component: ParsedComponent, folder: string, filePath: string): void {
    if (component.hasImplicitReturn && (folder === 'sections' || folder === 'snippets')) {
      throw new ValidationError(
        `Implicit return (arrow function without braces) is not allowed in ${folder}. Use an explicit block body with return: () => { return <...> }`,
        filePath,
      )
    }
  }

  private folderOf(component: ParsedComponent, filePath: string): string {
    const normalized = filePath.replace(/\\/g, '/')
    return _match(true)
      .with(normalized.includes('/sections/') || component.type === 'sections', () => 'sections')
      .with(normalized.includes('/snippets/') || component.type === 'snippets', () => 'snippets')
      .with(normalized.includes('/blocks/') || component.type === 'blocks', () => 'blocks')
      .with(true, () => '')
      .exec() as string
  }

  private validateMode(component: ParsedComponent, folder: string, filePath: string): void {
    _match(component.mode === 'react')
      .with(true, () => {
        throw new ValidationError(
          `React code is not allowed in "${folder}". Use 'use dom' for plain JavaScript or keep it as pure Liquid.`,
          filePath,
        )
      })
      .with(false, () => this.validateJsLogic(component, folder, filePath))
      .exec()
  }

  private validateJsLogic(component: ParsedComponent, folder: string, filePath: string): void {
    _match(this.isJsFile(filePath) && component.mode === 'liquid' && (component.hasUncoveredJs || component.hasJsLogic))
      .with(true, () => {
        throw new ValidationError(
          `Using JavaScript in "${folder}" requires the 'use dom' or 'use script' directive. (Logic detected in the function body or at the top level)`,
          filePath,
        )
      })
      .with(false, () => null)
      .exec()
  }

  private isJsFile(filePath: string): boolean {
    return JS_EXTENSIONS.some((extension) => filePath.endsWith(extension))
  }
}
