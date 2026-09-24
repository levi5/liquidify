import { isObjectPattern, isObjectProperty, isIdentifier, type ObjectPattern, type ObjectProperty, type Identifier } from '@babel/types'
import { _match } from 'funcio'

export class ObjectPatternParser {
  public flatten(pattern: ObjectPattern, basePath: string): string[] {
    return pattern.properties.flatMap((prop) => this.flattenEntry(prop, basePath))
  }

  private flattenEntry(prop: ObjectPattern['properties'][number], basePath: string): string[] {
    return _match(isObjectProperty(prop) && isIdentifier(prop.key))
      .with(true, () => this.flattenProperty(prop as ObjectProperty, basePath))
      .with(false, () => [] as string[])
      .exec() as string[]
  }

  private flattenProperty(prop: ObjectProperty, basePath: string): string[] {
    const fullPath = `${basePath}.${(prop.key as Identifier).name}`
    return _match(true)
      .with(isIdentifier(prop.value), () => [`{% assign ${(prop.value as Identifier).name} = ${fullPath} %}`])
      .with(isObjectPattern(prop.value), () => this.flatten(prop.value as ObjectPattern, fullPath))
      .with(true, () => [] as string[])
      .exec() as string[]
  }
}
