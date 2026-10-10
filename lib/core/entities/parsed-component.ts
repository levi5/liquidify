import type { ComponentMode } from '../../types/component'

export interface ParsedComponent {
  name: string
  html: string
  script: string
  liquidAssignments: string[]
  type?: 'sections' | 'blocks' | 'snippets'
  hasScript: boolean
  schema: Record<string, unknown>
  blocksSchema: { type: string }[]
  scriptAssets?: string[]
  mode?: ComponentMode
  css?: string
  globalCss?: string
  hasUncoveredJs?: boolean
  hasJsLogic?: boolean
  hasImplicitReturn?: boolean
}
