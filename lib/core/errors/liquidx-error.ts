export class LiquidxError extends Error {
	constructor(
		public readonly message: string,
		public readonly filePath?: string,
	) {
		super(message)
		this.name = 'LiquidxError'
	}
}
