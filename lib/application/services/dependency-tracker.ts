import path from 'node:path'
import { createHash } from 'node:crypto'
import { traverseFast, isStringLiteral } from '@babel/types'
import { ASTParser } from '../../infra/adapters/parsers/babel/ASTParser'
import { ModuleResolver } from '../../infra/adapters/fs/module-resolver'
import type { IFileSystem } from '../../core/protocols/file-system'

export class DependencyTracker {
  private previous = new Map<string, string>()
  public readonly watchedFiles = new Set<string>()
  constructor(private readonly fs: IFileSystem) {}

  public plan(files: string[]) {
    const resolver = new ModuleResolver(this.fs)
    const sources = new Map<string, string>()
    const edges = new Map<string, Set<string>>()
    this.watchedFiles.clear()
    const dependencies = this.watchedFiles
    const visit = (file: string): void => {
      if (edges.has(file)) return
      const imports = new Set<string>()
      edges.set(file, imports)
      dependencies.add(file)
      if (!this.fs.existsSync(file)) {
        sources.set(file, '<missing>')
        return
      }
      const source = this.fs.readFileSync(file)
      sources.set(file, source)
      for (const config of resolver.configFiles(file)) {
        if (config !== file) {
          imports.add(config)
          visit(config)
        }
      }
      const addImport = (specifier: string) => {
        const resolved = resolver.resolve(specifier, file)
        if (resolved) {
          imports.add(resolved)
          visit(resolved)
        } else if (specifier.startsWith('.') || resolver.candidates(specifier, file).length) {
          for (const candidate of resolver.candidates(specifier, file)) {
            imports.add(candidate)
            dependencies.add(candidate)
            sources.set(candidate, '<missing>')
          }
        }
      }
      if (/\.[jt]sx?$/.test(file)) {
        const ast = new ASTParser().parse(source, file)
        traverseFast(ast, (node) => {
          if (
            (node.type === 'ImportDeclaration' || node.type === 'ExportNamedDeclaration' || node.type === 'ExportAllDeclaration') &&
            node.source
          )
            addImport(node.source.value)
          if (
            node.type === 'CallExpression' &&
            (node.callee.type === 'Import' || (node.callee.type === 'Identifier' && node.callee.name === 'require')) &&
            isStringLiteral(node.arguments[0])
          )
            addImport(node.arguments[0].value)
        })
      } else if (/\.s?css$/.test(file)) {
        for (const match of source.matchAll(/@(?:import|use|forward)\s+(?:url\()?['"]([^'"]+)['"]/g)) addImport(match[1])
      }
    }
    files.forEach(visit)
    const snapshot = new Map<string, string>()
    for (const file of files) {
      const reachable = new Set<string>()
      const collect = (current: string) => {
        if (reachable.has(current)) return
        reachable.add(current)
        edges.get(current)?.forEach(collect)
      }
      collect(file)
      const hash = createHash('sha256')
      for (const dependency of [...reachable].sort())
        hash
          .update(dependency)
          .update('\0')
          .update(sources.get(dependency) ?? '<missing>')
          .update('\0')
      snapshot.set(path.resolve(file), hash.digest('hex'))
    }
    const changed = new Set(files.filter((file) => snapshot.get(file) !== this.previous.get(file)))
    return {
      changed,
      dependencies,
      commit: () => {
        this.previous = snapshot
      },
    }
  }
}
