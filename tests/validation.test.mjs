import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { ValidationService } from '../dist/application/services/validation-service.js'
import { SchemaValidator } from '../dist/application/services/schema-validation.js'

const serviceFor = () => new ValidationService(new SchemaValidator())
import { ValidationError } from '../dist/core/errors/validation-error.js'

describe('ValidationService', () => {
  it('rejects react mode inside sections', () => {
    const service = serviceFor()
    assert.throws(() => service.validate({ mode: 'react', type: 'sections' }, '/theme/sections/Hero.tsx'), ValidationError)
  })

  it('rejects js logic in liquid mode inside sections without a dom/script directive', () => {
    const service = serviceFor()
    assert.throws(() => service.validate({ mode: 'liquid', hasJsLogic: true }, '/theme/sections/Hero.tsx'), ValidationError)
  })

  it('accepts dom mode inside sections', () => {
    const service = serviceFor()
    assert.doesNotThrow(() => service.validate({ mode: 'dom' }, '/theme/sections/Hero.tsx'))
  })

  it('skips validation without a file path', () => {
    const service = serviceFor()
    assert.doesNotThrow(() => service.validate({ mode: 'react' }, undefined))
  })

  it('ignores files outside sections/snippets/blocks', () => {
    const service = serviceFor()
    assert.doesNotThrow(() => service.validate({ mode: 'react' }, '/theme/src/components/islands/Card.tsx'))
  })
})
