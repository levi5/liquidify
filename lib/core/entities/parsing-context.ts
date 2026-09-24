import { _Maybe, _match } from 'funcio'

const orDefault = <T>(value: T | undefined, fallback: T): T => _Maybe.of(value).getOrElse(fallback) as T

export interface ParsingContextData {
  blocksSchema?: { type: string }[]
  scriptAssets?: Set<string>
  renames?: Record<string, string>
  pendingAssigns?: Set<string>
  currentFilePath?: string
  componentName?: string
  mode?: string
  inlineComponents?: Map<string, any>
  outputContext?: 'text' | 'raw' | 'json'
}

export class ParsingContext {
  public blocksSchema: { type: string }[] = []
  public scriptAssets: Set<string> = new Set()
  public renames: Record<string, string> = {}
  public pendingAssigns: Set<string> = new Set()
  public currentFilePath?: string
  public componentName?: string
  public mode?: string
  public inlineComponents?: Map<string, any>
  public outputContext: 'text' | 'raw' | 'json' = 'text'
  private sequence = 0

  constructor(data: ParsingContextData = {}) {
    this.blocksSchema = orDefault(data.blocksSchema, [])
    this.scriptAssets = orDefault(data.scriptAssets, new Set())
    this.renames = orDefault(data.renames, {})
    this.pendingAssigns = orDefault(data.pendingAssigns, new Set())
    this.currentFilePath = orDefault(data.currentFilePath, undefined)
    this.componentName = orDefault(data.componentName, undefined)
    this.mode = orDefault(data.mode, undefined)
    this.inlineComponents = orDefault(data.inlineComponents, undefined)
    this.outputContext = orDefault(data.outputContext, 'text')
  }

  public static derive(context: ParsingContext | undefined, patch: ParsingContextData): ParsingContext {
    return new ParsingContext({
      blocksSchema: orDefault(context?.blocksSchema, []),
      scriptAssets: orDefault(context?.scriptAssets, new Set()),
      renames: orDefault(context?.renames, {}),
      pendingAssigns: orDefault(context?.pendingAssigns, new Set()),
      currentFilePath: orDefault(context?.currentFilePath ?? patch.currentFilePath, undefined),
      componentName: orDefault(context?.componentName ?? patch.componentName, undefined),
      mode: orDefault(patch.mode ?? context?.mode, undefined),
      inlineComponents: orDefault(context?.inlineComponents ?? patch.inlineComponents, undefined),
      outputContext: orDefault(patch.outputContext ?? context?.outputContext, 'text'),
    })
  }

  public allocateName(prefix: string): string {
    const allocated = `__liquidify_${prefix}_${this.sequence}`
    this.sequence += 1
    return allocated
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

  public peekPendingAssigns(): string {
    return _match(this.pendingAssigns.size === 0)
      .with(true, () => '')
      .with(false, () => `${Array.from(this.pendingAssigns).join('\n')}\n`)
      .exec() as string
  }

  public getPendingAssigns(): string {
    return _Maybe
      .of(this.peekPendingAssigns())
      .map((pending) => this.drain(pending))
      .getOrElse('')
  }

  private drain(pending: string): string {
    this.pendingAssigns.clear()
    return pending
  }
}
