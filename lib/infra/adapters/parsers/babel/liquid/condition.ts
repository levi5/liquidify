import { isLogicalExpression, isUnaryExpression, type Node } from '@babel/types'
import { _match } from 'funcio'

export function renderCondition(node: Node, yes: string, no: string, generate: (node: Node) => string): string {
  return _match(true)
    .with(isUnaryExpression(node) && (node as any).operator === '!', () => renderCondition((node as any).argument, no, yes, generate))
    .with(isLogicalExpression(node) && (node as any).operator === '&&', () =>
      renderCondition((node as any).left, renderCondition((node as any).right, yes, no, generate), no, generate),
    )
    .with(isLogicalExpression(node) && (node as any).operator === '||', () =>
      renderCondition((node as any).left, yes, renderCondition((node as any).right, yes, no, generate), generate),
    )
    .with(true, () => `{% if ${generate(node)} %}${yes}${no ? `{% else %}${no}` : ''}{% endif %}`)
    .exec() as string
}
