export const COMPONENT_NAME_PATTERN = /^[A-Za-z_$][\w$]*$/
export const STYLESHEET_IMPORT_PATTERN = /^[ \t]*import[ \t]+(?:[^'";]*?[ \t]+from[ \t]+)?['"]([^'"]+\.(?:css|scss))['"]/gm

export const RAW_LIQUID_GLOBALS_PATTERN =
  /\{\{\s*(routes|shop|store|section|sections|settings|linklists|collections|collection|product|products|all_products|page|pages|article|articles|blog|blogs|cart|search|paginate|template|predictive_search|customer|order|gift_card|content_for_header|content_for_layout)\b/

export const INLINE_HANDLER_PATTERN = /\bon[A-Z][A-Za-z]*\s*=\s*(?:"[^"]*"|'[^']*'|\{\s*(?:"[^"]*"|'[^']*')\s*\})/

const RUNTIME_GLOBAL_BINDINGS: ReadonlyArray<readonly [string, string]> = [
  ['registerLiquidifyAction', 'registerLiquidifyAction'],
  ['registerLiquidIsland', 'registerLiquidIsland || LiquidxRegisterIsland'],
  ['useLiquidifyEvent', 'LiquidifyUseEvent || LiquidxUseEvent'],
  ['emitLiquidifyEvent', 'LiquidifyEmitEvent || LiquidxEmitEvent'],
  ['LiquidifyEvents', 'LiquidifyEvents || LiquidxEvents'],
  ['registerLiquidxIsland', 'registerLiquidIsland || LiquidxRegisterIsland'],
  ['useLiquidxEvent', 'LiquidifyUseEvent || LiquidxUseEvent'],
  ['emitLiquidxEvent', 'LiquidifyEmitEvent || LiquidxEmitEvent'],
  ['LiquidxEvents', 'LiquidifyEvents || LiquidxEvents'],
]

export const RUNTIME_GLOBAL_STUB = [
  'module.exports = {};',
  'Object.defineProperties(module.exports, {',
  ...RUNTIME_GLOBAL_BINDINGS.map(
    ([exported, expression]) => `  ${exported}: { enumerable: true, get: function () { return window.${expression}; } },`,
  ),
  '});',
].join('\n')
