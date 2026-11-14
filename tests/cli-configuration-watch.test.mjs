import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { cliExecutable, createCliProject, runCli } from './helpers/cli-project.mjs'

for (const initialInvalid of [false, true]) {
  test(`watch reloads configuration (${initialInvalid ? 'initially invalid' : 'valid'})`, { timeout: 15000 }, async (context) => {
    const directory = createCliProject(context)
    const configPath = path.join(directory, 'liquidify.config.json')
    if (initialInvalid) fs.writeFileSync(configPath, '{invalid')
    const child = spawn(process.execPath, [cliExecutable, '--watch', '--json'], { cwd: directory, stdio: ['ignore', 'pipe', 'pipe'] })
    context.after(() => {
      if (child.exitCode === null) child.kill('SIGTERM')
    })
    let buffer = ''
    const reports = []
    child.stdout.on('data', (chunk) => {
      buffer += chunk.toString()
      while (buffer.includes('\n')) {
        const newline = buffer.indexOf('\n')
        reports.push(JSON.parse(buffer.slice(0, newline)))
        buffer = buffer.slice(newline + 1)
        if (reports.length === 1) {
          fs.writeFileSync(configPath, JSON.stringify({ componentsDir: 'components', output: 'replacement' }))
        } else child.kill('SIGTERM')
      }
    })
    const [exitCode] = await once(child, 'exit')
    assert.equal(exitCode, 0)
    assert.deepEqual(
      reports.map((report) => report.status),
      [initialInvalid ? 'error' : 'success', 'success'],
    )
    assert.ok(fs.existsSync(path.join(directory, 'replacement/snippets/card.liquid')))
  })
}

test('initialization supports quiet and JSON output without global flags changing the target', (context) => {
  const directory = createCliProject(context)
  const quiet = runCli(directory, ['init', 'quiet-project', '--quiet'])
  assert.equal(quiet.status, 0, quiet.stderr)
  assert.equal(quiet.stdout, '')
  assert.equal(quiet.stderr, '')
  const json = runCli(directory, ['init', 'json-project', '--json'])
  assert.equal(json.status, 0, json.stderr)
  assert.equal(JSON.parse(json.stdout).directory, path.join(directory, 'json-project'))
  assert.ok(fs.existsSync(path.join(directory, 'json-project/src/app')))
})

test('theme-check invokes the installed CLI without a shell', (context) => {
  const directory = createCliProject(context)
  fs.mkdirSync(path.join(directory, 'out'))
  const commands = path.join(directory, 'commands')
  fs.mkdirSync(commands)
  const executable = path.join(commands, 'shopify')
  fs.writeFileSync(executable, `#!${process.execPath}\nconsole.log(JSON.stringify(process.argv.slice(2)))\n`, { mode: 0o755 })
  const result = runCli(directory, ['theme-check', '--json'], { ...process.env, PATH: `${commands}${path.delimiter}${process.env.PATH}` })
  assert.equal(result.status, 0, result.stderr)
  const argumentsList = JSON.parse(JSON.parse(result.stdout).themeCheck.stdout)
  assert.deepEqual(argumentsList, ['theme', 'check', '--path', path.join(directory, 'out'), '--output', 'json', '--fail-level', 'error'])
})
