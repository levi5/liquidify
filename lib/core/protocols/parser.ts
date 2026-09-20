import type { ParsedComponent } from '../entities/parsed-component'

export interface IParser {
  parse(source: string, filePath?: string): Promise<ParsedComponent>
}
