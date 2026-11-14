import type { ReactComponentConfig } from '@liquidify-types/liquid'
import type { BuildPlan } from '@core/entities/build-plan'
import type { IParser } from '@core/protocols/parser'

export interface ProjectParser extends IParser {
  setReactRegistry(registry: Map<string, ReactComponentConfig>): void
}

export interface ComponentDirectives {
  isReact: boolean
  isDom: boolean
  isSnippet: boolean
  isSections: boolean
  rootId: string
}

export interface DirectiveReader {
  scan(source: string, filename?: string): ComponentDirectives
}

export interface ComponentRegistryReader {
  scan(files: string[], changed?: Set<string>): Promise<Map<string, ReactComponentConfig>>
}

export interface DependencyPlanner {
  readonly watchedFiles: Set<string>
  plan(files: string[]): BuildPlan
}

export interface RuntimeBundler {
  build(): Promise<string>
}

export type ProjectFileDiscovery = (componentsDirectory: string, outputDirectory: string) => Promise<string[]>
