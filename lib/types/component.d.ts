import * as types from '@babel/types'

export type ComponentMode = 'liquid' | 'dom' | 'dom:global' | 'react'

export interface ComponentMetadataType {
  name: string
  jsxElement: types.JSXElement | types.JSXFragment | types.LogicalExpression | types.ConditionalExpression | null
  scriptStatements: types.Statement[]
  liquidAssignments: string[]
  type?: 'blocks' | 'sections' | 'snippets'
  hasUseScript: boolean
  mode: ComponentMode
  reactRootId?: string
  hasUncoveredJs?: boolean
}