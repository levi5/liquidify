import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { makeParser } from './helpers.mjs'
import { makeLiquidifyBuilder } from '../dist/index.js'
import { AggregateValidationError } from '../dist/core/errors/error-collector.js'
import { ValidationError } from '../dist/core/errors/validation-error.js'

describe('error recovery', () => {
  it('collects multiple errors from one file and reports them together', async () => {
    const parser = makeParser()
    await assert.rejects(
      parser.parse(
        `export default function Broken({ items }) {
  const a = items.find(predicate)
  return <div {...items}>{a}</div>
}`,
        '/theme/sections/Broken.tsx',
      ),
      (error) => {
        assert.ok(error instanceof AggregateValidationError, `expected AggregateValidationError, got ${error?.constructor?.name}`)
        assert.ok(error instanceof ValidationError)
        assert.equal(error.filePath, '/theme/sections/Broken.tsx')
        assert.ok(error.errors.length >= 2, `expected at least 2 collected errors, got ${error.errors.length}: ${error.message}`)
        return true
      },
    )
  })

  it('wraps a single parsing error as a ValidationError', async () => {
    const parser = makeParser()
    await assert.rejects(
      parser.parse('export default function Broken() { return <div>{items.find(predicate)}</div> }', '/theme/sections/One.tsx'),
      (error) => {
        assert.ok(error instanceof ValidationError)
        assert.equal(error.filePath, '/theme/sections/One.tsx')
        return true
      },
    )
  })

  it('parses valid components without collecting errors', async () => {
    const parser = makeParser()
    const component = await parser.parse('export default function Ok() { return <div>hi</div> }', '/theme/sections/Ok.tsx')
    assert.ok(component.html.includes('hi'))
  })
})

describe('parallel file processing', () => {
  it('builds every component in a multi-file project', async (t) => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'liquidify-parallel-'))
    t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
    for (const name of ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon']) {
      fs.writeFileSync(path.join(directory, `${name}.tsx`), `export default function ${name}() { return <section>${name}</section> }`)
    }
    const builder = makeLiquidifyBuilder({ componentsDir: directory, output: path.join(directory, 'out') })
    const errors = []
    builder.on('error', (error) => errors.push(error))
    await builder.build()
    assert.deepEqual(errors, [])
    for (const name of ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon']) {
      const liquid = path.join(directory, 'out', 'sections', `${name.toLowerCase()}.liquid`)
      assert.ok(fs.existsSync(liquid), `expected ${liquid} to exist`)
      assert.ok(fs.readFileSync(liquid, 'utf8').includes(name))
    }
    builder.disposeSync()
  })
})
