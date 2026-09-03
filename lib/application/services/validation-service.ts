import { ParsedComponent } from '../../core/entities/parsed-component'
import { ValidationError } from '../../core/errors/validation-error'

export class ValidationService {
  public validate(component: ParsedComponent, filePath?: string): void {
    if (!filePath) return

    const normalizedPath = filePath.replace(/\\/g, '/')
    const isSection = normalizedPath.includes('/sections/') || component.type === 'sections'
    const isSnippet = normalizedPath.includes('/snippets/') || component.type === 'snippets'
    const isBlock = normalizedPath.includes('/blocks/') || component.type === 'blocks'

    if (!isSection && !isSnippet && !isBlock) return

    const folderName = isSection ? 'sections' : isSnippet ? 'snippets' : 'blocks'

    if (component.mode === 'react') {
      throw new ValidationError(
        `React code is not allowed in "${folderName}". Use 'use dom' for plain JavaScript or keep it as pure Liquid.`,
        filePath,
      )
    }

    const isJsFile = filePath.endsWith('.tsx') || filePath.endsWith('.jsx') || filePath.endsWith('.js') || filePath.endsWith('.ts')

    const hasJsLogic = component.hasUncoveredJs || component.hasJsLogic

    if (isJsFile && component.mode === 'liquid' && hasJsLogic) {
      throw new ValidationError(
        `Using JavaScript in "${folderName}" requires the 'use dom' or 'use script' directive. (Logic detected in the function body or at the top level)`,
        filePath,
      )
    }
  }
}
