import { isObjectPattern, isObjectProperty, isIdentifier } from '@babel/types'
import { _Maybe, _match } from 'funcio'

export class ObjectPatternParser {
  public flatten(pattern: any, basePath: string): string[] {
    return pattern.properties.flatMap((prop: any) =>
      _Maybe
        .of(!isObjectProperty(prop) || !isIdentifier(prop.key))
        .map((skip) => (skip ? [] : this.flattenProperty(prop as any, basePath)))
        .getOrElse([]),
    )
  }

  private flattenProperty(prop: any, basePath: string): string[] {
    const fullPath = `${basePath}.${prop.key.name}`
    return _match(true)
      .with(isIdentifier(prop.value), () => [`{% assign ${prop.value.name} = ${fullPath} %}`])
      .with(isObjectPattern(prop.value), () => this.flatten(prop.value, fullPath))
      .with(true, () => [])
      .exec() as string[]
  }
}
