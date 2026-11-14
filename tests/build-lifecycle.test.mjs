import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeLiquidifyBuilder, SilentLogger } from '#dist/index.js'

function createBuilder() {
  return makeLiquidifyBuilder({ componentsDir: '/unused', output: '/unused' }, { logger: new SilentLogger() })
}

test('public builds serialize, return reports and recover after rejection', async () => {
  const builder = createBuilder()
  let activeBuilds = 0
  let maximumActiveBuilds = 0
  let buildCount = 0
  builder.buildProject = async () => {
    activeBuilds++
    maximumActiveBuilds = Math.max(maximumActiveBuilds, activeBuilds)
    await new Promise((resolve) => setImmediate(resolve))
    activeBuilds--
    if (++buildCount === 1) throw new Error('first failure')
  }
  const results = await Promise.allSettled([builder.build(), builder.build(), builder.build()])
  assert.equal(maximumActiveBuilds, 1)
  assert.equal(results[0].status, 'rejected')
  assert.equal(results[1].status, 'fulfilled')
  assert.ok(results[1].value.durationMs >= 0)
  assert.equal(results[2].status, 'fulfilled')
  await builder.dispose()
  await assert.rejects(builder.build(), /disposed/)
})

test('dispose waits for an accepted build and rejects new work', async () => {
  const builder = createBuilder()
  let releaseBuild
  let finished = false
  builder.buildProject = () =>
    new Promise((resolve) => {
      releaseBuild = resolve
    })
  const pendingBuild = builder.build()
  await new Promise((resolve) => setImmediate(resolve))
  const disposing = builder.dispose().then(() => {
    finished = true
  })
  await new Promise((resolve) => setImmediate(resolve))
  assert.equal(finished, false)
  await assert.rejects(builder.build(), /disposed/)
  releaseBuild()
  await Promise.all([pendingBuild, disposing])
  assert.equal(finished, true)
})

test('asynchronous plugin callbacks finish before build:end', async () => {
  const builder = createBuilder()
  builder.buildProject = async () => undefined
  const events = []
  builder.registerPlugin({
    name: 'async',
    setup(context) {
      context.onBuildEnd(async () => {
        await new Promise((resolve) => setImmediate(resolve))
        events.push('plugin')
      })
    },
  })
  builder.on('build:end', () => events.push('end'))
  await builder.build()
  assert.deepEqual(events, ['plugin', 'end'])
  await builder.dispose()
})

test('an aborted build never starts compilation', async () => {
  const builder = createBuilder()
  builder.buildProject = async () => assert.fail('compilation should not start')
  await assert.rejects(builder.build({ signal: AbortSignal.abort() }), /abort/i)
  await builder.dispose()
})
