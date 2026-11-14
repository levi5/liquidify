import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { makeLiquidifyBuilder, SilentLogger } from '../dist/index.js'
import { createTemporaryDirectory } from './helpers/temp-directory.mjs'

test('plugin generation hooks are awaited and validation runs after mutation', async (context) => {
  const directory = createTemporaryDirectory('liquidify-plugin-hooks-')
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const componentsDir = path.join(directory, 'components')
  fs.mkdirSync(componentsDir)
  fs.writeFileSync(path.join(componentsDir, 'Card.tsx'), '"use snippets"; export default function Card() { return <div>Before</div> }')
  const events = []
  const builder = makeLiquidifyBuilder(
    {
      componentsDir,
      output: path.join(directory, 'out'),
      plugins: [
        {
          name: 'lifecycle',
          setup(hooks) {
            hooks.onBuildStart(async () => {
              events.push('start')
            })
            hooks.onGenerate(async (component) => {
              await new Promise((resolve) => setImmediate(resolve))
              component.html = '<p>After</p>'
              events.push('generate')
            })
            hooks.onBuildEnd(async () => {
              events.push('end')
            })
            hooks.onDispose(async () => {
              events.push('dispose')
            })
          },
        },
      ],
    },
    { logger: new SilentLogger() },
  )
  const result = await builder.build()
  assert.ok(result.outputFiles.some((filename) => filename.endsWith('card.liquid')))
  assert.match(fs.readFileSync(path.join(directory, 'out/snippets/card.liquid'), 'utf8'), /After/)
  await builder.dispose()
  await builder.dispose()
  assert.deepEqual(events, ['start', 'generate', 'end', 'dispose'])
})

test('plugin errors are reported without masking the compilation failure', async () => {
  const builder = makeLiquidifyBuilder(
    {
      componentsDir: '/unused',
      output: '/unused',
      plugins: [
        {
          name: 'failure',
          setup(hooks) {
            hooks.onBuildStart(() => {
              throw new Error('original failure')
            })
            hooks.onBuildError(() => {
              throw new Error('secondary failure')
            })
          },
        },
      ],
    },
    { logger: new SilentLogger() },
  )
  await assert.rejects(builder.build(), /original failure/)
  await builder.dispose()
})
