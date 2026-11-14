import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { compile, previewProject, makeLiquidifyBuilder, SilentLogger } from '../dist/index.js'
import { createTemporaryDirectory } from './helpers/temp-directory.mjs'

function createProject(context) {
  const directory = createTemporaryDirectory('liquidify-public-')
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  fs.mkdirSync(path.join(directory, 'components'))
  fs.writeFileSync(path.join(directory, 'components/Card.tsx'), '"use snippets"; export default function Card() { return <div>Card</div> }')
  return { cwd: directory, componentsDir: 'components', output: 'out' }
}

test('compile returns Liquid without creating output files', async (context) => {
  const project = createProject(context)
  const result = await compile('"use snippets"; export default function Card() { return <h1>Hello</h1> }', {
    cwd: project.cwd,
    filename: 'components/Card.tsx',
  })
  assert.deepEqual(result.diagnostics, [])
  assert.match(result.liquid, /<h1>\s*Hello\s*<\/h1>/)
  assert.equal(result.name, 'Card')
  assert.equal(fs.existsSync(path.join(project.cwd, 'out')), false)
})

test('compile returns structured syntax diagnostics', async () => {
  const result = await compile('export default function Broken( {', { filename: 'Broken.tsx' })
  assert.equal(result.assets.length, 0)
  assert.equal(result.diagnostics[0].severity, 'error')
  assert.match(result.diagnostics[0].filePath, /Broken.tsx$/)
  assert.equal(typeof result.diagnostics[0].location.line, 'number')
  assert.match(result.diagnostics[0].codeFrame, /Broken/)
})

test('preview creates no directories and reports generated outputs', async (context) => {
  const project = createProject(context)
  const result = await previewProject(project)
  assert.equal(result.rebuilt.length, 1)
  assert.ok(result.changes.some((change) => change.filename.endsWith('snippets/card.liquid') && change.operation === 'create'))
  assert.equal(fs.existsSync(path.join(project.cwd, 'out')), false)
})

test('preview reports stale removals without deleting owned files', async (context) => {
  const project = createProject(context)
  const builder = makeLiquidifyBuilder(project, { logger: new SilentLogger() })
  await builder.build()
  await builder.dispose()
  fs.unlinkSync(path.join(project.cwd, 'components/Card.tsx'))
  const generatedFile = path.join(project.cwd, 'out/snippets/card.liquid')
  const original = fs.readFileSync(generatedFile, 'utf8')
  const result = await previewProject(project)
  assert.ok(result.changes.some((change) => change.filename === generatedFile && change.operation === 'delete'))
  assert.equal(fs.readFileSync(generatedFile, 'utf8'), original)
})

test('compiler subpath exports the standalone APIs', async () => {
  const compiler = await import('liquidify/compiler')
  assert.equal(compiler.compile, compile)
  assert.equal(compiler.previewProject, previewProject)
})
