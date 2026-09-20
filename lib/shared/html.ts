export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function escapedOutput(code: string): string {
  const escaped = /\|\s*escape(?:_once)?\s*$/.test(code) ? code : `${code} | escape`
  return `{{ ${escaped} }}`
}

export function escapeAttributeTemplate(value: string): string {
  return value
    .split(/({{[\s\S]*?}}|{%[\s\S]*?%})/g)
    .map((part) => {
      if (part.startsWith('{{')) return escapedOutput(part.slice(2, -2).trim())
      if (part.startsWith('{%')) return part
      return escapeHtml(part)
    })
    .join('')
}

export function jsonForHtml(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

export function liquidJsonOutput(code: string): string {
  return `{{ ${code} | json | replace: '<', '\\u003c' }}`
}
