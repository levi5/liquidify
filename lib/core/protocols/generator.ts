import type { ParsedComponent } from '../entities/parsed-component'

export interface IGenerator {
  readonly outputFiles?: string[]
  generate(component: ParsedComponent, sourcePath?: string): Promise<void>
  beginBuild?(files: string[], changed: Set<string>): Promise<void>
  finishBuild?(): Promise<void>
  abortBuild?(): Promise<void>
  stageRuntime?(content: string): Promise<void>
}
