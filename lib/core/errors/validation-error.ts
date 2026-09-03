import { LiquidifyError } from './liquidify-error'

export class ValidationError extends LiquidifyError {
  constructor(message: string, filePath?: string) {
    super(message, filePath)
    this.name = 'ValidationError'
  }
}
