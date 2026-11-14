import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawn, spawnSync } from 'node:child_process'
import { once } from 'node:events'

const executable = path.resolve('dist/presentation/cli/index.js')

function createProject(context) {
  const directory = fs.mkdtempSync('/tmp/opencode/liquidify-cli-')
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  fs.mkdirSync(path.join(directory, 'components'))
  fs.writeFileSync(path.join(directory, 'components/Card.tsx'), '"use snippets"; export default function Card() { return <div>Card</div> }')
  fs.writeFileSync(path.join(directory, 'liquidify.config.json'), JSON.stringify({ componentsDir: 'components', output: 'out' }))
  return directory
}

function run(directory, argumentsList) {
  return spawnSync(process.execPath, [executable, ...argumentsList], { cwd: directory, encoding: 'utf8', timeout: 15000 })
}

test('quiet builds write output without success messages', (context) => {
  const directory = createProject(context)
  const result = run(directory, ['--quiet'])
  assert.equal(result.status, 0, result.stderr)
  assert.equal(result.stdout, '')
  assert.equal(result.stderr, '')
  assert.ok(fs.existsSync(path.join(directory, 'out/snippets/card.liquid')))
})

test('check and dry-run emit pure JSON without touching output', (context) => {
  const directory = createProject(context)
  for (const argumentsList of [
    ['check', '--json'],
    ['--dry-run', '--json'],
  ]) {
    const result = run(directory, argumentsList)
    assert.equal(result.status, 0, result.stderr)
    const report = JSON.parse(result.stdout)
    assert.equal(report.status, 'success')
    assert.ok(report.changes.length > 0)
    assert.equal(fs.existsSync(path.join(directory, 'out')), false)
  }
})

test('invalid arguments return JSON errors and a failing exit code', (context) => {
  const directory = createProject(context)
  for (const argumentsList of [
    ['--unknown', '--json'],
    ['--config', '--json'],
    ['--concurrency=0', '--json'],
  ]) {
    const result = run(directory, argumentsList)
    assert.equal(result.status, 1)
    assert.equal(JSON.parse(result.stdout).status, 'error')
  }
})

test('doctor does not execute configured plugins', (context) => {
  const directory = createProject(context)
  fs.writeFileSync(
    path.join(directory, 'liquidify.config.json'),
    JSON.stringify({ componentsDir: 'components', plugins: ['missing-plugin'] }),
  )
  const result = run(directory, ['doctor', '--json'])
  assert.equal(result.status, 0, result.stderr)
  assert.equal(JSON.parse(result.stdout).status, 'success')
})

test('generate creates valid components and never overwrites existing source', (context) => {
  const directory = createProject(context)
  for (const kind of ['section', 'snippet', 'island']) {
    const name = `Example${kind[0].toUpperCase()}${kind.slice(1)}`
    const result = run(directory, ['generate', kind, name, '--json'])
    assert.equal(result.status, 0, result.stderr)
    assert.ok(fs.existsSync(JSON.parse(result.stdout).filename))
    assert.equal(run(directory, ['generate', kind, name, '--json']).status, 1)
  }
  const checked = run(directory, ['check', '--json'])
  assert.equal(checked.status, 0, checked.stdout + checked.stderr)
})

test('watch survives an initial syntax error and rebuilds after correction', { timeout: 15000 }, async (context) => {
  const directory = createProject(context)
  const filename = path.join(directory, 'components/Card.tsx')
  fs.writeFileSync(filename, 'export default function Broken( {')
  const child = spawn(process.execPath, [executable, '--watch', '--json'], { cwd: directory, stdio: ['ignore', 'pipe', 'pipe'] })
  context.after(() => {
    if (child.exitCode === null) child.kill('SIGTERM')
  })
  const stderr = []
  child.stderr.on('data', (chunk) => stderr.push(chunk.toString()))
  let buffered = ''
  const reports = []
  child.stdout.on('data', (chunk) => {
    buffered += chunk.toString()
    while (buffered.includes('\n')) {
      const newline = buffered.indexOf('\n')
      const line = buffered.slice(0, newline)
      buffered = buffered.slice(newline + 1)
      const report = JSON.parse(line)
      reports.push(report)
      if (report.status === 'error')
        fs.writeFileSync(filename, '"use snippets"; export default function Card() { return <div>Recovered</div> }')
      if (report.status === 'success') child.kill('SIGTERM')
    }
  })
  const [exitCode] = await once(child, 'exit')
  assert.equal(exitCode, 0, stderr.join(''))
  assert.deepEqual(
    reports.map((report) => report.status),
    ['error', 'success'],
  )
  assert.match(fs.readFileSync(path.join(directory, 'out/snippets/card.liquid'), 'utf8'), /Recovered/)
})
