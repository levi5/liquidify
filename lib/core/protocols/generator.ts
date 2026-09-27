import type { ParsedComponent } from '../entities/parsed-component'

export interface IGenerator {
  generate(component: ParsedComponent, sourcePath?: string): Promise<void>
  beginBuild?(files: string[], changed: Set<string>): Promise<void>
  finishBuild?(): Promise<void>
  abortBuild?(): Promise<void>
}
