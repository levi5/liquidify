import { _match, _pipe } from 'funcio'

export function escapeHtml(value: string): string {
  return _pipe(
    value,
    (current) => current.replace(/&/g, '&amp;'),
    (current) => current.replace(/</g, '&lt;'),
    (current) => current.replace(/>/g, '&gt;'),
    (current) => current.replace(/"/g, '&quot;'),
    (current) => current.replace(/'/g, '&#39;'),
  )
}

export function escapedOutput(code: string): string {
  const escaped = _match(/\|\s*escape(?:_once)?\s*$/.test(code))
    .with(true, () => code)
    .with(false, () => `${code} | escape`)
    .exec() as string
  return `{{ ${escaped} }}`
}

export function escapeAttributeTemplate(value: string): string {
  return value
    .split(/({{[\s\S]*?}}|{%[\s\S]*?%})/g)
    .map((part) => escapeTemplatePart(part))
    .join('')
}

function escapeTemplatePart(part: string): string {
  return _match(true)
    .with(part.startsWith('{{'), () => escapedOutput(part.slice(2, -2).trim()))
    .with(part.startsWith('{%'), () => part)
    .with(true, () => escapeHtml(part))
    .exec() as string
}

export function jsonForHtml(value: unknown): string {
  return _pipe(
    JSON.stringify(value),
    (current) => current.replace(/</g, '\\u003c'),
    (current) => current.replace(/\u2028/g, '\\u2028'),
    (current) => current.replace(/\u2029/g, '\\u2029'),
  )
}

export function liquidJsonOutput(code: string): string {
  return `{{ ${code} | json | replace: '<', '\\u003c' }}`
}
