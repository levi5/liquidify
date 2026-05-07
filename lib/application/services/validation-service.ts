import { ComponentMetadataType } from '../../types/component'
import { ValidationError } from '../../core/errors/validation-error'

export class ValidationService {
	public validate(metadata: ComponentMetadataType, filePath?: string): void {
		if (!filePath) return

		const normalizedPath = filePath.replace(/\\/g, '/')
		const isSection = normalizedPath.includes('/sections/') || metadata.type === 'sections'
		const isSnippet = normalizedPath.includes('/snippets/') || metadata.type === 'snippets'
		const isBlock = normalizedPath.includes('/blocks/') || metadata.type === 'blocks'

		if (!isSection && !isSnippet && !isBlock) return

		const folderName = isSection ? 'sections' : isSnippet ? 'snippets' : 'blocks'

		if (metadata.mode === 'react') {
			throw new ValidationError(
				`React code is not allowed in "${folderName}". Use 'use dom' for plain JavaScript or keep it as pure Liquid.`,
				filePath,
			)
		}

		const isJsFile =
			filePath.endsWith('.tsx') ||
			filePath.endsWith('.jsx') ||
			filePath.endsWith('.js') ||
			filePath.endsWith('.ts')

		const hasJsLogic =
			metadata.hasUncoveredJs || metadata.scriptStatements.length > 0

		if (isJsFile && metadata.mode === 'liquid' && hasJsLogic) {
			throw new ValidationError(
				`Using JavaScript in "${folderName}" requires the 'use dom' or 'use script' directive. (Logic detected in the function body or at the top level)`,
				filePath,
			)
		}
	}
}
