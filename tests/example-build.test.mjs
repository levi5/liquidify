import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { makeLiquidifyBuilder } from '../dist/index.js'

const example = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../resources/templates/theme')
const componentsDir = path.join(example, 'src/app')
const manifestName = '.liquidify-manifest.json'

function setup(t) {
  const previousCwd = process.cwd()
  process.chdir(example)
  const output = fs.mkdtempSync(path.join(os.tmpdir(), 'liquidify-example-build-'))
  const builder = makeLiquidifyBuilder({ componentsDir, output })
  const errors = []
  let completed = false
  builder.on('error', (error) => errors.push(error))
  builder.on('build:end', () => {
    completed = true
  })
  t.after(async () => {
    await builder.dispose().catch(() => undefined)
    builder.disposeSync()
    process.chdir(previousCwd)
    fs.rmSync(output, { recursive: true, force: true })
  })
  const calls = []
  const execute = builder.useCase.execute.bind(builder.useCase)
  builder.useCase.execute = async (source, file) => {
    calls.push(path.basename(file))
    return execute(source, file)
  }
  return { output, builder, errors, calls, isCompleted: () => completed }
}

const listFiles = (dir) =>
  fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => (entry.isDirectory() ? listFiles(path.join(dir, entry.name)) : [path.join(dir, entry.name)]))

const read = (output, relative) => fs.readFileSync(path.join(output, relative), 'utf8')

describe('example store build', { timeout: 120000 }, () => {
  it('builds the example store with zero errors', async (t) => {
    const { output, builder, errors, isCompleted } = setup(t)
    await builder.build()
    assert.deepEqual(errors, [])
    assert.equal(isCompleted(), true)

    for (const relative of [
      'sections/header.liquid',
      'sections/footer.liquid',
      'sections/product-info.liquid',
      'snippets/card.liquid',
      'snippets/script-global.liquid',
      'assets/react-runtime.js',
      'assets/theme.js',
      manifestName,
    ]) {
      assert.equal(fs.existsSync(path.join(output, relative)), true, `${relative} should be generated`)
    }

    assert.match(read(output, 'sections/header.liquid'), /{% schema %}/)
    assert.match(read(output, 'sections/product-info.liquid'), /<react-island/)
    assert.match(read(output, 'sections/product-info.liquid'), /{{ product\.description }}/)
    assert.match(read(output, 'sections/main-collection.liquid'), /{% render 'active-filters', filters: collection\.filters %}/)
    assert.match(read(output, 'snippets/card.liquid'), /{% if /)
    assert.match(read(output, 'snippets/script-global.liquid'), /asset_url/)
    assert.ok(read(output, 'assets/react-runtime.js').length > 10000)

    const manifest = JSON.parse(read(output, manifestName))
    assert.ok(Object.keys(manifest.entries).length > 50, 'manifest should track every example source')
  })

  it('active filters snippet keeps Liquid blocks out of HTML tags', async (t) => {
    const { output, builder, errors } = setup(t)
    await builder.build()
    assert.deepEqual(errors, [])

    const snippet = read(output, 'snippets/active-filters.liquid')
    assert.match(snippet, /request\.path/)
    for (const [tag] of snippet.matchAll(/<[a-z][^>]*>/gi)) {
      assert.doesNotMatch(tag, /{%/, `Liquid block inside an HTML tag: ${tag}`)
    }
    for (const [, output] of snippet.matchAll(/{{(.*?)}}/g)) {
      assert.doesNotMatch(output, /\bor\b/, `bare "or" leaked into output: {{${output}}}`)
    }
  })

  it('every section ships a schema and no liquid output leaks undefined', async (t) => {
    const { output, builder, errors } = setup(t)
    await builder.build()
    assert.deepEqual(errors, [])

    const sections = listFiles(path.join(output, 'sections')).filter((file) => file.endsWith('.liquid'))
    assert.ok(sections.length > 10, `expected many sections, got ${sections.length}`)
    for (const file of sections) {
      assert.match(fs.readFileSync(file, 'utf8'), /{% schema %}/, `${path.basename(file)} should carry a schema`)
    }
    const liquids = listFiles(output).filter((file) => file.endsWith('.liquid'))
    for (const file of liquids) {
      assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /undefined/, `${path.basename(file)} leaks undefined`)
    }
  })

  it('rebuild without changes performs no work', async (t) => {
    const { output, builder, errors, calls } = setup(t)
    await builder.build()
    assert.deepEqual(errors, [])
    const manifestBefore = read(output, manifestName)
    calls.length = 0
    await builder.build()
    assert.deepEqual(errors, [])
    assert.deepEqual(calls, [])
    assert.equal(read(output, manifestName), manifestBefore)
  })

  it('missing outputs are regenerated from the example sources', async (t) => {
    const { output, builder, errors, calls } = setup(t)
    await builder.build()
    assert.deepEqual(errors, [])
    fs.unlinkSync(path.join(output, 'snippets/card.liquid'))
    fs.unlinkSync(path.join(output, 'assets/theme.js'))
    calls.length = 0
    await builder.build()
    assert.deepEqual(errors, [])
    assert.equal(fs.existsSync(path.join(output, 'snippets/card.liquid')), true)
    assert.equal(fs.existsSync(path.join(output, 'assets/theme.js')), true)
    assert.deepEqual(new Set(calls), new Set(['index.tsx', 'theme.ts']))
  })
})
