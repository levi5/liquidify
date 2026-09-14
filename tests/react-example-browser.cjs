const { mkdirSync, mkdtempSync, readFileSync, writeFileSync, copyFileSync } = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { spawnSync } = require('node:child_process')
const { pathToFileURL } = require('node:url')
const assert = require('node:assert/strict')
const esbuild = require('esbuild')
const { makeLiquidifyBuilder } = require('../dist/main/factories/make-liquidify-builder')
const { ReactComponentCompiler } = require('../dist/infra/adapters/compilers/react/component-compiler')
const { CssInjector } = require('../dist/infra/adapters/compilers/react/runtime/css-injector')

async function main() {
  const example = path.resolve(__dirname, '../example')
  const fixtures = path.join(__dirname, 'fixtures')
  const output = mkdtempSync(path.join(os.tmpdir(), 'liquidify-browser-'))
  process.chdir(example)
  for (const strictCsp of [false, true]) {
    const directory = path.join(output, strictCsp ? 'strict' : 'legacy')
    for (const folder of ['assets', 'snippets', 'sections', 'blocks']) mkdirSync(path.join(directory, folder), { recursive: true })
    const builder = makeLiquidifyBuilder({ componentsDir: path.join(example, 'src/components'), output: directory, react: strictCsp ? {} : { strictCsp: false } })
    const errors = []
    builder.on('error', (error) => errors.push(error))
    try { await builder.build() } finally { builder.disposeSync() }
    assert.equal(errors.length, 0, errors.map(String).join('\n'))
    const compiler = new ReactComponentCompiler(esbuild, new CssInjector(), { strictCsp })
    const sourcePath = path.join(fixtures, 'react-imports.tsx')
    const probe = await compiler.compile({ name: 'ImportProbe' }, readFileSync(sourcePath, 'utf8'), sourcePath)
    writeFileSync(path.join(directory, 'assets/probe.js'), probe.script)
    const sectionPath = path.join(fixtures, 'shopify-section.tsx')
    const sectionProbe = await compiler.compile({ name: 'ShopifyProbe' }, readFileSync(sectionPath, 'utf8'), sectionPath)
    writeFileSync(path.join(directory, 'assets/shopify-probe.js'), sectionProbe.script)
    const rootSource = "function RootProbe({ children }) { window.React.useEffect(() => { window.rootMounts = (window.rootMounts || 0) + 1; return () => { window.rootCleanups = (window.rootCleanups || 0) + 1 } }, []); return window.React.createElement('article', { className: 'root-probe' }, children) }"
    const rootProbe = await compiler.compile({ name: 'RootProbe', reactRootId: 'legacy:root' }, rootSource)
    writeFileSync(path.join(directory, 'assets/root-probe.js'), rootProbe.script)
    const childSource = "function ChildProbe({ children }) { return window.React.createElement('em', {}, children) }"
    const childProbe = await compiler.compile({ name: 'ChildProbe' }, childSource)
    writeFileSync(path.join(directory, 'assets/child-probe.js'), childProbe.script)

    writeFileSync(path.join(directory, 'index.html'), readFileSync(path.join(fixtures, 'react-example.html'), 'utf8').replace('__EVAL_POLICY__', strictCsp ? '' : "'unsafe-eval'"))
    copyFileSync(path.join(fixtures, 'react-example-setup.js'), path.join(directory, 'setup.js'))
    copyFileSync(path.join(fixtures, 'react-example-assertions.js'), path.join(directory, 'assertions.js'))
    if (strictCsp) {
      for (const asset of ['product-purchase', 'filter-drawer', 'cart-page', 'recommendation-loader', 'storefront', 'probe', 'shopify-probe', 'react-runtime']) {
        assert.doesNotMatch(readFileSync(path.join(directory, `assets/${asset}.js`), 'utf8'), /new Function\s*\(|\beval\s*\(/)
      }
    }
    if (process.argv.includes('--prepare-only')) { console.log(directory); continue }
    const browser = spawnSync(process.env.CHROME_BIN || '/opt/google/chrome/chrome', [
      '--headless', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
      `--user-data-dir=${path.join(directory, 'chrome-profile')}`, '--virtual-time-budget=8000',
      '--dump-dom', pathToFileURL(path.join(directory, 'index.html')).href,
    ], { encoding: 'utf8', timeout: 30000, maxBuffer: 5 * 1024 * 1024 })
    writeFileSync(path.join(directory, 'browser-output.html'), browser.stdout || '')
    assert.equal(browser.status, 0, browser.stderr || String(browser.error))
    const result = browser.stdout.match(/<pre id="result">([\s\S]*?)<\/pre>/)?.[1]
    assert.ok(result?.startsWith('PASS:'), `${strictCsp ? 'strict' : 'legacy'}: ${result}\n${browser.stderr}`)
    console.log(`${strictCsp ? 'strict' : 'legacy'}: ${result}`)
  }
  console.log(`Artifacts: ${output}`)
}
main().catch((error) => { console.error(error); process.exitCode = 1 })
