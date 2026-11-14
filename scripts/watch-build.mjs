import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const commands = [
  [require.resolve('typescript/bin/tsc'), '-p', 'tsconfig.lib.json', '--watch'],
  [require.resolve('tsc-alias/dist/bin/index.js'), '-p', 'tsconfig.lib.json', '--watch'],
]
const processes = commands.map((argumentsList) => spawn(process.execPath, argumentsList, { stdio: 'inherit' }))
let closing = false

function shutdown(exitCode = 0) {
  if (closing) return
  closing = true
  process.exitCode = exitCode
  for (const child of processes) child.kill('SIGTERM')
}

for (const child of processes) {
  child.on('error', () => shutdown(1))
  child.on('exit', (exitCode) => { if (!closing) shutdown(exitCode ?? 1) })
}
for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.once(signal, () => shutdown())
