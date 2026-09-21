export class LiquidifyError extends Error {
  constructor(
    public readonly message: string,
    public readonly filePath?: string,
    public readonly location?: { line: number; column: number },
  ) {
    super(message)
    this.name = 'LiquidifyError'
  }
}
