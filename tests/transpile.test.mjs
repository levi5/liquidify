import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { TranspileFileUseCase } from '../dist/application/services/transpile-file.js'
import { ValidationService } from '../dist/application/services/validation-service.js'
import { SchemaValidator } from '../dist/application/services/schema-validation.js'

function makeUseCase({ component = { name: 'Hero' } } = {}) {
  const generated = []
  const validator = new ValidationService(new SchemaValidator())
  const useCase = new TranspileFileUseCase(
    { parse: async () => component },
    { generate: async (parsed) => generated.push(parsed) },
    validator,
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
    const { useCase } = makeUseCase({
      component: { name: 'Header', type: 'sections', hasImplicitReturn: true },
    })

    await assert.rejects(useCase.execute('source', '/theme/src/components/sections/Header.tsx'), /Implicit return.*not allowed in sections/)
  })

  it('rejects implicit return in sections', async () => {
    const { useCase } = makeUseCase({
      component: { name: 'Header', type: 'sections', hasImplicitReturn: true },
    })
    await assert.rejects(useCase.execute('source', '/theme/src/components/sections/Header.tsx'), /Implicit return.*not allowed in sections/)
  })

  it('rejects implicit return in snippets', async () => {
    const { useCase } = makeUseCase({
      component: { name: 'Icon', type: 'snippets', hasImplicitReturn: true },
    })
    await assert.rejects(useCase.execute('source', '/theme/src/components/snippets/Icon.tsx'), /Implicit return.*not allowed in snippets/)
  })

  it('allows implicit return in blocks (dom mode)', async () => {
    const { useCase, generated } = makeUseCase({
      component: { name: 'Badge', type: 'blocks', mode: 'dom', hasImplicitReturn: true },
    })
    const status = await useCase.execute('source', '/theme/src/components/blocks/Badge.tsx')
    assert.equal(status, 'ok')
    assert.equal(generated.length, 1)
  })
})
