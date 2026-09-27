import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { formatHelp, parseCliArgs } from '../dist/presentation/cli/args.js'

describe('parseCliArgs', () => {
  it('defaults to a build with no flags', () => {
    assert.deepEqual(parseCliArgs([]), {
      command: 'build',
      watch: false,
      force: false,
      configPath: undefined,
      noBanner: false,
      quiet: false,
      initArgs: [],
    })
  })

  it('parses watch and force flags', () => {
    assert.equal(parseCliArgs(['--watch']).watch, true)
    assert.equal(parseCliArgs(['-w']).watch, true)
    assert.equal(parseCliArgs(['--force']).force, true)
    assert.equal(parseCliArgs(['-f']).force, true)
  })

  it('routes init and forwards its args', () => {
    const parsed = parseCliArgs(['init', 'my-theme', '--template', 'example'])
    assert.equal(parsed.command, 'init')
    assert.deepEqual(parsed.initArgs, ['my-theme', '--template', 'example'])
  })

  it('gives help precedence over other commands', () => {
    assert.equal(parseCliArgs(['init', '--help']).command, 'help')
    assert.equal(parseCliArgs(['-h']).command, 'help')
  })

  it('routes version flags', () => {
    assert.equal(parseCliArgs(['--version']).command, 'version')
    assert.equal(parseCliArgs(['-V']).command, 'version')
  })

  it('extracts explicit config paths', () => {
    assert.equal(parseCliArgs(['--config', './custom.json']).configPath, './custom.json')
    assert.equal(parseCliArgs(['--config=./custom.json']).configPath, './custom.json')
    assert.equal(parseCliArgs([]).configPath, undefined)
  })

  it('detects banner suppression flags', () => {
    assert.equal(parseCliArgs(['--no-banner']).noBanner, true)
    assert.equal(parseCliArgs(['--quiet']).quiet, true)
    assert.equal(parseCliArgs(['-q']).quiet, true)
    assert.equal(parseCliArgs(['-q']).noBanner, true)
  })
})

describe('formatHelp', () => {
  it('documents the additive flags', () => {
    const help = formatHelp()
    for (const flag of ['--config', '--no-banner', '--quiet', '--version', '--watch', '--force']) {
      assert.ok(help.includes(flag), `help should mention ${flag}`)
    }
  })
})
