import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ValidationService } from '../dist/application/services/validation-service.js'
import { ValidationError } from '../dist/core/errors/validation-error.js'

describe('ValidationService', () => {
  it('rejects react mode inside sections', () => {
    const service = new ValidationService()
    assert.throws(
      () => service.validate({ mode: 'react', type: 'sections' }, '/theme/sections/Hero.tsx'),
      ValidationError,
    )
  })

  it('rejects js logic in liquid mode inside sections without a dom/script directive', () => {
    const service = new ValidationService()
    assert.throws(
      () => service.validate({ mode: 'liquid', hasJsLogic: true }, '/theme/sections/Hero.tsx'),
      ValidationError,
    )
  })

  it('accepts dom mode inside sections', () => {
    const service = new ValidationService()
    assert.doesNotThrow(() => service.validate({ mode: 'dom' }, '/theme/sections/Hero.tsx'))
  })

  it('skips validation without a file path', () => {
    const service = new ValidationService()
    assert.doesNotThrow(() => service.validate({ mode: 'react' }, undefined))
  })

  it('ignores files outside sections/snippets/blocks', () => {
    const service = new ValidationService()
    assert.doesNotThrow(() => service.validate({ mode: 'react' }, '/theme/src/components/islands/Card.tsx'))
  })
})
