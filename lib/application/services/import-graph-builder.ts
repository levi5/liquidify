import { _match, _try } from 'funcio'
import {
  traverseFast,
  isStringLiteral,
  isImportDeclaration,
  isExportNamedDeclaration,
  isExportAllDeclaration,
  isCallExpression,
  type Node,
  type CallExpression,
} from '@babel/types'
import type { ASTParser } from '@adapters/parsers/babel/ASTParser'
import type { ModuleResolver } from '@adapters/fs/module-resolver'
import type { IFileSystem } from '@core/protocols/file-system'
import { LiquidifyError } from '@core/errors/liquidify-error'
import { DEFAULT_BUILD_LIMITS, type BuildLimits } from '@core/entities/build-limits'

export interface ImportGraph {
  sources: Map<string, string>
  edges: Map<string, Set<string>>
}

const MISSING_SOURCE = '<missing>'

export class ImportGraphBuilder {
  private readonly importCache = new Map<string, { source: string; specifiers: string[] }>()
  private dependencyDepth = 0

  constructor(
    private readonly fs: IFileSystem,
    private readonly resolver: ModuleResolver,
    private readonly astParser: ASTParser,
    private readonly limits: BuildLimits = DEFAULT_BUILD_LIMITS,
  ) {}

  public build(files: string[], dependencies: Set<string>): ImportGraph {
    const graph: ImportGraph = { sources: new Map(), edges: new Map() }
    files.forEach((file) => {
      this.visit(file, graph, dependencies)
    })
    for (const filename of this.importCache.keys()) {
      if (!graph.sources.has(filename)) this.importCache.delete(filename)
    }
    return graph
  }

  private visit(file: string, graph: ImportGraph, dependencies: Set<string>): void {
    _match(graph.edges.has(file))
      .with(true, () => undefined)
      .with(false, () => this.collect(file, graph, dependencies))
      .exec()
  }

  private collect(file: string, graph: ImportGraph, dependencies: Set<string>): void {
    const exceedsCount =
      dependencies.size > this.limits.maxDependencies || (!dependencies.has(file) && dependencies.size >= this.limits.maxDependencies)
    if (exceedsCount || this.dependencyDepth >= this.limits.maxDependencyDepth) {
      throw new LiquidifyError('Dependency graph exceeds configured build limits.', file)
    }
    const imports = new Set<string>()
    graph.edges.set(file, imports)
    dependencies.add(file)
    this.dependencyDepth++
    try {
      _match(this.fs.existsSync(file))
        .with(true, () => this.collectExisting(file, graph, dependencies, imports))
        .with(false, () => graph.sources.set(file, MISSING_SOURCE))
        .exec()
    } finally {
      this.dependencyDepth--
    }
  }

  private collectExisting(file: string, graph: ImportGraph, dependencies: Set<string>, imports: Set<string>): void {
    const source = this.fs.readFileSync(file)
    if (Buffer.byteLength(source, 'utf8') > this.limits.maxSourceBytes) {
      throw new LiquidifyError('Source exceeds the configured maxSourceBytes limit.', file)
    }
    graph.sources.set(file, source)
    this.resolver
      .configFiles(file, (config) => dependencies.add(config))
      .filter((config) => config !== file)
      .forEach((config) => {
        imports.add(config)
        this.visit(config, graph, dependencies)
      })
    _match(/\.s?css$/.test(file))
      .with(true, () => this.collectCssImports(file, source, graph, dependencies, imports))
      .with(false, () => this.collectJsImports(file, source, graph, dependencies, imports))
      .exec()
  }

  private collectJsImports(file: string, source: string, graph: ImportGraph, dependencies: Set<string>, imports: Set<string>): void {
    _match(/\.[jt]sx?$/.test(file))
      .with(true, () => this.collectAstImports(file, source, graph, dependencies, imports))
      .with(false, () => undefined)
      .exec()
  }

