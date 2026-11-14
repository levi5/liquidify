import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { NodeFileSystem } from '#dist/infra/adapters/fs/node-file-system.js'
import { createTemporaryDirectory } from '#tests/helpers/temp-directory.mjs'

test('asynchronous atomic writes preserve permissions and clean temporary files', async (context) => {
  const directory = createTemporaryDirectory('liquidify-async-')
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const filename = path.join(directory, 'output.liquid')
  fs.writeFileSync(filename, 'before', { mode: 0o640 })
  const filesystem = new NodeFileSystem(directory)
  await filesystem.writeFile(filename, 'after')
  assert.equal(await filesystem.readFile(filename), 'after')
  assert.equal(fs.statSync(filename).mode & 0o777, 0o640)
  assert.deepEqual(fs.readdirSync(directory), ['output.liquid'])
})

test('failed asynchronous atomic renames preserve the target and remove temporary files', async (context) => {
  const directory = createTemporaryDirectory('liquidify-async-failure-')
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const destination = path.join(directory, 'existing-directory')
  fs.mkdirSync(destination)
  await assert.rejects(new NodeFileSystem(directory).writeFile(destination, 'cannot replace a directory'))
  assert.equal(fs.statSync(destination).isDirectory(), true)
  assert.deepEqual(fs.readdirSync(directory), ['existing-directory'])
})
