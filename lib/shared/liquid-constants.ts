export const LIQUID_DIRECTIVES = {
  USE_DOM: 'use dom',
  USE_DOM_GLOBAL: 'use dom:global',
  USE_SCRIPT: 'use script',
  USE_SNIPPETS: 'use snippets',
  USE_BLOCKS: 'use blocks',
  USE_SECTIONS: 'use sections',
  REACT_PREFIX: 'use react',
} as const

export const REACT_DIRECTIVE_PATTERN = /^use react(?:\s*\(([^)]+)\))?$/
export const DOM_DIRECTIVE_PATTERN = /^use (dom(?::global)?|script)$/

export const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

export const BOOLEAN_ATTRIBUTES = new Set([
  'allowfullscreen',
  'async',
  'autofocus',
  'autoplay',
  'checked',
  'controls',
  'default',
  'defer',
  'disabled',
  'formnovalidate',
  'hidden',
  'ismap',
  'itemscope',
  'loop',
  'multiple',
  'muted',
  'nomodule',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
  'reversed',
  'selected',
])

export const COMPONENT_TYPES = new Set(['sections', 'blocks', 'snippets'])

export const LIQUID_PLACEHOLDER_PREFIX = '__liquidify'

export const OUTPUT_RESERVED = new Set(['assets/react-runtime.js', 'snippets/script-global.liquid'])

export const MANIFEST_VERSION = 1
export const MAX_CSS_BYTES = 1024 * 1024
export const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.scss']