  private collectAstImports(file: string, source: string, graph: ImportGraph, dependencies: Set<string>, imports: Set<string>): void {
    const cached = this.importCache.get(file)
    if (cached?.source === source) {
      for (const specifier of cached.specifiers) this.addImport(specifier, file, graph, dependencies, imports)
      return
    }
    const parsed = _try.sync(() => this.astParser.parse(source, file))
    const ast = parsed.match({
      right: (value) => value,
      left: (error) =>
        _match(error instanceof LiquidifyError)
          .with(true, () => {
            throw error
          })
          .with(false, () => {
            throw new LiquidifyError(`Failed to parse imports in ${file}: ${error instanceof Error ? error.message : String(error)}`, file)
          })
          .exec(),
    })
    const specifiers: string[] = []
    traverseFast(ast, (node: Node) => {
      const specifier = this.staticSourceOf(node)
      if (specifier !== undefined) specifiers.push(specifier)
    })
    this.importCache.set(file, { source, specifiers })
    for (const specifier of specifiers) this.addImport(specifier, file, graph, dependencies, imports)
  }

  private staticSourceOf(node: Node): string | undefined {
    return _match(true)
      .with(isImportDeclaration(node) || isExportNamedDeclaration(node) || isExportAllDeclaration(node), () => this.declarationSource(node))
      .with(isCallExpression(node), () => this.callSource(node))
      .with(true, () => undefined)
      .exec() as string | undefined
  }

  private declarationSource(node: Node): string | undefined {
    const value = (node as { source?: { value?: unknown } }).source?.value
    return _match(typeof value === 'string')
      .with(true, () => value as string)
      .with(false, () => undefined)
      .exec() as string | undefined
  }

  private callSource(node: Node): string | undefined {
    const call = node as CallExpression
    const firstArg = _match(Array.isArray(call.arguments) && isStringLiteral(call.arguments[0]))
      .with(true, () => (call.arguments[0] as { value: string }).value)
      .with(false, () => undefined)
      .exec() as string | undefined
    return _match(firstArg !== undefined && this.isImportOrRequire(call))
      .with(true, () => firstArg)
      .with(false, () => undefined)
      .exec() as string | undefined
  }

  private isImportOrRequire(call: CallExpression): boolean {
    if (call.callee.type === 'Import') return true
    if (call.callee.type === 'Identifier') return (call.callee as { name?: string }).name === 'require'
    return false
  }

  private collectCssImports(file: string, source: string, graph: ImportGraph, dependencies: Set<string>, imports: Set<string>): void {
    this.cssSpecifiers(source).forEach((specifier) => {
      this.addImport(specifier, file, graph, dependencies, imports)
    })
  }

  private cssSpecifiers(source: string): string[] {
    const quoted = Array.from(source.matchAll(/@(?:import|use|forward)\s+(?:url\()?['"]([^'"]+)['"]/g), (match) => match[1])
    const bare = Array.from(source.matchAll(/@import\s+(?:url\()?([^'"\s;]+)/g), (match) => match[1].replace(/['"];?$/, ''))
    return [...quoted, ...bare]
  }

  private addImport(specifier: string, file: string, graph: ImportGraph, dependencies: Set<string>, imports: Set<string>): void {
    const resolved = this.resolver.resolve(specifier, file)
    _match(resolved === null)
      .with(true, () => this.trackUnresolved(specifier, file, graph, dependencies, imports))
      .with(false, () => this.trackResolved(resolved as string, file, graph, dependencies, imports))
      .exec()
  }

  private trackResolved(resolved: string, _file: string, graph: ImportGraph, _dependencies: Set<string>, imports: Set<string>): void {
    imports.add(resolved)
    this.visit(resolved, graph, _dependencies)
  }

  private trackUnresolved(specifier: string, file: string, graph: ImportGraph, dependencies: Set<string>, imports: Set<string>): void {
    const candidates = this.resolver.candidates(specifier, file)
    if (!specifier.startsWith('.') && candidates.length === 0) return
    for (const candidate of candidates) {
      if (!dependencies.has(candidate) && dependencies.size >= this.limits.maxDependencies) {
        throw new LiquidifyError('Dependency graph exceeds configured build limits.', file)
      }
      imports.add(candidate)
      dependencies.add(candidate)
      graph.sources.set(candidate, MISSING_SOURCE)
    }
  }
}
