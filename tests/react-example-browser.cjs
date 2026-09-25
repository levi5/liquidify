const { mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync, copyFileSync } = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { spawnSync } = require('node:child_process')
const { pathToFileURL } = require('node:url')
const assert = require('node:assert/strict')
const esbuild = require('esbuild')
const { makeLiquidifyBuilder } = require('../dist/main/factories/make-liquidify-builder')
const { ReactComponentCompiler } = require('../dist/infra/adapters/compilers/react/component-compiler')
const { CssInjector } = require('../dist/infra/adapters/compilers/react/runtime/css-injector')
const { SilentLogger } = require('../dist/shared/logger')

const REQUIRED_FOLDERS = ['assets', 'snippets', 'sections', 'blocks']
const STRICT_BUNDLES = ['product-info', 'product-provider', 'filter-provider', 'mini-cart', 'quantity-selector', 'search-result', 'selector-grid', 'swiper-carousel', 'swiper-slider-arrow', 'swiper-slider-root', 'thumbnails', 'drawer', 'drawer-content', 'portal', 'toast-host', 'theme', 'accordion', 'probe', 'shopify-probe', 'react-runtime']
const ROOT_PROBE_SOURCE =
  "function RootProbe({ children }) { window.React.useEffect(() => { window.rootMounts = (window.rootMounts || 0) + 1; return () => { window.rootCleanups = (window.rootCleanups || 0) + 1 } }, []); return window.React.createElement('article', { className: 'root-probe' }, children) }"
const CHILD_PROBE_SOURCE = "function ChildProbe({ children }) { return window.React.createElement('em', {}, children) }"

async function main() {
  const example = path.resolve(__dirname, '../resources/templates/example')
  const fixtures = path.join(__dirname, 'fixtures')
  const output = mkdtempSync(path.join(os.tmpdir(), 'liquidify-browser-'))

  process.chdir(example)

  for (const strictCsp of [false, true]) {
    const directory = await buildMode(example, fixtures, output, strictCsp)

    if (process.argv.includes('--prepare-only')) {
      console.log(directory)
      continue
    }

    const result = runHeadlessChrome(directory)
    console.log(`${strictCsp ? 'strict' : 'legacy'}: ${result}`)
  }

  console.log(`Artifacts: ${output}`)
}

async function buildMode(example, fixtures, output, strictCsp) {
  const directory = path.join(output, strictCsp ? 'strict' : 'legacy')

  for (const folder of REQUIRED_FOLDERS) mkdirSync(path.join(directory, folder), { recursive: true })

  await compileExampleTheme(example, directory, strictCsp)
  await compileProbeScripts(fixtures, directory, strictCsp)
  writeTestPage(fixtures, directory, strictCsp)

  if (strictCsp) assertStrictBundles(directory)

  return directory
}

async function compileExampleTheme(example, directory, strictCsp) {
  const builder = makeLiquidifyBuilder({
    componentsDir: path.join(example, 'src/app'),
    output: directory,
    react: strictCsp ? {} : { strictCsp: false },
  })
  const errors = []
  builder.on('error', (error) => errors.push(error))

  try {
    await builder.build()
  } finally {
    builder.disposeSync()
  }

  assert.equal(errors.length, 0, errors.map(String).join('\n'))
}

async function compileProbeScripts(fixtures, directory, strictCsp) {
  const compiler = new ReactComponentCompiler(esbuild, new CssInjector(), { strictCsp }, process.cwd(), new SilentLogger())
  const compileFixture = async (name, fileName) => {
    const sourcePath = path.join(fixtures, fileName)
    const probe = await compiler.compile({ name }, readFileSync(sourcePath, 'utf8'), sourcePath)
    return probe.script
  }

  writeFileSync(path.join(directory, 'assets/probe.js'), await compileFixture('ImportProbe', 'react-imports.tsx'))
  writeFileSync(path.join(directory, 'assets/shopify-probe.js'), await compileFixture('ShopifyProbe', 'shopify-section.tsx'))
  writeFileSync(
    path.join(directory, 'assets/root-probe.js'),
    (await compiler.compile({ name: 'RootProbe', reactRootId: 'legacy:root' }, ROOT_PROBE_SOURCE)).script,
  )
  writeFileSync(path.join(directory, 'assets/child-probe.js'), (await compiler.compile({ name: 'ChildProbe' }, CHILD_PROBE_SOURCE)).script)
}

const writeTestPage = (fixtures, directory, strictCsp) => {
  writeFileSync(
    path.join(directory, 'index.html'),
    readFileSync(path.join(fixtures, 'react-example.html'), 'utf8').replace('__EVAL_POLICY__', strictCsp ? '' : "'unsafe-eval'"),
  )
  copyFileSync(path.join(fixtures, 'react-example-setup.js'), path.join(directory, 'setup.js'))
  copyBrowserScenarios(fixtures, directory)
}

const copyBrowserScenarios = (fixtures, directory) => {
  const scenarios = readdirSync(path.join(fixtures, 'browser'))
    .filter((file) => file.endsWith('.js'))
    .sort()

  for (const file of scenarios) copyFileSync(path.join(fixtures, 'browser', file), path.join(directory, file))
}

const assertStrictBundles = (directory) => {
  for (const asset of STRICT_BUNDLES) {
    assert.doesNotMatch(readFileSync(path.join(directory, `assets/${asset}.js`), 'utf8'), /new Function\s*\(|\beval\s*\(/)
  }
}

const runHeadlessChrome = (directory) => {
  const browser = spawnSync(
    process.env.CHROME_BIN || '/opt/google/chrome/chrome',
    [
      '--headless',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      `--user-data-dir=${path.join(directory, 'chrome-profile')}`,
      '--virtual-time-budget=8000',
      '--dump-dom',
      pathToFileURL(path.join(directory, 'index.html')).href,
    ],
    { encoding: 'utf8', timeout: 30000, maxBuffer: 5 * 1024 * 1024 },
  )

  writeFileSync(path.join(directory, 'browser-output.html'), browser.stdout || '')
  assert.equal(browser.status, 0, browser.stderr || String(browser.error))

  const mode = directory.endsWith('strict') ? 'strict' : 'legacy'
  const result = browser.stdout.match(/<pre id="result">([\s\S]*?)<\/pre>/)?.[1]
  assert.ok(result?.startsWith('PASS:'), `${mode}: ${result}\n${browser.stderr}`)

  return result
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
