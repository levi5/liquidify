import type { ParsedComponent } from '@core/entities/parsed-component'

export interface IParser {
  parse(source: string, filePath?: string): Promise<ParsedComponent>
}
