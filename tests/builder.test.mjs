import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { makeLiquidifyBuilder } from '../dist/index.js'
import { LiquidifyError } from '../dist/core/errors/liquidify-error.js'

for (const source of ["'use react'; export default function Broken( {", 'export default function Broken( {']) {
  test(`build rejects invalid syntax and emits one error (${source.startsWith("'use react'") ? 'scan' : 'compile'})`, async (t) => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'liquidify-builder-'))
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
    const file = path.join(directory, 'Broken.tsx')
    fs.writeFileSync(file, source)
    const builder = makeLiquidifyBuilder({ componentsDir: directory, output: path.join(directory, 'out') })
    const errors = []
    let completed = false
    builder.on('error', (error) => errors.push(error))
    builder.on('build:end', () => {
      completed = true
    })
    await assert.rejects(builder.build(), (error) => {
      assert.ok(error instanceof LiquidifyError)
      assert.equal(error.filePath, file)
      assert.equal(errors.length, 1)
      assert.equal(errors[0], error)
      return true
    })
    assert.equal(completed, false)
    builder.removeAllListeners('error')
    await assert.rejects(builder.build(), LiquidifyError)
  })
}

test('watch builds are serialized and multiple requests queue one rebuild', async () => {
  const builder = makeLiquidifyBuilder({ componentsDir: '/unused', output: '/unused' })
  let release
  let started
  const firstStarted = new Promise((resolve) => {
    started = resolve
  })
  const pending = new Promise((resolve) => {
    release = resolve
  })
  let calls = 0
  let active = 0
  let maxActive = 0
  builder.build = async () => {
    calls++
    active++
    maxActive = Math.max(active, maxActive)
    if (calls === 1) {
      started()
      await pending
    }
    active--
  }
  const running = builder.runSerialized()
  await firstStarted
  await Promise.all([builder.runSerialized(), builder.runSerialized()])
  release()
  await running
  assert.equal(calls, 2)
  assert.equal(maxActive, 1)
})

test('watch builds can recover after a failed build', async () => {
  const builder = makeLiquidifyBuilder({ componentsDir: '/unused', output: '/unused' })
  const failure = new Error('build failed')
  let calls = 0
  const failures = []
  builder.on('build:failed', (error) => failures.push(error))
  builder.build = async () => {
    if (++calls === 1) throw failure
  }
  await builder.runSerialized()
  await builder.runSerialized()
  assert.equal(calls, 2)
  assert.deepEqual(failures, [failure])
})
