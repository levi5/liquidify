import { ValidationError } from './validation-error'

export interface CollectedError {
  message: string
  filePath?: string
  location?: { line: number; column: number }
}

export class AggregateValidationError extends ValidationError {
  public readonly errors: readonly CollectedError[]

  constructor(errors: readonly CollectedError[]) {
    const detail = errors
      .map((error, index) => {
        const where = `${error.filePath ?? '<input>'}${error.location ? `:${error.location.line}:${error.location.column}` : ''}`
        return `  ${index + 1}. ${where}: ${error.message}`
      })
      .join('\n')
    super(`Failed with ${errors.length} error(s):\n${detail}`, errors[0]?.filePath, errors[0]?.location)
    this.name = 'AggregateValidationError'
    this.errors = errors
  }
}

export class ErrorCollector {
  private readonly collected: CollectedError[] = []

  public add(error: unknown, filePath?: string): void {
    if (error instanceof ValidationError) {
      this.collected.push({ message: error.message, filePath: error.filePath ?? filePath, location: error.location })
      return
    }
    this.collected.push({ message: error instanceof Error ? error.message : String(error), filePath })
  }

  public get count(): number {
    return this.collected.length
  }

  public get hasErrors(): boolean {
    return this.collected.length > 0
  }

  public get errors(): readonly CollectedError[] {
    return this.collected
  }

  public toError(): AggregateValidationError | null {
    return this.hasErrors ? new AggregateValidationError(this.collected) : null
  }

  public throwIfErrors(): void {
    const error = this.toError()
    if (error !== null) throw error
  }
}
