import { LiquidxError } from './liquidx-error'

export class ValidationError extends LiquidxError {
	constructor(message: string, filePath?: string) {
		super(message, filePath)
		this.name = 'ValidationError'
	}
}
