import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { NodeFileSystem } from '../dist/infra/adapters/fs/node-file-system.js'
import { OutputManifest } from '../dist/infra/adapters/generators/liquid/output-manifest.js'
import { SilentLogger } from '../dist/shared/logger.js'
import { escapeAttributeTemplate, escapedOutput, jsonForHtml } from '../dist/shared/html.js'
import { makeLiquidifyBuilder } from '../dist/index.js'
import { makeParser } from './helpers.mjs'

function fixture(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'liquidify-hardening-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const output = path.join(directory, 'out')
  fs.mkdirSync(path.join(output, 'assets'), { recursive: true })
  fs.mkdirSync(path.join(output, 'snippets'))
  const adapter = new NodeFileSystem(output)
  const manifest = new OutputManifest(output, adapter, new SilentLogger())
  return { directory, output, adapter, manifest, runtime: path.join(output, 'assets/react-runtime.js') }
}

test('JSON output is HTML-escaped in attributes, including after filters that change escaped text', async () => {
  assert.equal(escapeAttributeTemplate('{{ value | json }}'), '{{ value | json | escape }}')
  assert.equal(escapedOutput("value | escape | replace: '&quot;', 'x'"), "{{ value | escape | replace: '&quot;', 'x' | escape }}")
  const parser = makeParser()
  const result = await parser.parse('export default function Card({ value }) { return <div data-value={json(value)} /> }', '/src/Card.tsx')
  assert.match(result.html, /data-value="{{ value \| json \| escape }}"/)
})

test('atomic writes preserve the original on rename failure and clean up temporary files', async (t) => {
  const { adapter, runtime } = fixture(t)
  fs.writeFileSync(runtime, 'original')
  const rename = t.mock.method(fs, 'renameSync', () => {
    throw new Error('rename failed')
  })
  assert.throws(() => adapter.writeFileSync(runtime, 'replacement'), /rename failed/)
  rename.mock.restore()
  assert.equal(fs.readFileSync(runtime, 'utf8'), 'original')
  assert.deepEqual(fs.readdirSync(path.dirname(runtime)), ['react-runtime.js'])
  adapter.writeFileSync(runtime, 'complete')
  assert.equal(fs.readFileSync(runtime, 'utf8'), 'complete')
})

test('output writes and directory creation reject traversal and symlinks, including dangling links', async (t) => {
  const { directory, output, adapter } = fixture(t)
  const outside = path.join(directory, 'outside')
  fs.mkdirSync(outside)
  fs.symlinkSync(outside, path.join(output, 'linked'), 'dir')
  assert.throws(() => adapter.writeFileSync(path.join(output, 'linked/payload.js'), 'bad'), /Symbolic links/)
  await assert.rejects(adapter.mkdir(path.join(output, 'linked/subdir')), /Symbolic links/)
  fs.symlinkSync(path.join(outside, 'missing.js'), path.join(output, 'assets/dangling.js'))
  assert.throws(() => adapter.writeFileSync(path.join(output, 'assets/dangling.js'), 'bad'), /Symbolic links/)
  assert.throws(() => adapter.writeFileSync(path.join(outside, 'payload.js'), 'bad'), /escapes/)
  assert.deepEqual(fs.readdirSync(outside), [])
})

test('the output root and manifest cannot be symbolic links', async (t) => {
  const { directory, output, adapter } = fixture(t)
  const linkedRoot = path.join(directory, 'linked-root')
  fs.symlinkSync(output, linkedRoot, 'dir')
  assert.throws(() => new NodeFileSystem(linkedRoot).writeFileSync(path.join(linkedRoot, 'x.js'), ''), /Symbolic links/)
  const outsideManifest = path.join(directory, 'manifest.json')
  fs.writeFileSync(outsideManifest, '{}')
  fs.symlinkSync(outsideManifest, path.join(output, '.liquidify-manifest.json'))
  await assert.rejects(new OutputManifest(output, adapter, new SilentLogger()).begin([], new Set()), /Symbolic links/)
  assert.equal(fs.readFileSync(outsideManifest, 'utf8'), '{}')
})

test('aggregate symlinks abort the commit and roll back staged runtime writes', async (t) => {
  const { directory, output, manifest, runtime } = fixture(t)
  const outside = path.join(directory, 'global.css')
  fs.writeFileSync(outside, 'user stylesheet')
  fs.symlinkSync(outside, path.join(output, 'assets/global.css'))
  await manifest.begin([], new Set())
  await manifest.stageRuntime('runtime')
  await assert.rejects(manifest.finish(), /Symbolic links/)
  assert.equal(fs.existsSync(runtime), false)
  assert.equal(fs.readFileSync(outside, 'utf8'), 'user stylesheet')
})

test('stale-output cleanup never follows a replacement directory symlink', async (t) => {
  const { directory, output, manifest } = fixture(t)
  const source = path.join(directory, 'Card.tsx')
  const generated = path.join(output, 'snippets/card.liquid')
  await manifest.begin([source], new Set([source]))
  await manifest.write(source, generated, 'original output')
  await manifest.finish()
  const outside = path.join(directory, 'outside-snippets')
  fs.renameSync(path.dirname(generated), outside)
  fs.symlinkSync(outside, path.dirname(generated), 'dir')
  await assert.rejects(manifest.begin([], new Set()), /Symbolic links/)
  assert.equal(fs.readFileSync(path.join(outside, 'card.liquid'), 'utf8'), 'original output')
})

