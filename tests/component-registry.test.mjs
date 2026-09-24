import { test } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { ComponentRegistry, DirectiveScanner } from '../dist/application/services/component-registry.js'
import { ASTParser } from '../dist/infra/adapters/parsers/babel/ASTParser.js'

const scanner = () => new DirectiveScanner(new ASTParser())

test('registry resolves transitive dependencies and terminates on cycles', async () => {
  const metadata = {
    A: { scriptAssets: ['b.js'], mode: 'react' },
    B: { scriptAssets: ['c.js'], mode: 'react' },
    C: { scriptAssets: ['a.js'], mode: 'react' },
  }
  const registry = new ComponentRegistry(
    {
      async parse(_source, file) {
        const name = path.basename(file, '.tsx')
        return { name, ...metadata[name] }
      },
    },
    { readFileSync: () => "'use react (#root)'" },
    scanner(),
  )
  const result = await registry.scan(['A.tsx', 'B.tsx', 'C.tsx'])
  for (const config of result.values()) {
    assert.deepEqual(new Set(config.scriptAssets), new Set(['a.js', 'b.js', 'c.js']))
    assert.equal(config.rootId, 'root')
  }
})

test('registry propagates parser failures', async () => {
  const failure = new Error('invalid component')
  const registry = new ComponentRegistry(
    {
      parse: async () => {
        throw failure
      },
    },
    {
      readFileSync: () => "'use react'",
    },
    scanner(),
  )
  await assert.rejects(registry.scan(['Invalid.tsx']), (error) => error === failure)
})

test('registry scans sequentially and stops after the first parser failure', async () => {
  const calls = []
  const failure = new Error('invalid second component')
  let active = 0
  const registry = new ComponentRegistry(
    {
      async parse(_source, file) {
        active++
        assert.equal(active, 1)
        await Promise.resolve()
        active--
        const name = path.basename(file, '.tsx')
        calls.push(name)
        if (name === 'B') throw failure
        return { name, mode: 'react' }
      },
    },
    { readFileSync: () => "'use react'" },
    scanner(),
  )
  await assert.rejects(registry.scan(['A.tsx', 'B.tsx', 'C.tsx']), (error) => error === failure)
  assert.deepEqual(calls, ['A', 'B'])
})
