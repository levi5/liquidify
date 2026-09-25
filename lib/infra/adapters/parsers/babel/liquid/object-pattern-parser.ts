import {
  isObjectPattern,
  isObjectProperty,
  isIdentifier,
  isStringLiteral,
  isAssignmentPattern,
  isRestElement,
  type ObjectPattern,
  type ObjectProperty,
  type Identifier,
  type AssignmentPattern,
  type RestElement,
} from '@babel/types'
import { _match } from 'funcio'

export class ObjectPatternParser {
  public flatten(pattern: ObjectPattern, basePath: string): string[] {
    return pattern.properties.flatMap((prop) => this.flattenEntry(prop, basePath))
  }

  private flattenEntry(prop: ObjectPattern['properties'][number], basePath: string): string[] {
    return _match(true)
      .with(isRestElement(prop), () => this.restAssign(prop as RestElement, basePath))
      .with(isObjectProperty(prop), () => this.flattenProperty(prop as ObjectProperty, basePath))
      .with(true, () => [] as string[])
      .exec() as string[]
  }

  private restAssign(prop: RestElement, basePath: string): string[] {
    return _match(isIdentifier(prop.argument))
      .with(true, () => [`{% assign ${(prop.argument as Identifier).name} = ${basePath} %}`])
      .with(false, () => [] as string[])
      .exec() as string[]
  }

  private flattenProperty(prop: ObjectProperty, basePath: string): string[] {
    const keyName = _match(true)
      .with(isIdentifier(prop.key), () => (prop.key as Identifier).name)
      .with(isStringLiteral(prop.key), () => (prop.key as { value: string }).value)
      .with(true, () => '')
      .exec() as string
    return _match(keyName === '')
      .with(true, () => [] as string[])
      .with(false, () => this.flattenValue(prop, `${basePath}.${keyName}`))
      .exec() as string[]
  }

  private flattenValue(prop: ObjectProperty, fullPath: string): string[] {
    return _match(true)
      .with(isIdentifier(prop.value), () => [`{% assign ${(prop.value as Identifier).name} = ${fullPath} %}`])
      .with(isObjectPattern(prop.value), () => this.flatten(prop.value as ObjectPattern, fullPath))
      .with(isAssignmentPattern(prop.value), () => this.flattenDefault(prop.value as AssignmentPattern, fullPath))
      .with(true, () => [] as string[])
      .exec() as string[]
  }

  private flattenDefault(node: AssignmentPattern, fullPath: string): string[] {
    return _match(isIdentifier(node.left))
      .with(true, () => {
        const right =
          (node.right as { type?: string }).type === 'StringLiteral'
            ? `'${(node.right as unknown as { value: string }).value}'`
            : this.rawCode(node.right)
        return [`{% assign ${(node.left as Identifier).name} = ${fullPath} | default: ${right} %}`]
      })
      .with(false, () => this.flattenNestedDefault(node, fullPath))
      .exec() as string[]
  }

  private flattenNestedDefault(node: AssignmentPattern, fullPath: string): string[] {
    return _match(isObjectPattern(node.left))
      .with(true, () => this.flatten(node.left as ObjectPattern, fullPath))
      .with(false, () => [] as string[])
      .exec() as string[]
  }

  private rawCode(node: unknown): string {
    const value = (node as { value?: unknown; name?: string }).value
    return _match(typeof value !== 'undefined')
      .with(true, () => JSON.stringify(value))
      .with(false, () => (node as { name?: string }).name ?? 'nil')
      .exec() as string
  }
}