test('unmanaged and user-modified runtimes require force, while identical legacy runtimes can be adopted', async (t) => {
  const { output, adapter, manifest, runtime } = fixture(t)
  fs.writeFileSync(runtime, 'user runtime')
  await manifest.begin([], new Set())
  await assert.rejects(manifest.stageRuntime('compiler runtime'), /unmanaged or user-modified/)
  assert.equal(fs.readFileSync(runtime, 'utf8'), 'user runtime')
  await manifest.stageRuntime('user runtime')
  await manifest.finish()
  const restarted = new OutputManifest(output, adapter, new SilentLogger())
  await restarted.begin([], new Set())
  await restarted.stageRuntime('updated runtime')
  await restarted.finish()
  fs.writeFileSync(runtime, 'manual edit')
  await restarted.begin([], new Set())
  await assert.rejects(restarted.stageRuntime('new runtime'), /user-modified/)
  const forced = new OutputManifest(output, adapter, new SilentLogger(), { force: true })
  await forced.begin([], new Set())
  await forced.stageRuntime('forced runtime')
  await forced.finish()
  assert.equal(fs.readFileSync(runtime, 'utf8'), 'forced runtime')
})

test('manifest write failures restore the previous runtime and manifest', async (t) => {
  const { output, adapter, manifest, runtime } = fixture(t)
  await manifest.begin([], new Set())
  await manifest.stageRuntime('original runtime')
  await manifest.finish()
  const manifestFile = path.join(output, '.liquidify-manifest.json')
  const originalManifest = fs.readFileSync(manifestFile, 'utf8')
  await manifest.begin([], new Set())
  await manifest.stageRuntime('new runtime')
  const write = adapter.writeFile.bind(adapter)
  let failed = false
  adapter.writeFile = async (file, content) => {
    if (file === manifestFile && !failed) {
      failed = true
      throw new Error('disk failure')
    }
    return write(file, content)
  }
  await assert.rejects(manifest.finish(), /disk failure/)
  assert.equal(fs.readFileSync(runtime, 'utf8'), 'original runtime')
  assert.equal(fs.readFileSync(manifestFile, 'utf8'), originalManifest)
})

test('compilation failures do not publish a staged runtime', async (t) => {
  const { directory, output, runtime } = fixture(t)
  const components = path.join(directory, 'components')
  fs.mkdirSync(components)
  const component = path.join(components, 'Card.tsx')
  fs.writeFileSync(component, 'export default function Card() { return <div>ok</div> }')
  const builder = makeLiquidifyBuilder({ componentsDir: components, output })
  t.after(() => builder.dispose())
  await builder.build()
  const original = fs.readFileSync(runtime, 'utf8')
  builder.runtimeScript = 'staged replacement'
  fs.writeFileSync(component, 'export default function Card({ props }) { return <div {...props} /> }')
  await assert.rejects(builder.build(), /spread attributes/)
  assert.equal(fs.readFileSync(runtime, 'utf8'), original)
})

function islandParser() {
  const parser = makeParser()
  parser.setReactRegistry(new Map([['MyIsland', { rootId: '', script: 'my-island.js', mode: 'react' }]]))
  return parser
}

test('island props preserve null, undefined, negative numbers and eager=false', async () => {
  const result = await islandParser().parse(
    `export default function Card() {
    return <MyIsland eager={false} value={null} missing={undefined} count={-3} enabled={false} />
  }`,
    '/src/Card.tsx',
  )
  assert.doesNotMatch(result.html, /data-hydrate="eager"/)
  const json = result.html.match(/data-react-props>(.*?)<\/script>/s)[1]
  assert.deepEqual(JSON.parse(json), { value: null, missing: null, count: -3, enabled: false })
  const eager = await islandParser().parse('export default function Card() { return <MyIsland eager /> }', '/src/Card.tsx')
  assert.match(eager.html, /data-hydrate="eager"/)
})

test('unsupported island expressions are rejected without executing malicious calls', async () => {
  globalThis.__liquidifyExecuted = false
  try {
    for (const value of [
      'globalThis.__liquidifyExecuted = true',
      '(() => { globalThis.__liquidifyExecuted = true })()',
      '{ run: (() => { globalThis.__liquidifyExecuted = true })() }',
    ]) {
      await assert.rejects(
        islandParser().parse(`export default function Card() { return <MyIsland value={${value}} /> }`, '/src/Card.tsx'),
        /Unsupported|only static/,
      )
      assert.equal(globalThis.__liquidifyExecuted, false)
    }
    await assert.rejects(
      islandParser().parse('export default function Card({ flag }) { return <MyIsland eager={flag} /> }', '/src/Card.tsx'),
      /static boolean/,
    )
  } finally {
    delete globalThis.__liquidifyExecuted
  }
})

test('serialized island props cannot close the JSON script element', async () => {
  const payload = '</script><script>alert(1)</script>'
  const result = await islandParser().parse(
    `export default function Card() { return <MyIsland value={${JSON.stringify(payload)}} /> }`,
    '/src/Card.tsx',
  )
  assert.doesNotMatch(result.html, /<script>alert/)
  assert.match(result.html, /\\u003c/)
  assert.equal(JSON.parse(jsonForHtml(payload)), payload)
})

test('supported Liquid translation helpers remain valid island props', async () => {
  const result = await islandParser().parse(
    `export default function Card() { return <MyIsland label={t('collection.empty_heading')} /> }`,
    '/src/Card.tsx',
  )
  assert.match(result.html, /collection\.empty_heading.*\| t \| json \| replace/)
})
