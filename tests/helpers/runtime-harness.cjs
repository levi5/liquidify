const esbuild = require('esbuild')
const { ReactRuntimeBuilder } = require('../../dist/infra/adapters/compilers/react/runtime/runtime-builder')
const { ReactComponentCompiler } = require('../../dist/infra/adapters/compilers/react/component-compiler')
const { CssInjector } = require('../../dist/infra/adapters/compilers/react/runtime/css-injector')
const { SilentLogger } = require('../../dist/shared/logger')

const buildRuntimeScript = (compiler = esbuild) => new ReactRuntimeBuilder(compiler).build()

const createComponentCompiler = (options = {}) => new ReactComponentCompiler(esbuild, new CssInjector(), options, process.cwd(), new SilentLogger())

const mockPreactCompiler = () => ({
  build: (options) =>
    esbuild.build({
      ...options,
      plugins: [
        {
          name: 'mock-preact',
          setup(build) {
            build.onResolve({ filter: /^preact\/compat$/ }, () => ({ path: 'preact', namespace: 'mock' }))
            build.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({
              contents:
                'export default {}; export function render(element, container) { window.record(element, container) }; export const hydrate = render; export function unmountComponentAtNode(container) { render(null, container) }',
            }))
          },
        },
      ],
    }),
})

module.exports = { esbuild, buildRuntimeScript, createComponentCompiler, mockPreactCompiler }
