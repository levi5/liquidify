import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { once } from 'node:events'
import { makeLiquidifyBuilder } from '../dist/index.js'

function setup(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'liquidify-incremental-'))
  const componentsDir = path.join(root, 'src/components')
  const output = path.join(root, 'out')
  fs.mkdirSync(componentsDir, { recursive: true })
  const builder = makeLiquidifyBuilder({ componentsDir, output })
  t.after(async () => {
    await builder.watcher?.close()
    builder.disposeSync()
    fs.rmSync(root, { recursive: true, force: true })
  })
  const write = (file, text) => {
    const dest = path.join(root, file)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.writeFileSync(dest, text)
  }
  const calls = []
  const execute = builder.useCase.execute.bind(builder.useCase)
  builder.useCase.execute = async (source, file) => {
    calls.push(path.basename(file))
    return execute(source, file)
  }
  write('src/data.ts', 'export const title = "One"')
  write('src/components/A.tsx', '"use snippets"; import {title} from "../data"; export default function A(){return <p>{title}</p>}')
  write('src/components/B.tsx', '"use snippets"; export default function B(){return <p>B</p>}')
  return { root, output, builder, write, calls }
}

test('only changed components and transitive dependents are rebuilt', async (t) => {
  const { builder, write, calls } = setup(t)
  await builder.build()
  calls.length = 0
  await builder.build()
  assert.deepEqual(calls, [])
  write('src/data.ts', 'export const title = "Two"')
  await builder.build()
  assert.deepEqual(calls, ['A.tsx'])
})

test('renames and deletions clean owned outputs across builder instances', async (t) => {
  const { builder, root, output, write } = setup(t)
  await builder.build()
  write('src/components/A.tsx', '"use snippets"; export default function Renamed(){return <p>Renamed</p>}')
  await builder.build()
  assert.equal(fs.existsSync(path.join(output, 'snippets/a.liquid')), false)
  assert.equal(fs.existsSync(path.join(output, 'snippets/renamed.liquid')), true)
  fs.unlinkSync(path.join(root, 'src/components/A.tsx'))
  const next = makeLiquidifyBuilder({ componentsDir: path.join(root, 'src/components'), output })
  await next.build()
  assert.equal(fs.existsSync(path.join(output, 'snippets/renamed.liquid')), false)
})

test('cleanup preserves manually edited files and unowned theme files', async (t) => {
  const { builder, root, output } = setup(t)
  await builder.build()
  fs.writeFileSync(path.join(output, 'snippets/a.liquid'), 'manual edit')
  fs.writeFileSync(path.join(output, 'snippets/manual.liquid'), 'handwritten')
  fs.unlinkSync(path.join(root, 'src/components/A.tsx'))
  await builder.build()
  assert.equal(fs.readFileSync(path.join(output, 'snippets/a.liquid'), 'utf8'), 'manual edit')
  assert.equal(fs.readFileSync(path.join(output, 'snippets/manual.liquid'), 'utf8'), 'handwritten')
})

test('build rejects a generated name that would overwrite a manual file', async (t) => {
  const { builder, output } = setup(t)
  fs.mkdirSync(path.join(output, 'snippets'), { recursive: true })
  fs.writeFileSync(path.join(output, 'snippets/a.liquid'), 'manual content')
  await assert.rejects(builder.build(), /not managed by Liquidify/)
  assert.equal(fs.readFileSync(path.join(output, 'snippets/a.liquid'), 'utf8'), 'manual content')
})

test('failed manifest write restores outputs changed during finalization', async (t) => {
  const { builder, output, write } = setup(t)
  await builder.build()
  const generated = path.join(output, 'snippets/a.liquid')
  const manifest = path.join(output, '.liquidify-manifest.json')
  const beforeOutput = fs.readFileSync(generated, 'utf8')
  const beforeManifest = fs.readFileSync(manifest, 'utf8')
  write('src/components/A.tsx', '"use snippets"; export default function A(){return <p>Changed</p>}')
  const outputFileSystem = builder.useCase.generator.fileSystem
  const originalWrite = outputFileSystem.writeFile.bind(outputFileSystem)
  let failed = false
  outputFileSystem.writeFile = async (file, content) => {
    if (file === manifest && !failed) {
      failed = true
      throw new Error('simulated manifest failure')
    }
    await originalWrite(file, content)
  }
  await assert.rejects(builder.build(), /simulated manifest failure/)
  assert.equal(fs.readFileSync(generated, 'utf8'), beforeOutput)
  assert.equal(fs.readFileSync(manifest, 'utf8'), beforeManifest)
  await builder.build()
  assert.match(fs.readFileSync(generated, 'utf8'), /Changed/)
})

