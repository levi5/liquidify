import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ImportGraphBuilder } from '../dist/application/services/dependency-tracker.js'
import { ASTParser } from '../dist/infra/adapters/parsers/babel/ASTParser.js'

test('unchanged syntax is cached while import resolution is refreshed', () => {
  const source = 'import value from "./dependency"; export default value'
  const sources = new Map([
    ['/entry.ts', source],
    ['/first.ts', 'export default 1'],
    ['/second.ts', 'export default 2'],
  ])
  const parser = new ASTParser()
  const parse = parser.parse.bind(parser)
  let parseCount = 0
  parser.parse = (...parameters) => {
    parseCount++
    return parse(...parameters)
  }
  let dependency = '/first.ts'
  const graphBuilder = new ImportGraphBuilder(
    { existsSync: (filename) => sources.has(filename), readFileSync: (filename) => sources.get(filename) },
    { configFiles: () => [], resolve: () => dependency, candidates: () => [] },
    parser,
  )
  graphBuilder.build(['/entry.ts'], new Set())
  assert.equal(parseCount, 2)
  graphBuilder.build(['/entry.ts'], new Set())
  assert.equal(parseCount, 2)
  dependency = '/second.ts'
  const graph = graphBuilder.build(['/entry.ts'], new Set())
  assert.equal(parseCount, 3)
  assert.deepEqual([...graph.edges.get('/entry.ts')], ['/second.ts'])
  sources.set('/entry.ts', `${source}; console.log(value)`)
  graphBuilder.build(['/entry.ts'], new Set())
  assert.equal(parseCount, 4)
})
