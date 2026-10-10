import * as types from '@babel/types'

export type ComponentMode = 'liquid' | 'dom' | 'dom:global' | 'react'

export type InlineComponentNode = types.JSXElement | types.JSXFragment | types.LogicalExpression | types.ConditionalExpression

export interface ComponentMetadataType {
  name: string
  jsxElement: types.JSXElement | types.JSXFragment | types.LogicalExpression | types.ConditionalExpression | null
  scriptStatements: types.Statement[]
  liquidAssignments: string[]
  liquidBody?: types.Statement[]
  type?: 'blocks' | 'sections' | 'snippets'
  hasUseScript: boolean
  mode: ComponentMode
  reactRootId?: string
  hasUncoveredJs?: boolean
  inlineComponents?: Map<string, InlineComponentNode>
  hasImplicitReturn?: boolean
}
