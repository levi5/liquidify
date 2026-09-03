export class ParsingContext {
  public blocksSchema: { type: string }[] = []
  public scriptAssets: Set<string> = new Set()
  public renames: Record<string, string> = {}
  public pendingAssigns: Set<string> = new Set()
  public currentFilePath?: string
  public componentName?: string
  public mode?: string
  public inlineComponents?: Map<string, any>

  constructor(data: Partial<ParsingContext> = {}) {
    Object.assign(this, data)
  }

  public addScriptAsset(asset: string): void {
    this.scriptAssets.add(asset)
  }

  public addBlockSchema(block: { type: string }): void {
    this.blocksSchema.push(block)
  }

  public addPendingAssign(assign: string): void {
    this.pendingAssigns.add(assign)
  }

  public getPendingAssigns(): string {
    const result = Array.from(this.pendingAssigns).join('\n')
    this.pendingAssigns.clear()
    return result ? `${result}\n` : ''
  }
}
