import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { parseInitArgs, resolveTemplate, copyTemplate, normalizeTemplateName } from '../dist/presentation/cli/commands/init.js'

test('normalizeTemplateName normalizes aliases', () => {
  assert.equal(normalizeTemplateName('theme'), 'theme')
  assert.equal(normalizeTemplateName('starter'), 'theme')
  assert.equal(normalizeTemplateName('default'), 'theme')
  assert.equal(normalizeTemplateName('example'), 'theme')
  assert.equal(normalizeTemplateName('fashion'), 'theme')
  assert.equal(normalizeTemplateName('store'), 'theme')
  assert.equal(normalizeTemplateName(), 'theme')
})

test('parseInitArgs handles various argument combinations', () => {
  assert.deepEqual(parseInitArgs([]), { targetDir: '.', template: 'theme' })
  assert.deepEqual(parseInitArgs(['my-store']), { targetDir: 'my-store', template: 'theme' })
  assert.deepEqual(parseInitArgs(['my-store', '--template', 'theme']), { targetDir: 'my-store', template: 'theme' })
  assert.deepEqual(parseInitArgs(['--template', 'theme', 'my-store']), { targetDir: 'my-store', template: 'theme' })
  assert.deepEqual(parseInitArgs(['-t', 'theme', 'my-store']), { targetDir: 'my-store', template: 'theme' })
  assert.deepEqual(parseInitArgs(['--template=theme']), { targetDir: '.', template: 'theme' })
  assert.deepEqual(parseInitArgs(['-t=theme']), { targetDir: '.', template: 'theme' })
  assert.deepEqual(parseInitArgs(['--template']), { targetDir: '.', template: 'theme' })
  assert.deepEqual(parseInitArgs(['my-store', '--template', 'starter']), { targetDir: 'my-store', template: 'theme' })
  assert.deepEqual(parseInitArgs(['my-store', '--template', 'default']), { targetDir: 'my-store', template: 'theme' })
  assert.deepEqual(parseInitArgs(['my-store', '--force']), { targetDir: 'my-store', template: 'theme', force: true })
  assert.deepEqual(parseInitArgs(['my-store', '-f']), { targetDir: 'my-store', template: 'theme', force: true })
})

test('resolveTemplate finds theme template', () => {
  const example = resolveTemplate('theme')
  assert.ok(fs.existsSync(example), `Theme template should exist at ${example}`)
  assert.ok(fs.existsSync(path.join(example, 'package.json')))
})

test('copyTemplate copies template and updates package.json', (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'liquidify-init-test-'))
  t.after(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  const targetDir = path.join(tempDir, 'my-new-store')
  const exampleSource = resolveTemplate('theme')
  const result = copyTemplate(exampleSource, targetDir, 'my-new-store')

  assert.ok(result.isRight(), 'copyTemplate should succeed')
  assert.ok(fs.existsSync(path.join(targetDir, 'package.json')))
  assert.ok(fs.existsSync(path.join(targetDir, 'src/app')))
  assert.ok(fs.existsSync(path.join(targetDir, 'locales/en.default.json')))
  assert.ok(fs.existsSync(path.join(targetDir, 'locales/pt-BR.json')))
  assert.ok(fs.existsSync(path.join(targetDir, 'locales/en.default.schema.json')))
  assert.ok(fs.existsSync(path.join(targetDir, 'locales/pt-BR.schema.json')))

  const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf-8'))
  assert.equal(pkg.name, 'my-new-store')
  assert.ok(pkg.dependencies.liquidify.startsWith('^'), `Liquidify dependency should be semver range, got ${pkg.dependencies.liquidify}`)
  assert.equal(fs.existsSync(path.join(targetDir, 'node_modules')), false)
})