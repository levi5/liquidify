import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { makeLiquidifyBuilder } from '../dist/index.js'
import { LiquidifyError } from '../dist/core/errors/liquidify-error.js'
import { BUILD_CONCURRENCY } from '../dist/presentation/cli/commands/build.js'

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

const processFiles = (builder, files, worker, concurrency) => builder.processFilesInParallel(files, worker, concurrency)

const bareBuilder = () => makeLiquidifyBuilder({ componentsDir: '/unused', output: '/unused' })

test('build concurrency is bounded by a sane pool size', () => {
  assert.ok(BUILD_CONCURRENCY >= 1 && BUILD_CONCURRENCY <= 8, `unexpected concurrency ${BUILD_CONCURRENCY}`)
})

test('file processing overlaps work instead of awaiting one file at a time', async () => {
  const builder = bareBuilder()
  const files = Array.from({ length: 12 }, (_, index) => `f${index}.tsx`)
  let active = 0
  let maxActive = 0

  const results = await processFiles(builder, files, async () => {
    active++
    maxActive = Math.max(maxActive, active)
    await new Promise((resolve) => setTimeout(resolve, 5))
    active--
  })

  assert.equal(maxActive, Math.min(BUILD_CONCURRENCY, files.length))
  assert.ok(maxActive > 1, 'expected concurrent workers')
  assert.equal(results.length, files.length)
  assert.deepEqual(
    results.map((entry) => entry.file),
    files,
  )
})

test('file processing never exceeds the requested concurrency', async () => {
  const builder = bareBuilder()
  const files = Array.from({ length: 20 }, (_, index) => `f${index}.tsx`)
  let active = 0
  let maxActive = 0

  await processFiles(
    builder,
    files,
    async () => {
      active++
      maxActive = Math.max(maxActive, active)
      await new Promise((resolve) => setTimeout(resolve, 2))
      active--
    },
    3,
  )

  assert.equal(maxActive, 3)
})

test('file processing results stay aligned with the input order', async () => {
  const builder = bareBuilder()
  const files = Array.from({ length: 10 }, (_, index) => `f${index}.tsx`)

  const results = await processFiles(
    builder,
    files,
    async (file) => {
      const delay = Number(file.slice(1, -4))
      await new Promise((resolve) => setTimeout(resolve, (files.length - delay) * 2))
    },
    4,
  )

  assert.deepEqual(
    results.map((entry) => entry.file),
    files,
  )
})

test('a failing file does not stop the others and is reported in place', async () => {
  const builder = bareBuilder()
  const files = ['ok0.tsx', 'bad.tsx', 'ok1.tsx', 'bad.tsx', 'ok2.tsx']
  const failure = new Error('boom')
  const done = []

  const results = await processFiles(
    builder,
    files,
    async (file) => {
      if (file === 'bad.tsx') throw failure
      done.push(file)
    },
    3,
  )

  assert.deepEqual(done.sort(), ['ok0.tsx', 'ok1.tsx', 'ok2.tsx'])
  assert.equal(results.length, files.length)
  assert.equal(results[0].error, undefined)
  assert.equal(results[1].error, failure)
  assert.equal(results[2].error, undefined)
  assert.equal(results[3].error, failure)
  assert.equal(results[4].error, undefined)
})

test('an empty file list resolves without starting workers', async () => {
  const builder = bareBuilder()
  let calls = 0

  const results = await processFiles(builder, [], async () => {
    calls++
  })

  assert.deepEqual(results, [])
  assert.equal(calls, 0)
})

test('build writes still land once even with concurrent components', async (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'liquidify-parallel-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const components = path.join(directory, 'components')
  fs.mkdirSync(components)
  const count = 10
  for (let index = 0; index < count; index++) {
    fs.writeFileSync(
      path.join(components, `Card${index}.tsx`),
      `'use snippets'\nexport default function Card${index}() {\n  return <div className="card">${index}</div>\n}\n`,
    )
  }
  const output = path.join(directory, 'out')
  const builder = makeLiquidifyBuilder({ componentsDir: components, output })

  await builder.build()

  for (let index = 0; index < count; index++) {
    const written = path.join(output, 'snippets', `card${index}.liquid`)
    assert.ok(fs.existsSync(written), `missing ${written}`)
    assert.match(fs.readFileSync(written, 'utf8'), new RegExp(`class="card">[\\s\\S]*${index}[\\s\\S]*</div>`))
  }
})
