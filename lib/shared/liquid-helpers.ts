import { createHash } from 'node:crypto'
import { _match } from 'funcio'

export function liquidAssign(name: string, code: string): string {
  return `{% assign ${name} = ${code} %}`
}

export function liquidIf(condition: string, body: string, elseBody = ''): string {
  return _match(elseBody === '')
    .with(true, () => `{% if ${condition} %}${body}{% endif %}`)
    .with(false, () => `{% if ${condition} %}${body}{% else %}${elseBody}{% endif %}`)
    .exec() as string
}

export function sha256Hex(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}
