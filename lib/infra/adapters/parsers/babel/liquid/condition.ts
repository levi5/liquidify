import { isIdentifier, isLogicalExpression, isMemberExpression, isOptionalMemberExpression, isUnaryExpression, type LogicalExpression, type Node, type UnaryExpression } from '@babel/types'
import { _match } from 'funcio'

export function renderCondition(node: Node, yes: string, no: string, generate: (node: Node) => string): string {
  return _match(true)
    .with(isUnaryExpression(node) && (node as UnaryExpression).operator === '!', () =>
      renderCondition((node as UnaryExpression).argument as Node, no, yes, generate),
    )
    .with(isLogicalExpression(node) && (node as LogicalExpression).operator === '&&', () =>
      renderCondition(
        (node as LogicalExpression).left,
        renderCondition((node as LogicalExpression).right, yes, no, generate),
        no,
        generate,
      ),
    )
    .with(isLogicalExpression(node) && (node as LogicalExpression).operator === '||', () =>
      renderCondition(
        (node as LogicalExpression).left,
        yes,
        renderCondition((node as LogicalExpression).right, yes, no, generate),
        generate,
      ),
    )
    .with(true, () => renderBranch(node, yes, no, generate))
    .exec() as string
}

function renderBranch(node: Node, yes: string, no: string, generate: (node: Node) => string): string {
  const otherwise = _match(no === '')
    .with(true, () => '')
    .with(false, () => `{% else %}${no}`)
    .exec() as string
  return `{% if ${truthyTest(node, generate(node))} %}${yes}${otherwise}{% endif %}`
}

export function truthyTest(node: Node, code: string): string {
  return _match(isIdentifier(node) || isMemberExpression(node) || isOptionalMemberExpression(node))
    .with(true, () => `${code} != nil and ${code} != false and ${code} != 0 and ${code} != ""`)
    .with(false, () => code)
    .exec() as string
}
