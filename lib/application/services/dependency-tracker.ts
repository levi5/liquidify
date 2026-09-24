import path from 'node:path'
import { _match } from 'funcio'
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
import type { ASTParser } from '../../infra/adapters/parsers/babel/ASTParser'
import type { ModuleResolver } from '../../infra/adapters/fs/module-resolver'
import type { IFileSystem } from '../../core/protocols/file-system'
import { sha256Hex } from '../../shared/liquid-helpers'

export interface ImportGraph {
  sources: Map<string, string>
  edges: Map<string, Set<string>>
}

export interface BuildPlan {
  changed: Set<string>
  dependencies: Set<string>
  commit: () => void
}

const MISSING_SOURCE = '<missing>'

export class ImportGraphBuilder {
  constructor(
    private readonly fs: IFileSystem,
    private readonly resolver: ModuleResolver,
    private readonly astParser: ASTParser,
  ) {}

  public build(files: string[], dependencies: Set<string>): ImportGraph {
    const graph: ImportGraph = { sources: new Map(), edges: new Map() }
    files.forEach((file) => {
      this.visit(file, graph, dependencies)
    })
    return graph
  }

  private visit(file: string, graph: ImportGraph, dependencies: Set<string>): void {
    _match(graph.edges.has(file))
      .with(true, () => undefined)
      .with(false, () => this.collect(file, graph, dependencies))
      .exec()
  }

  private collect(file: string, graph: ImportGraph, dependencies: Set<string>): void {
    const imports = new Set<string>()
    graph.edges.set(file, imports)
    dependencies.add(file)
    _match(this.fs.existsSync(file))
      .with(true, () => this.collectExisting(file, graph, dependencies, imports))
      .with(false, () => graph.sources.set(file, MISSING_SOURCE))
      .exec()
  }

  private collectExisting(file: string, graph: ImportGraph, dependencies: Set<string>, imports: Set<string>): void {
    const source = this.fs.readFileSync(file)
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
    traverseFast(this.astParser.parse(source, file), (node: Node) => {
      const specifier = this.staticSourceOf(node)
      _match(specifier === undefined)
        .with(true, () => undefined)
        .with(false, () => this.addImport(specifier as string, file, graph, dependencies, imports))
        .exec()
    })
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
    return _match(call.callee.type)
      .with('Import', () => true)
      .with('Identifier', () => (call.callee as { name?: string }).name === 'require')
      .with(call.callee.type, () => false)
      .exec() as boolean
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

  private trackResolved(resolved: string, _file: string, graph: ImportGraph, dependencies: Set<string>, imports: Set<string>): void {
    imports.add(resolved)
    this.visit(resolved, graph, dependencies)
  }

  private trackUnresolved(specifier: string, file: string, graph: ImportGraph, dependencies: Set<string>, imports: Set<string>): void {
    _match(specifier.startsWith('.') || this.resolver.candidates(specifier, file).length > 0)
      .with(true, () =>
        this.resolver.candidates(specifier, file).forEach((candidate) => {
          imports.add(candidate)
          dependencies.add(candidate)
          graph.sources.set(candidate, MISSING_SOURCE)
        }),
      )
      .with(false, () => undefined)
      .exec()
  }
}

export class DependencyTracker {
  private previous = new Map<string, string>()
  public readonly watchedFiles = new Set<string>()

  constructor(private readonly graphBuilder: ImportGraphBuilder) {}

  public plan(files: string[]): BuildPlan {
    this.watchedFiles.clear()
    const graph = this.graphBuilder.build(files, this.watchedFiles)
    const snapshot = this.snapshot(files, graph)
    const changed = new Set(files.filter((file) => snapshot.get(file) !== this.previous.get(file)))
    return {
      changed,
      dependencies: this.watchedFiles,
      commit: () => {
        this.previous = snapshot
      },
    }
  }

  private snapshot(files: string[], graph: ImportGraph): Map<string, string> {
    return new Map(files.map((file) => [path.resolve(file), sha256Hex(this.fingerprint(file, graph))]))
  }

  private fingerprint(file: string, graph: ImportGraph): string {
    return Array.from(this.reachable(file, graph))
      .sort()
      .map((dependency) => `${dependency}\0${graph.sources.get(dependency) ?? MISSING_SOURCE}\0`)
      .join('')
  }

  private reachable(file: string, graph: ImportGraph, seen: Set<string> = new Set()): Set<string> {
    return _match(seen.has(file))
      .with(true, () => seen)
      .with(false, () => this.expand(file, graph, seen))
      .exec() as Set<string>
  }

  private expand(file: string, graph: ImportGraph, seen: Set<string>): Set<string> {
    seen.add(file)
    ;(graph.edges.get(file) ?? new Set<string>()).forEach((edge) => {
      this.reachable(edge, graph, seen)
    })
    return seen
  }
}