test('failed builds do not replace previous output', async (t) => {
  const { builder, output, write } = setup(t)
  await builder.build()
  const before = fs.readFileSync(path.join(output, 'snippets/a.liquid'), 'utf8')
  write('src/components/A.tsx', '"use snippets"; export default function A(){return <p>Changed</p>}')
  write('src/components/B.tsx', 'export default function B(){return <p/>}; export const schema = 42')
  await assert.rejects(builder.build())
  assert.equal(fs.readFileSync(path.join(output, 'snippets/a.liquid'), 'utf8'), before)
})

test('watch rebuilds when a dependency outside componentsDir changes', { timeout: 10000 }, async (t) => {
  const { builder, write, calls } = setup(t)
  await builder.build()
  calls.length = 0
  builder.watch()
  await once(builder.watcher, 'ready')
  const completed = once(builder, 'build:end')
  write('src/data.ts', 'export const title = "Watched"')
  await completed
  assert.deepEqual(calls, ['A.tsx'])
})

test('global scripts are removed from managed aggregate output on deletion', async (t) => {
  const { builder, root, output, write } = setup(t)
  write('src/components/Boot.ts', '"use script"; console.log("boot")')
  await builder.build()
  const aggregate = path.join(output, 'snippets/script-global.liquid')
  assert.match(fs.readFileSync(aggregate, 'utf8'), /boot\.js/)
  fs.appendFileSync(aggregate, '\n<!-- manual footer -->')
  fs.unlinkSync(path.join(root, 'src/components/Boot.ts'))
  await builder.build()
  assert.equal(fs.existsSync(path.join(output, 'assets/boot.js')), false)
  assert.doesNotMatch(fs.readFileSync(aggregate, 'utf8'), /boot\.js/)
  assert.match(fs.readFileSync(aggregate, 'utf8'), /manual footer/)
})

test('conflicting pure Liquid output names are rejected without replacing output', async (t) => {
  const { builder, output, write } = setup(t)
  await builder.build()
  const before = fs.readFileSync(path.join(output, 'snippets/a.liquid'), 'utf8')
  write('src/components/Conflict.tsx', '"use snippets"; export default function A(){return <p>Conflict</p>}')
  await assert.rejects(builder.build(), /conflict/)
  assert.equal(fs.readFileSync(path.join(output, 'snippets/a.liquid'), 'utf8'), before)
})

test('standalone transpile still writes output immediately', async (t) => {
  const { builder, root, output } = setup(t)
  const file = path.join(root, 'src/components/B.tsx')
  await builder.useCase.execute(fs.readFileSync(file, 'utf8'), file)
  assert.equal(fs.existsSync(path.join(output, 'snippets/b.liquid')), true)
})

test('watch can recover from an initial error in an external dependency', { timeout: 10000 }, async (t) => {
  const { builder, write } = setup(t)
  write('src/data.ts', 'export const = broken')
  await assert.rejects(builder.build())
  builder.watch()
  await once(builder.watcher, 'ready')
  const completed = once(builder, 'build:end')
  write('src/data.ts', 'export const title = "Fixed"')
  await completed
})

test('missing generated outputs are recreated even when sources are unchanged', async (t) => {
  const { builder, output, calls } = setup(t)
  await builder.build()
  calls.length = 0
  fs.unlinkSync(path.join(output, 'snippets/a.liquid'))
  await builder.build()
  assert.deepEqual(calls, ['A.tsx'])
  assert.equal(fs.existsSync(path.join(output, 'snippets/a.liquid')), true)
})

for (const scenario of ['invalid root config', 'invalid inherited config', 'missing inherited config']) {
  test(`watch recovers after ${scenario} outside componentsDir`, { timeout: 10000 }, async (t) => {
    const { builder, write, root } = setup(t)
    const inherited = scenario !== 'invalid root config'
    const target = inherited ? 'configs/base.json' : 'tsconfig.json'
    if (inherited) write('tsconfig.json', '{"extends":"./configs/base.json"}')
    if (scenario !== 'missing inherited config') write(target, '{broken')
    await assert.rejects(builder.build(), (error) => {
      assert.equal(error.name, 'ValidationError')
      assert.equal(error.filePath, path.join(root, target))
      return true
    })
    assert.ok(builder.watchedDependencies.has(path.join(root, target)))
    builder.watch()
    await once(builder.watcher, 'ready')
    const notifications = []
    builder.on('file:change', (file) => notifications.push(file))
    const completed = once(builder, 'build:end')
    write(target, '{"compilerOptions":{}}')
    await completed
    if (scenario === 'missing inherited config') {
      notifications.length = 0
      write('unrelated.txt', 'outside the dependency graph')
      await new Promise((resolve) => setTimeout(resolve, 350))
      assert.deepEqual(notifications, [], 'ancestor watches must ignore generated outputs and unrelated files')
    }
  })
}
