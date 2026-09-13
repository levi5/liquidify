import chokidar from 'chokidar'
import { spawn } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const themeRoot = fileURLToPath(new URL('../', import.meta.url))
const buildScript = fileURLToPath(new URL('./build.mjs', import.meta.url))
let child
let timer
let queued = false
let stopping = false

function rebuild() {
  if (stopping) return
  if (child) {
    queued = true
    return
  }
  queued = false
  console.log('Compilando o tema…')
  child = spawn(process.execPath, [buildScript], { cwd: themeRoot, stdio: 'inherit' })
  child.on('error', (error) => console.error('Não foi possível iniciar o build:', error))
  child.on('close', (code) => {
    child = undefined
    if (stopping) return
    if (code !== 0) console.error('Build falhou. Corrija o arquivo para tentar novamente.')
    if (queued) rebuild()
    else console.log('Acompanhando alterações em src, templates, config e no compilador local…')
  })
}

const watcher = chokidar.watch(
  ['src', 'templates', 'config', 'layout', 'liquidify.config.json', 'tsconfig.json', '../dist'].map(
    (directory) => path.resolve(themeRoot, directory),
  ),
  { ignoreInitial: true, awaitWriteFinish: { stabilityThreshold: 200, pollInterval: 50 } },
)

watcher.on('all', () => {
  clearTimeout(timer)
  timer = setTimeout(rebuild, 200)
})
watcher.on('ready', rebuild)
watcher.on('error', (error) => {
  console.error(error)
  process.exitCode = 1
  void shutdown()
})

async function shutdown() {
  if (stopping) return
  stopping = true
  clearTimeout(timer)
  child?.kill('SIGTERM')
  await watcher.close()
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.once(signal, () => void shutdown())
}
