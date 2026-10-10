import { _Maybe, _match } from 'funcio'
import type { InlineComponentNode } from '../../types/component'
import type { ErrorCollector } from '../errors/error-collector'

const orDefault = <T>(value: T | undefined, fallback: T): T => _Maybe.of(value).getOrElse(fallback) as T

export interface ParsingContextData {
  blocksSchema?: { type: string }[]
  scriptAssets?: Set<string>
  renames?: Record<string, string>
  pendingAssigns?: Set<string>
  processedNodes?: Set<string>
  currentFilePath?: string
  componentName?: string
  mode?: string
  inlineComponents?: Map<string, InlineComponentNode>
  outputContext?: 'text' | 'raw' | 'json'
  inSvg?: boolean
  errorCollector?: ErrorCollector
  /** @internal shared sequence holder so derived contexts don't collide */
  sequenceRef?: { value: number }
}

export class ParsingContext {
  public blocksSchema: { type: string }[] = []
  public scriptAssets: Set<string> = new Set()
  public renames: Record<string, string> = {}
  public pendingAssigns: Set<string> = new Set()
  public processedNodes: Set<string> = new Set()
  public currentFilePath?: string
  public componentName?: string
  public mode?: string
  public inlineComponents?: Map<string, InlineComponentNode>
  public outputContext: 'text' | 'raw' | 'json' = 'text'
  public inSvg = false
  public errorCollector?: ErrorCollector
  private sequenceRef: { value: number } = { value: 0 }

  constructor(data: ParsingContextData = {}) {
    this.blocksSchema = orDefault(data.blocksSchema, [])
    this.scriptAssets = orDefault(data.scriptAssets, new Set())
    this.renames = orDefault(data.renames, {})
    this.pendingAssigns = orDefault(data.pendingAssigns, new Set())
    this.processedNodes = orDefault(data.processedNodes, new Set())
    this.currentFilePath = orDefault(data.currentFilePath, undefined)
    this.componentName = orDefault(data.componentName, undefined)
    this.mode = orDefault(data.mode, undefined)
    this.inlineComponents = orDefault(data.inlineComponents, undefined)
    this.outputContext = orDefault(data.outputContext, 'text')
    this.inSvg = orDefault(data.inSvg, false)
    this.errorCollector = orDefault(data.errorCollector, undefined)
    this.sequenceRef = orDefault(data.sequenceRef, { value: 0 })
  }

  public static derive(context: ParsingContext | undefined, patch: ParsingContextData): ParsingContext {
    return new ParsingContext({
      blocksSchema: patch.blocksSchema ?? context?.blocksSchema ?? [],
      scriptAssets: patch.scriptAssets ?? context?.scriptAssets ?? new Set(),
      renames: { ...orDefault(context?.renames, {}), ...orDefault(patch.renames, {}) },
      pendingAssigns: patch.pendingAssigns ?? context?.pendingAssigns ?? new Set(),
      processedNodes: patch.processedNodes ?? context?.processedNodes ?? new Set(),
      currentFilePath: orDefault(patch.currentFilePath ?? context?.currentFilePath, undefined),
      componentName: orDefault(patch.componentName ?? context?.componentName, undefined),
      mode: orDefault(patch.mode ?? context?.mode, undefined),
      inlineComponents: patch.inlineComponents ?? context?.inlineComponents,
      outputContext: orDefault(patch.outputContext ?? context?.outputContext, 'text'),
      inSvg: orDefault(patch.inSvg ?? context?.inSvg, false),
      errorCollector: patch.errorCollector ?? context?.errorCollector,
      sequenceRef: patch.sequenceRef ?? context?.sequenceRef ?? { value: 0 },
    })
  }

  public allocateName(prefix: string): string {
    const safePrefix = String(prefix ?? '').replace(/[^a-zA-Z0-9_]/g, '_') || 'slot'
    const allocated = `__liquidify_${safePrefix}_${this.sequenceRef.value}`
    this.sequenceRef.value += 1
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
