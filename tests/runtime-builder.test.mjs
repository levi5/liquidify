import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ReactRuntimeBuilder } from '../dist/infra/adapters/compilers/react/runtime/runtime-builder.js'
import { LiquidifyError } from '../dist/core/errors/liquidify-error.js'

describe('ReactRuntimeBuilder', () => {
  it('returns the bundled runtime text', async () => {
    const builder = new ReactRuntimeBuilder({
      build: async () => ({ outputFiles: [{ text: '/* runtime */' }] }),
    })

    assert.equal(await builder.build(), '/* runtime */')
  })

  it('throws LiquidifyError when esbuild returns no output instead of writing undefined', async () => {
    const builder = new ReactRuntimeBuilder({ build: async () => ({ outputFiles: [] }) })

    await assert.rejects(builder.build(), LiquidifyError)
  })
})
