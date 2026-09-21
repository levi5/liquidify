import type { ParsedComponent } from '../../../../core/entities/parsed-component'

const voidTags = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'])

function htmlTokens(html: string): string[] {
  const tokens: string[] = []
  let start = 0
  for (let index = 0; index < html.length; index++) {
    if (html.startsWith('{%', index) || html.startsWith('{{', index)) {
      const closing = html[index + 1] === '%' ? '%}' : '}}'
      const end = html.indexOf(closing, index + 2)
      if (end >= 0) {
        index = end + 1
        continue
      }
    }
    if (html[index] !== '<' || !/[A-Za-z/!?]/.test(html[index + 1] || '')) continue
    let quote = ''
    let end = index + 1
    for (; end < html.length; end++) {
      const char = html[end]
      if (quote) {
        if (char === quote) quote = ''
      } else if (char === '"' || char === "'") quote = char
      else if (char === '>') break
    }
    if (end === html.length) continue
    if (start < index) tokens.push(html.slice(start, index))
    tokens.push(html.slice(index, end + 1))
    index = end
    start = end + 1
  }
  if (start < html.length) tokens.push(html.slice(start))
  return tokens
}

export function formatHtml(html: string): string {
  let indent = 0
  return htmlTokens(html)
    .map((token) => {
      const trimmed = token.trim()
      if (!trimmed) return null
      if (/^<\/[\w:-]+\s*>$/.test(token)) indent = Math.max(0, indent - 1)
      const line = '  '.repeat(indent) + (token.startsWith('<') ? token : trimmed)
      const opening = /^<([\w:-]+)(?=[\s/>])/.exec(token)
      if (opening && !/\/\s*>$/.test(token) && !voidTags.has(opening[1].toLowerCase())) indent++
      return line
    })
    .filter(Boolean)
    .join('\n')
}

function scriptTag(scriptFile: string): string {
  const scriptName = scriptFile.replace(/\.js$/, '')
  const scriptVar = `script_${scriptName.replace(/[^a-zA-Z0-9]/g, '_')}_loaded`
  return `\n\n{%- unless ${scriptVar} -%}\n  <script src="{{ '${scriptFile}' | asset_url }}" defer></script>\n  {%- assign ${scriptVar} = true -%}\n{%- endunless -%}`
}

export function buildLiquidContent(component: ParsedComponent, fileName: string): string {
  let content = component.liquidAssignments?.length ? `${component.liquidAssignments.join('\n')}\n\n` : ''
  content += formatHtml(component.html)

  if (component.mode !== 'dom:global') {
    const scriptAssets = component.scriptAssets || []
    const scriptsToInclude: string[] = []
    if (component.type !== 'snippets' && component.hasScript && !scriptAssets.includes(`${fileName}.js`)) {
      scriptsToInclude.push(`${fileName}.js`)
    }
    scriptsToInclude.push(...scriptAssets)
    for (const script of scriptsToInclude) content += scriptTag(script)
  }

  if (component.type !== 'snippets') {
    const schema = { ...component.schema, ...(component.blocksSchema?.length ? { blocks: component.blocksSchema } : {}) }
    content += `\n\n{% schema %}\n${JSON.stringify(schema, null, 2)}\n{% endschema %}`
  }
  if (component.css) content += `\n\n{% stylesheet %}\n${component.css}{% endstylesheet %}`
  return content
}
