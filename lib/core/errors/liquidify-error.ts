export class LiquidifyError extends Error {
  constructor(
    public readonly message: string,
    public readonly filePath?: string,
  ) {
    super(message)
    this.name = 'LiquidifyError'
  }
}
