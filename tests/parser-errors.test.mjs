import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ASTParser } from '../dist/infra/adapters/parsers/babel/ASTParser.js'
import { LiquidifyError } from '../dist/core/errors/liquidify-error.js'
import { ValidationError } from '../dist/core/errors/validation-error.js'
import { makeParser, captureConsole } from './helpers.mjs'

describe('BabelLiquidParser errors', () => {
  it('wraps syntax errors in LiquidifyError instead of leaking raw Babel errors', () => {
    assert.throws(() => new ASTParser().parse('const = broken'), LiquidifyError)
  })

  it('surface filePath on wrapped syntax errors when parsing with a path', async () => {
    const parser = makeParser()
    await assert.rejects(parser.parse('const = broken', '/theme/src/components/sections/Bad.tsx'), (error) => {
      assert.ok(error instanceof LiquidifyError)
      assert.equal(error.filePath, '/theme/src/components/sections/Bad.tsx')
      return true
    })
  })

  it('rejects liquid-only filter calls inside react components', async () => {
    const parser = makeParser()
    await assert.rejects(
      parser.parse(
        `"use react"
export default function Card() {
  const price = money(product.price)
  return <div>{price}</div>
}`,
        '/theme/src/components/islands/Card.tsx',
      ),
      ValidationError,
    )
  })

  it('rejects circular schema references with a warning', async () => {
    const parser = makeParser()
    const { warns } = await captureConsole(() =>
      assert.rejects(
        parser.parse(
          `export default function H() { return <div>hi</div> }
const a = b
const b = a
export const schema = a`,
          '/theme/src/components/sections/H.tsx',
        ),
        ValidationError,
      ),
    )

    assert.ok(warns.some((line) => line.includes('Circular reference')))
  })
})
