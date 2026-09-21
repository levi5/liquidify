import { LiquidifyError } from './liquidify-error'

export class ValidationError extends LiquidifyError {
  constructor(message: string, filePath?: string, location?: { line: number; column: number }) {
    super(message, filePath, location)
    this.name = 'ValidationError'
  }
}
