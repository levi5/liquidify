import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { makeLiquidifyBuilder, SilentLogger } from '#dist/index.js'
import { createTemporaryDirectory } from '#tests/helpers/temp-directory.mjs'

test('build refreshes never overwrite existing user .refresh files', async (context) => {
  const directory = createTemporaryDirectory('liquidify-refresh-')
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const componentsDir = path.join(directory, 'components')
  const output = path.join(directory, 'out')
  fs.mkdirSync(componentsDir)
  fs.mkdirSync(output)
  fs.writeFileSync(path.join(componentsDir, 'Card.tsx'), '"use snippets"; export default function Card() { return <p>Card</p> }')
  fs.writeFileSync(path.join(output, '.refresh'), 'user-owned')
  const builder = makeLiquidifyBuilder({ componentsDir, output }, { logger: new SilentLogger() })
  try {
    await builder.build()
    assert.equal(fs.readFileSync(path.join(output, '.refresh'), 'utf8'), 'user-owned')
    assert.equal(
      fs.readdirSync(output).some((filename) => filename.startsWith('.liquidify-refresh-')),
      false,
    )
  } finally {
    await builder.dispose()
  }
})

test('discovery handles literal glob characters and excludes nested output and dependencies', async (context) => {
  const directory = createTemporaryDirectory('liquidify-discovery-')
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const componentsDir = path.join(directory, '[components]')
  const output = path.join(componentsDir, 'out')
  fs.mkdirSync(path.join(componentsDir, 'node_modules'), { recursive: true })
  fs.writeFileSync(path.join(componentsDir, 'node_modules/invalid.js'), 'not valid syntax {')
  fs.writeFileSync(path.join(componentsDir, 'Card.tsx'), '"use snippets"; export default function Card() { return <p>Card</p> }')
  const builder = makeLiquidifyBuilder({ componentsDir, output }, { logger: new SilentLogger() })
  try {
    const initial = await builder.build()
    assert.equal(initial.files.length, 1)
    const next = await builder.build()
    assert.equal(next.files.length, 1)
    assert.deepEqual(next.rebuilt, [])
  } finally {
    await builder.dispose()
  }
})
