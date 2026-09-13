import type { ParsedComponent } from '../entities/parsed-component'

export interface IGenerator {
  generate(component: ParsedComponent): Promise<void>
}
