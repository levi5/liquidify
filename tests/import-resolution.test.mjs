import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parse } from '@babel/parser'
import { SchemaExtractor } from '../dist/infra/adapters/parsers/babel/schema/schema-extractor.js'
import { ImportResolver } from '../dist/infra/adapters/parsers/babel/liquid/import-resolver.js'

function fixture() {
  const files = new Map([
    ['/theme/tsconfig.json', '{ // aliases\n "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["src/*"], }, }, }'],
    ['/theme/src/settings/index.ts', 'export { defaults as settings } from "./values"'],
    ['/theme/src/settings/values.ts', 'const title = "Title"; export const defaults = [{type:"text",id:"title",label:title}] as const'],
    ['/theme/src/barrel.ts', 'export * from "./settings"'],
    ['/theme/src/default.ts', 'const value = { type: "text", id: "title" }; export default value'],
  ])
  return { files, fs: { existsSync: (file) => files.has(file), readFileSync: (file) => files.get(file) } }
}

test('schemas resolve aliases, index files, named and star reexports', () => {
  const { fs } = fixture()
  const extractor = new SchemaExtractor(fs)
  const ast = parse('import { settings } from "@/barrel"; export const schema = { name:"Hero", settings }', { sourceType: 'module' })
  assert.deepEqual(extractor.extract(ast, '/theme/src/Hero.tsx'), {
    name: 'Hero',
    settings: [{ type: 'text', id: 'title', label: 'Title' }],
  })
})

test('Liquid imports share schema resolution and preserve objects with a type key', () => {
  const { fs } = fixture()
  assert.deepEqual(new ImportResolver(fs).resolveExternalVariable('@/default', 'default', '/theme/src/Hero.tsx'), {
    type: 'text',
    id: 'title',
  })
})

test('circular reexports fail clearly instead of exhausting the call stack', () => {
  const { files, fs } = fixture()
  files.set('/theme/a.ts', 'export { x } from "./b"')
  files.set('/theme/b.ts', 'export { x } from "./a"')
  assert.throws(() => new SchemaExtractor(fs).resolveExternalSchema('./a', 'x', '/theme/Hero.tsx'), /Circular import/)
})

test('component schema can be reexported directly from another file', () => {
  const { files, fs } = fixture()
  files.set('/theme/src/schema.ts', 'export default { name:"Hero" }')
  const ast = parse('export {default as schema} from "./schema"', { sourceType: 'module' })
  assert.deepEqual(new SchemaExtractor(fs).extract(ast, '/theme/src/Hero.tsx'), { name: 'Hero' })
})

for (const scenario of [
  { name: 'child paths without baseUrl', parent: {}, child: { paths: { '@/*': ['src/*'] } }, target: '/theme/app/src/data.ts' },
  { name: 'inherited paths without baseUrl', parent: { paths: { '@/*': ['shared/*'] } }, child: {}, target: '/theme/shared/data.ts' },
  {
    name: 'child paths with inherited baseUrl',
    parent: { baseUrl: './base' },
    child: { paths: { '@/*': ['data/*'] } },
    target: '/theme/base/data/data.ts',
  },
  {
    name: 'child baseUrl with inherited paths',
    parent: { paths: { '@/*': ['data/*'] } },
    child: { baseUrl: './local' },
    target: '/theme/app/local/data/data.ts',
  },
  {
    name: 'explicit empty baseUrl',
    parent: { baseUrl: './base' },
    child: { baseUrl: '', paths: { '@/*': ['src/*'] } },
    target: '/theme/app/src/data.ts',
  },
]) {
  test(`aliases preserve configuration origins: ${scenario.name}`, () => {
    const { files, fs } = fixture()
    files.set('/theme/base.json', JSON.stringify({ compilerOptions: scenario.parent }))
    files.set('/theme/app/tsconfig.json', JSON.stringify({ extends: '../base.json', compilerOptions: scenario.child }))
    files.set(scenario.target, 'export const value = "resolved"')
    assert.equal(new ImportResolver(fs).resolveExternalVariable('@/data', 'value', '/theme/app/Card.tsx'), 'resolved')
  })
}
