import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { ConfigLoader, loadConfig } from '../dist/infra/adapters/config/config-loader.js'
import { ValidationError } from '../dist/core/errors/validation-error.js'
import { DEFAULT_CONFIG } from '../dist/core/entities/config.js'

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
    fs.writeFileSync(path.join(cwd, '.liquidifyrc.json'), JSON.stringify({ output: 'ignored' }))
    fs.writeFileSync(path.join(cwd, 'liquidify.config.json'), JSON.stringify({ componentsDir: 'src/components', output: '.' }))

    assert.deepEqual(ConfigLoader.load(cwd), {
      ...DEFAULT_CONFIG,
      componentsDir: path.resolve(cwd, 'src/components'),
      output: path.resolve(cwd, '.'),
      plugins: [],
    })
  })

  it('rejects corrupt configuration with its file path', () => {
    const file = path.join(cwd, 'liquidify.config.json')
    fs.writeFileSync(file, '{ not json')
    assert.throws(
      () => ConfigLoader.load(cwd),
      (error) => {
        assert.ok(error instanceof ValidationError)
        assert.equal(error.filePath, file)
        assert.match(error.message, /Invalid JSON/)
        return true
      },
    )
  })

  it('rejects wrongly typed paths', () => {
    fs.writeFileSync(path.join(cwd, 'liquidify.config.json'), JSON.stringify({ componentsDir: 123, output: '.' }))
    assert.throws(() => loadConfig(cwd), ValidationError)
  })

  it('rejects configuration that is not an object', () => {
    for (const value of [null, [], 'theme', 42]) {
      fs.writeFileSync(path.join(cwd, 'liquidify.config.json'), JSON.stringify(value))
      assert.throws(() => loadConfig(cwd), ValidationError)
    }
  })

  it('keeps the class API compatible with the function API', () => {
    fs.writeFileSync(path.join(cwd, 'liquidify.config.json'), JSON.stringify({ output: '.', react: { strictCsp: false } }))
    assert.deepEqual(ConfigLoader.load(cwd), loadConfig(cwd))
    assert.equal(ConfigLoader.load(cwd).react.strictCsp, false)
  })

  it('resolves TypeScript plugin dependencies relative to the plugin file', () => {
    const plugins = path.join(cwd, '.plugins')
    fs.mkdirSync(plugins)
    fs.writeFileSync(path.join(plugins, 'name.cjs'), "module.exports = 'relative-plugin'")
    fs.writeFileSync(path.join(plugins, 'example.ts'), "import name from './name.cjs'; export default { name, setup() {} }")
    fs.writeFileSync(path.join(cwd, 'liquidify.config.json'), JSON.stringify({ plugins: ['example'] }))
    const config = loadConfig(cwd)
    assert.equal(config.plugins[0].name, 'relative-plugin')
    assert.equal(typeof config.plugins[0].setup, 'function')
  })
})

describe('React configuration validation', () => {
  it('rejects malformed React options', () => {
    for (const react of [null, [], false, { strictCsp: 'false' }]) {
      fs.writeFileSync(path.join(cwd, 'liquidify.config.json'), JSON.stringify({ react }))
      assert.throws(() => loadConfig(cwd), ValidationError)
    }
  })
  it('fills missing React defaults', () => {
    fs.writeFileSync(path.join(cwd, 'liquidify.config.json'), JSON.stringify({ react: {} }))
    assert.deepEqual(loadConfig(cwd).react, { strictCsp: true })
  })
  it('does not share mutable defaults between loads', () => {
    loadConfig(cwd).react.strictCsp = false
    assert.equal(loadConfig(cwd).react.strictCsp, true)
  })

  it('loads an explicit config file path', () => {
    const file = path.join(cwd, 'custom.json')
    fs.writeFileSync(file, JSON.stringify({ componentsDir: 'src/components', output: '.' }))
    const config = loadConfig(cwd, file)
    assert.equal(config.output, path.resolve(cwd, '.'))
    assert.deepEqual(ConfigLoader.loadFromFile(file), config)
  })

  it('rejects a missing explicit config file', () => {
    assert.throws(() => loadConfig(cwd, path.join(cwd, 'missing.json')), ValidationError)
  })

  it('suggests similar key names on typos', () => {
    fs.writeFileSync(path.join(cwd, 'liquidify.config.json'), JSON.stringify({ componentDir: 'src' }))
    assert.throws(
      () => loadConfig(cwd),
      (error) => {
        assert.ok(error instanceof ValidationError)
        assert.match(error.message, /Did you mean "componentsDir"/)
        return true
      },
    )
  })
})
