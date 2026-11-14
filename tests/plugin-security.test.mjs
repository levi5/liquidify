import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { loadConfig } from '#dist/index.js'
import { createTemporaryDirectory } from '#tests/helpers/temp-directory.mjs'

function createProject(context, plugins) {
  const directory = createTemporaryDirectory('liquidify-plugins-')
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  fs.mkdirSync(path.join(directory, '.plugins'))
  fs.writeFileSync(path.join(directory, 'liquidify.config.json'), JSON.stringify({ plugins }))
  return directory
}

test('plugin references reject paths before executing code', (context) => {
  for (const reference of ['../outside', './outside', '/tmp/outside', 'nested/plugin', '__proto__', 'constructor']) {
    const directory = createProject(context, [reference])
    assert.throws(() => loadConfig(directory), /Invalid plugin reference/)
  }
})

test('local plugin symlinks cannot escape the trusted directory', (context) => {
  const directory = createProject(context, ['escape'])
  const outside = path.join(directory, 'outside.cjs')
  fs.writeFileSync(outside, "throw new Error('must not execute')")
  fs.symlinkSync(outside, path.join(directory, '.plugins/escape.cjs'))
  assert.throws(() => loadConfig(directory), /escapes the .plugins directory/)
})

test('plugin loading can be disabled before any code executes', (context) => {
  const directory = createProject(context, ['dangerous'])
  fs.writeFileSync(path.join(directory, '.plugins/dangerous.cjs'), "throw new Error('must not execute')")
  assert.deepEqual(loadConfig(directory, undefined, { plugins: false }).plugins, [])
  assert.throws(() => loadConfig(directory), /must not execute/)
})
