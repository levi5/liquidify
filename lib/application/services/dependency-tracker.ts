import type { ImportGraphBuilder } from './import-graph-builder'
import { sha256Hex } from '../../shared/liquid-helpers'
import type { BuildPlan } from '../../core/entities/build-plan'
export type { BuildPlan } from '../../core/entities/build-plan'

export { ImportGraphBuilder } from './import-graph-builder'
export type { ImportGraph } from './import-graph-builder'

/** Propagates changed nodes through reverse edges instead of hashing every transitive closure. */
export class DependencyTracker {
  private previousSources = new Map<string, string>()
  private previousEdges = new Map<string, Set<string>>()
  private previousEntries = new Set<string>()
  readonly watchedFiles = new Set<string>()

  constructor(private readonly graphBuilder: ImportGraphBuilder) {}

  plan(files: string[]): BuildPlan {
    this.watchedFiles.clear()
    const graph = this.graphBuilder.build(files, this.watchedFiles)
    const digests = new Map(Array.from(graph.sources, ([filename, source]) => [filename, sha256Hex(source)]))
    const dirty = new Set<string>()
    for (const [filename, digest] of digests) {
      if (digest !== this.previousSources.get(filename)) dirty.add(filename)
    }
    for (const filename of this.previousSources.keys()) {
      if (!digests.has(filename)) dirty.add(filename)
    }
    for (const [filename, imports] of graph.edges) {
      const previousImports = this.previousEdges.get(filename)
      if (
        !previousImports ||
        imports.size !== previousImports.size ||
        [...imports].some((dependency) => !previousImports.has(dependency))
      ) {
        dirty.add(filename)
      }
    }
    this.propagate(dirty, graph.edges)
    return {
      changed: new Set(files.filter((filename) => dirty.has(filename) || !this.previousEntries.has(filename))),
      dependencies: this.watchedFiles,
      commit: () => {
        this.previousSources = digests
        this.previousEdges = graph.edges
        this.previousEntries = new Set(files)
      },
    }
  }

  private propagate(dirty: Set<string>, currentEdges: Map<string, Set<string>>): void {
    const dependents = new Map<string, Set<string>>()
    for (const edges of [currentEdges, this.previousEdges]) {
      for (const [importer, imports] of edges) {
        for (const dependency of imports) {
          if (!dependents.has(dependency)) dependents.set(dependency, new Set())
          dependents.get(dependency)?.add(importer)
        }
      }
    }
    const pending = [...dirty]
    for (let index = 0; index < pending.length; index++) {
      for (const importer of dependents.get(pending[index]) ?? []) {
        if (!dirty.has(importer)) {
          dirty.add(importer)
          pending.push(importer)
        }
      }
    }
  }
}
