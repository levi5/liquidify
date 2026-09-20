import { readReactTemplate } from './runtime/template-loader'
import type { Compiler } from '../../../../core/protocols/compiler'
import type { ComponentMetadataType } from '../../../../types/component'
import type { CssInjector } from './runtime/css-injector'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import { isIdentifier, isMemberExpression, isStringLiteral, isVariableDeclarator, stringLiteral } from '@babel/types'
import { _try } from 'funcio/lib/Monads/Either'

export interface ReactBuildResult {
  html: string
  assetName: string
  script: string
  css?: string
}

export class ReactComponentCompiler {
  constructor(
    private readonly compiler: Compiler,
    private readonly cssInjector: CssInjector,
    private readonly options: { strictCsp?: boolean } = {},
  ) {}

  private processContextBridge(source: string, filePath: string): string {
    if (!source.includes("'use context'") && !source.includes('"use context"')) {
      return source
    }

    const box = _try.sync(() => {
      const ast = parse(source, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      })

      const relativePath = filePath.replace(process.cwd(), '')

      traverse(ast as any, {
        CallExpression(path) {
          const callee = path.node.callee
          const isCreateContext =
            (isIdentifier(callee) && callee.name === 'createContext') ||
            (isMemberExpression(callee) && isIdentifier(callee.property) && callee.property.name === 'createContext')

          if (isCreateContext) {
            const hasId =
              path.node.arguments.length > 1 &&
              isStringLiteral(path.node.arguments[1]) &&
              (path.node.arguments[1].value.includes('__LIQUIDIFY_CONTEXT_ID__') ||
                path.node.arguments[1].value.includes('__LIQUIDX_CONTEXT_ID__'))

            if (!hasId) {
              let varName = 'anonymous_context'
              if (isVariableDeclarator(path.parent)) {
                if (isIdentifier(path.parent.id)) {
                  varName = path.parent.id.name
                }
              }
              const bridgeId = `__LIQUIDIFY_CONTEXT_ID__:${relativePath}:${varName}`
              path.node.arguments.push(stringLiteral(bridgeId))
            }
          }
        },
      })
      return generate(ast as any).code
    })

    if (box.isLeft()) {
      console.error(
        '[Liquidify] Context bridge transform failed. Fix the TSX syntax in this file before sharing contexts:',
        filePath,
        box.value,
      )
      return source
    }

