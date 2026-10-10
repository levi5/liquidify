import { createHash } from 'node:crypto'
import { _match } from 'funcio'

export function liquidAssign(name: string, code: string): string {
  return `{% assign ${name} = ${code} %}`
}

export function sha256Hex(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}
