const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { createComponentCompiler } = require('../helpers/runtime-harness.cjs')

test('component templates bundle and preserve source tokens', async () => {
  const compiler = createComponentCompiler()
  const result = await compiler.compile({ name: 'Counter' }, 'function Counter() { return "__LIQUIDIFY_COMPONENT__" }')

  assert.equal(result.html, '<react-island component="Counter"></react-island>')
  assert.ok(result.script.includes('__LIQUIDIFY_COMPONENT__'))
  new vm.Script(result.script)
})

test('component hydration registers before dispatching readiness', async () => {
  const compiler = createComponentCompiler()
  const result = await compiler.compile({ name: 'Counter' }, 'function Counter() { return "__LIQUIDIFY_COMPONENT__" }')

  assert.ok(result.script.indexOf('window.LiquidifyHydrate.Counter =') < result.script.indexOf('document.dispatchEvent'))
})

test('component root ids are escaped as attribute values', async () => {
  const compiler = createComponentCompiler()
  const root = await compiler.compile({ name: 'Counter', reactRootId: 'a"<&' }, 'function Counter() { return null }')

  assert.equal(root.html, '<div id="a&quot;&lt;&amp;"></div>')
})

test('invalid component names are rejected', async () => {
  const compiler = createComponentCompiler()

  await assert.rejects(() => compiler.compile({ name: "bad'name" }, ''), /Invalid React component name/)
})

test('strict mode omits dynamic evaluation while legacy builds preserve it', async () => {
  const source = 'function Counter() { return null }'
  const legacy = await createComponentCompiler({ strictCsp: false }).compile({ name: 'Counter' }, source)
  const strict = await createComponentCompiler().compile({ name: 'Counter' }, source)

  assert.match(legacy.script, /new Function\(/)
  assert.doesNotMatch(strict.script, /new Function\(|\beval\(/)
  assert.match(strict.script, /registerLiquidifyAction/)
})

const withStylesheet = async (source) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'liquidify-css-'))
  fs.writeFileSync(path.join(dir, 'styles.css'), '.badge { color: red }')
  return createComponentCompiler().compile({ name: 'Badge' }, source, path.join(dir, 'Badge.tsx'))
}

test('a default stylesheet import is injected even when its binding goes unused', async () => {
  const result = await withStylesheet("import styles from './styles.css'\nfunction Badge() { return null }")

  assert.match(result.script, /\.badge/)
  assert.match(result.script, /__react_css_inject__/)
})

test('a stylesheet imported both ways is injected once', async () => {
  const result = await withStylesheet(
    "import './styles.css'\nimport styles from './styles.css'\nfunction Badge() { return null }",
  )

  assert.equal(result.script.match(/__react_css_inject__\(/g).length, 1)
  assert.equal(result.script.match(/\.badge\{color:red\}/g).length, 1)
})
