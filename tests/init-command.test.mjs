import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { parseInitArgs, resolveTemplate, copyTemplate, normalizeTemplateName } from '../dist/presentation/cli/commands/init.js'

test('normalizeTemplateName normalizes aliases', () => {
  assert.equal(normalizeTemplateName('example'), 'example')
  assert.equal(normalizeTemplateName('fashion'), 'example')
  assert.equal(normalizeTemplateName('store'), 'example')
  assert.equal(normalizeTemplateName('shopify-starter'), 'example')
  assert.equal(normalizeTemplateName('starter'), 'example')
  assert.equal(normalizeTemplateName('start'), 'example')
  assert.equal(normalizeTemplateName('default'), 'example')
  assert.equal(normalizeTemplateName(), 'example')
})

test('parseInitArgs handles various argument combinations', () => {
  assert.deepEqual(parseInitArgs([]), { targetDir: '.', template: 'example' })
  assert.deepEqual(parseInitArgs(['my-store']), { targetDir: 'my-store', template: 'example' })
  assert.deepEqual(parseInitArgs(['my-store', '--template', 'example']), { targetDir: 'my-store', template: 'example' })
  assert.deepEqual(parseInitArgs(['--template', 'example', 'my-store']), { targetDir: 'my-store', template: 'example' })
  assert.deepEqual(parseInitArgs(['-t', 'example', 'my-store']), { targetDir: 'my-store', template: 'example' })
  assert.deepEqual(parseInitArgs(['--template=example']), { targetDir: '.', template: 'example' })
  assert.deepEqual(parseInitArgs(['-t=example']), { targetDir: '.', template: 'example' })
  assert.deepEqual(parseInitArgs(['--template']), { targetDir: '.', template: 'example' })
  assert.deepEqual(parseInitArgs(['my-store', '--template', 'fashion']), { targetDir: 'my-store', template: 'example' })
  assert.deepEqual(parseInitArgs(['my-store', '--template', 'start']), { targetDir: 'my-store', template: 'example' })
  assert.deepEqual(parseInitArgs(['my-store', '--template', 'starter']), { targetDir: 'my-store', template: 'example' })
  assert.deepEqual(parseInitArgs(['my-store', '--force']), { targetDir: 'my-store', template: 'example', force: true })
  assert.deepEqual(parseInitArgs(['my-store', '-f']), { targetDir: 'my-store', template: 'example', force: true })
})

test('resolveTemplate finds example template', () => {
  const example = resolveTemplate('example')
  assert.ok(fs.existsSync(example), `Example template should exist at ${example}`)
  assert.ok(fs.existsSync(path.join(example, 'package.json')))
})

test('copyTemplate copies template and updates package.json', (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'liquidify-init-test-'))
  t.after(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  const targetDir = path.join(tempDir, 'my-new-store')
  const exampleSource = resolveTemplate('example')
  const result = copyTemplate(exampleSource, targetDir, 'my-new-store')

  assert.ok(result.isRight(), 'copyTemplate should succeed')
  assert.ok(fs.existsSync(path.join(targetDir, 'package.json')))
  assert.ok(fs.existsSync(path.join(targetDir, 'src/components')))

  const pkg = JSON.parse(fs.readFileSync(path.join(targetDir, 'package.json'), 'utf-8'))
  assert.equal(pkg.name, 'my-new-store')
  assert.ok(pkg.dependencies.liquidify.startsWith('^'), `Liquidify dependency should be semver range, got ${pkg.dependencies.liquidify}`)
  assert.equal(fs.existsSync(path.join(targetDir, 'node_modules')), false)
})
