import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export const reactTemplatesDirectory = resolve(__dirname, '../../../../../../resources/react')
type ReactTemplate =
  | 'inline-handler-strict.js'
  | 'inline-handler-legacy.js'
  | 'runtime.ts'
  | 'component.tsx'
  | 'context-bridge.js'
  | 'css-injector.js'
  | 'root.html'
  | 'island.html'

export function readReactTemplate(name: ReactTemplate): string {
  return readFileSync(resolve(reactTemplatesDirectory, name), 'utf8')
}
