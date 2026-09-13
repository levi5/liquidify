import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { TranspileFileUseCase } from '../dist/application/services/transpile-file.js'

function makeUseCase({ component = { name: 'Hero' }, validate = () => {} } = {}) {
  const generated = []
  const useCase = new TranspileFileUseCase(
    { parse: async () => component },
    { generate: async (parsed) => generated.push(parsed) },
    { validate },
  )
  return { useCase, generated }
}

describe('TranspileFileUseCase', () => {
  it('reports skipped-empty instead of silently dropping blank sources', async () => {
    const { useCase, generated } = makeUseCase()
    const status = await useCase.execute('   ', '/theme/src/components/sections/Hero.tsx')

    assert.equal(status, 'skipped-empty')
    assert.deepEqual(generated, [])
  })

  it('reports skipped-unnamed instead of silently dropping components without a name', async () => {
    const { useCase, generated } = makeUseCase({ component: { name: '' } })
    const status = await useCase.execute('<div>hi</div>', '/theme/src/components/sections/Hero.tsx')

    assert.equal(status, 'skipped-unnamed')
    assert.deepEqual(generated, [])
  })

  it('reports ok and generates named components', async () => {
    const { useCase, generated } = makeUseCase()
    const status = await useCase.execute('source', '/theme/src/components/sections/Hero.tsx')

    assert.equal(status, 'ok')
    assert.equal(generated.length, 1)
  })

  it('propagates validation errors', async () => {
    const boom = new Error('invalid')
    const { useCase } = makeUseCase({
      validate: () => {
        throw boom
      },
    })

    await assert.rejects(useCase.execute('source', '/theme/sections/Hero.tsx'), (error) => error === boom)
  })
})
