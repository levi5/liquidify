import { test } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import fs from 'node:fs'
import { spawnSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { createCliProject } from '#tests/helpers/cli-project.mjs'

const require = createRequire(import.meta.url)
const executable = path.resolve('lib/presentation/cli/index.ts')
const configuration = path.resolve('tsconfig.runtime.json')
const runner = require.resolve('tsx/cli')

test('source CLI resolves aliases outside the repository working directory', (context) => {
  const directory = createCliProject(context)
  const result = spawnSync(process.execPath, [runner, '--tsconfig', configuration, executable, '--json'], {
    cwd: directory,
    encoding: 'utf8',
    timeout: 15000,
  })
  assert.equal(result.status, 0, result.stdout + result.stderr)
  assert.equal(JSON.parse(result.stdout).status, 'success')
  assert.match(fs.readFileSync(path.join(directory, 'out/snippets/card.liquid'), 'utf8'), /Card/)
})
