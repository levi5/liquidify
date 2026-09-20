import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { ConfigLoader } from '../dist/infra/adapters/config/config-loader.js'
import { DEFAULT_CONFIG } from '../dist/core/entities/config.js'
import { captureConsole } from './helpers.mjs'

let cwd

beforeEach(() => {
  cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'liquidify-config-'))
})

afterEach(() => {
  fs.rmSync(cwd, { recursive: true, force: true })
})

describe('ConfigLoader', () => {
  it('returns defaults when no config file exists', () => {
    assert.deepEqual(ConfigLoader.load(cwd), DEFAULT_CONFIG)
  })

  it('loads liquidify.config.json with first-hit precedence', () => {
    fs.writeFileSync(
      path.join(cwd, 'liquidify.config.json'),
      JSON.stringify({ componentsDir: 'src/components', output: '.' }),
    )

    assert.deepEqual(ConfigLoader.load(cwd), { componentsDir: 'src/components', output: '.' })
  })

  it('falls back to defaults and logs when the config is corrupt', async () => {
    fs.writeFileSync(path.join(cwd, 'liquidify.config.json'), '{ not json')
    const { result, errors } = await captureConsole(async () => ConfigLoader.load(cwd))

    assert.deepEqual(result, DEFAULT_CONFIG)
    assert.ok(errors.some((line) => line.includes('liquidify.config.json')))
  })

  it('warns on unknown keys instead of silently keeping them', async () => {
    fs.writeFileSync(
      path.join(cwd, 'liquidify.config.json'),
      JSON.stringify({ componentsDir: 'src', output: '.', typoKey: true }),
    )
    const { result, warns } = await captureConsole(async () => ConfigLoader.load(cwd))

    assert.equal(result.componentsDir, 'src')
    assert.ok(warns.some((line) => line.includes('typoKey')))
  })

  it('warns and falls back to the default for wrongly typed values', async () => {
    fs.writeFileSync(path.join(cwd, 'liquidify.config.json'), JSON.stringify({ componentsDir: 123, output: '.' }))
    const { result, warns } = await captureConsole(async () => ConfigLoader.load(cwd))

    assert.equal(result.componentsDir, DEFAULT_CONFIG.componentsDir)
    assert.equal(result.output, '.')
    assert.ok(warns.some((line) => line.includes('componentsDir')))
  })

  it('warns when componentsDir does not exist', async () => {
    fs.writeFileSync(
      path.join(cwd, 'liquidify.config.json'),
      JSON.stringify({ componentsDir: 'src/missing', output: '.' }),
    )
    const { warns } = await captureConsole(async () => ConfigLoader.load(cwd))

    assert.ok(warns.some((line) => line.includes('src/missing')))
  })
})
