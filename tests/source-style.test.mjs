import { test } from 'node:test'
import assert from 'node:assert/strict'
import traverse from '@babel/traverse'
import { glob } from 'glob'
import {
  projectSources,
  parseSource,
  moduleSpecifiers,
  assetExtension,
  internalAlias,
  executableArtifact,
} from '#tests/helpers/source-files.mjs'

test('project source has no implementation comments', async () => {
  for (const filename of await projectSources()) {
    assert.equal(parseSource(filename).comments?.length ?? 0, 0, filename)
  }
})

test('internal module imports use aliases rather than relative paths', async () => {
  for (const filename of await projectSources()) {
    for (const specifier of moduleSpecifiers(parseSource(filename))) {
      assert.ok(!specifier.startsWith('.') || assetExtension.test(specifier), `${filename}: ${specifier}`)
    }
  }
})

test('implementation avoids long else-if chains', async () => {
  for (const filename of await projectSources()) {
    if (filename.startsWith('tests/')) continue
    traverse.default(parseSource(filename), {
      IfStatement(currentPath) {
        const alternate = currentPath.node.alternate
        assert.ok(alternate?.type !== 'IfStatement' || alternate.alternate?.type !== 'IfStatement', filename)
      },
    })
  }
})

test('compiled JavaScript and declarations do not leak build-time aliases', async () => {
  for (const filename of await glob('dist/**/*.{js,ts}')) {
    if (!executableArtifact(filename)) continue
    for (const specifier of moduleSpecifiers(parseSource(filename))) {
      assert.equal(internalAlias.test(specifier), false, `${filename}: ${specifier}`)
    }
  }
})