    return box.value as string
  }

  public async compile(metadata: ComponentMetadataType, source: string, filePath?: string): Promise<ReactBuildResult> {
    const componentName = metadata.name || 'Component'
    if (!/^[A-Za-z_$][\w$]*$/.test(componentName)) throw new Error(`Invalid React component name: ${componentName}`)
    const assetName = `${componentName}.js`
    const rootId = metadata.reactRootId || ''
    const injector = this.cssInjector.build()

    if (filePath) source = this.processContextBridge(source, filePath)

    const entry = this.getClientRuntimeScript(componentName, source, injector, rootId)
    const dir = filePath ? require('node:path').dirname(filePath) : process.cwd()

    const result = await this.compiler.build({
      stdin: { contents: entry, resolveDir: dir, loader: 'tsx' },
      bundle: true,
      write: false,
      outdir: 'out',
      format: 'iife',
      platform: 'browser',
      loader: { '.css': 'local-css' },
      jsxFactory: 'window.React.createElement',
      jsxFragment: 'window.React.Fragment',
      target: ['es2020'],
      charset: 'utf8',
      legalComments: 'none',
      minifySyntax: true,
      minifyWhitespace: true,
      minifyIdentifiers: false,
      banner: { js: this.getContextBridgeScript() },
      plugins: this.getEsbuildPlugins(),
    })

    const { script, css } = this.processBuildResult(result)
    const finalScript = this.appendCssInjection(script, css, rootId, componentName)
    const html = readReactTemplate(rootId ? 'root.html' : 'island.html')
      .trim()
      .replace('__VALUE__', () =>
        (rootId || componentName).replace(
          /[&<>"']/g,
          (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]!,
        ),
      )

    return { html, assetName, script: finalScript, css: '' }
  }

  private getContextBridgeScript(): string {
    return [readReactTemplate('context-bridge.js').trimEnd(), ';'].join('')
  }

  private getClientRuntimeScript(componentName: string, source: string, injector: string, rootId: string): string {
    return readReactTemplate('component.tsx').replace(/__LIQUIDIFY_(INJECTOR|SOURCE|COMPONENT|INLINE_HANDLER|ROOT_ID)__/g, (token) =>
      token === '__LIQUIDIFY_INLINE_HANDLER__'
        ? readReactTemplate(this.options.strictCsp !== false ? 'inline-handler-strict.js' : 'inline-handler-legacy.js')
        : token === '__LIQUIDIFY_ROOT_ID__'
          ? JSON.stringify(rootId)
          : token === '__LIQUIDIFY_INJECTOR__'
            ? injector
            : token === '__LIQUIDIFY_SOURCE__'
              ? source
              : componentName,
    )
  }

  private getEsbuildPlugins(): any[] {
    return [
      {
        name: 'global-externals',
        setup(build: any) {
          const externals = [
            { filter: /^preact$/, namespace: 'preact-global', content: 'module.exports = window.React' },
            { filter: /^preact\/hooks$/, namespace: 'preact-hooks-global', content: 'module.exports = window.React' },
            { filter: /^preact\/compat$/, namespace: 'preact-compat-global', content: 'module.exports = window.React' },
            { filter: /^react$/, namespace: 'react-global', content: 'module.exports = window.React' },
            {
              filter: /^(react-dom|preact\/compat)\/client$/,
              namespace: 'react-client-global',
              content: 'module.exports = window.ReactDOMClient',
            },
            {
              filter: /^(react|preact)\/jsx-runtime$/,
              namespace: 'jsx-runtime-global',
              content: 'module.exports = window.LiquidifyJSXRuntime',
            },
            {
              filter: /^(react|preact)\/jsx-dev-runtime$/,
              namespace: 'jsx-dev-runtime-global',
              content: 'module.exports = window.LiquidifyJSXDevRuntime',
            },
            { filter: /^react-dom$/, namespace: 'react-dom-global', content: 'module.exports = window.ReactDOM' },
            {
              filter: /^(liquidify|liquidx)\/runtime$/,
              namespace: 'liquidify-runtime-global',
              content:
                'module.exports = { registerLiquidifyAction: window.registerLiquidifyAction, registerLiquidIsland: window.registerLiquidIsland, LiquidifyEvents: window.LiquidifyEvents || window.LiquidxEvents, useLiquidifyEvent: window.LiquidifyUseEvent || window.LiquidxUseEvent, emitLiquidifyEvent: window.LiquidifyEmitEvent || window.LiquidxEmitEvent, LiquidxEvents: window.LiquidifyEvents || window.LiquidxEvents, useLiquidxEvent: window.LiquidifyUseEvent || window.LiquidxUseEvent, emitLiquidxEvent: window.LiquidifyEmitEvent || window.LiquidxEmitEvent }',
            },
          ]

          externals.forEach((ext) => {
            build.onResolve({ filter: ext.filter }, (args: any) => ({ path: args.path, namespace: ext.namespace }))
            build.onLoad({ filter: /.*/, namespace: ext.namespace }, () => ({ contents: ext.content, loader: 'js' }))
          })

          build.onResolve({ filter: /^liquidex$/ }, (args: any) => ({ path: args.path, namespace: 'liquidex-stub' }))
          build.onLoad({ filter: /.*/, namespace: 'liquidex-stub' }, () => ({
            contents:
              'module.exports = { RenderSnippet: function(props) { var Slot = props.slot; if (!Slot) return null; var rest = Object.assign({}, props); delete rest.slot; return window.React.createElement(Slot, rest); }, RenderSvg: function() { return null; }, DynamicBlock: function() { return null; } };',
            loader: 'js',
          }))

          build.onResolve({ filter: /^(liquidify|liquidx)(\/.*)?$/ }, (args: any) => {
            if (args.path === 'liquidify/runtime' || args.path === 'liquidx/runtime')
              return { path: args.path, namespace: 'liquidify-runtime-global' }
            return { external: true }
          })
        },
      },
      {
        name: 'liquidify-context-bridge',
        setup: (build: any) => {
          const fs = require('node:fs')
          build.onLoad({ filter: /\.[jt]sx?$/ }, async (args: any) => {
            let contents = await fs.promises.readFile(args.path, 'utf8')
            contents = this.processContextBridge(contents, args.path)
            return { contents, loader: args.path.endsWith('x') ? 'tsx' : 'ts' }
          })
        },
      },
    ]
  }

  private processBuildResult(result: any) {
    let script = ''
    let css = ''

    for (const file of result.outputFiles || []) {
      if (file.path.endsWith('.css')) css = file.text
      else if (file.path.endsWith('.js')) script = file.text
    }

    return { script, css }
  }

  private appendCssInjection(script: string, css: string, rootId: string, componentName: string): string {
    if (!css || !css.trim()) return script

    const cssId = rootId ? `css-${rootId}` : `css-${componentName}`
    return [script, this.cssInjector.buildCall(css, cssId)].join('\n')
  }
}
