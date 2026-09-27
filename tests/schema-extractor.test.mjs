import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parse } from '@babel/parser'
import { SchemaExtractor } from '../dist/infra/adapters/parsers/babel/schema/schema-extractor.js'
import { ModuleResolver } from '../dist/infra/adapters/fs/module-resolver.js'
import { SilentLogger } from '../dist/shared/logger.js'

const makeExtractor = (fs) => new SchemaExtractor(fs, new ModuleResolver(fs), new SilentLogger())

const ast = (source) => parse(source, { sourceType: 'module', plugins: ['typescript'] })

test('schema extraction keeps local declarations isolated between files', () => {
  const extractor = makeExtractor({ existsSync: () => false, readFileSync: () => '' })
  assert.deepEqual(extractor.extract(ast('const name = "First"; export const schema = { name }')), { name: 'First' })
  assert.deepEqual(extractor.extract(ast('const name = "Second"; export const schema = { name }')), { name: 'Second' })
})

test('schema extraction resolves imported objects, local constants and spreads', () => {
  const files = new Map([['/theme/shared.ts', 'const label = "Title"; export const settings = [{ type: "text", id: "title", label }]']])
  const fs = { existsSync: (file) => files.has(file), readFileSync: (file) => files.get(file) }
  const extractor = makeExtractor(fs)
  const schema = extractor.extract(
    ast(`
    import { settings } from './shared'
    const base = { name: 'Hero' }
    export const schema = { ...base, settings: [...settings] }
  `),
    '/theme/Hero.tsx',
  )
  assert.deepEqual(schema, { name: 'Hero', settings: [{ type: 'text', id: 'title', label: 'Title' }] })
})
