import { _match, _try } from 'funcio'
import path from 'node:path'
import { promises as fsPromises } from 'node:fs'
import { readReactTemplate } from './runtime/template-loader'
import type { Compiler, BuildResult } from '../../../../core/protocols/compiler'
import type { ComponentMetadataType } from '../../../../types/component'
import type { CssInjector } from './runtime/css-injector'
import type { Logger } from '../../../../shared/logger'
import { escapeHtml } from '../../../../shared/html'
import { ValidationError } from '../../../../core/errors/validation-error'
import {
  COMPONENT_NAME_PATTERN,
  INLINE_HANDLER_PATTERN,
  RAW_LIQUID_GLOBALS_PATTERN,
  RUNTIME_GLOBAL_STUB,
  STYLESHEET_IMPORT_PATTERN,
} from './constants'
import { parse } from '@babel/parser'
import traverse, { type NodePath } from '@babel/traverse'
import generate from '@babel/generator'
import { isIdentifier, isMemberExpression, isStringLiteral, isVariableDeclarator, stringLiteral } from '@babel/types'
import type { CallExpression, Expression } from '@babel/types'
import type { Plugin, PluginBuild } from 'esbuild'

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
    private readonly options: { strictCsp?: boolean },
    private readonly projectRoot: string,
    private readonly logger: Logger,
  ) {}

  private processContextBridge(source: string, filePath: string): string {
    return _match(source.includes("'use context'") || source.includes('"use context"'))
      .with(true, () => this.bridgeContexts(source, filePath))
      .with(false, () => source)
      .exec() as string
  }

  private bridgeContexts(source: string, filePath: string): string {
    const box = _try.sync(() => {
      const ast = parse(source, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      })
      const relativePath = path.relative(this.projectRoot, filePath) || path.basename(filePath)
      traverse(ast as any, {
        CallExpression: (pathNode: NodePath<CallExpression>) => this.bridgeCall(pathNode, relativePath),
      })
      return generate(ast as any).code
    })
    return box.match({
      right: (code) => code,
      left: (error) => this.keepOriginal(source, filePath, error),
    })
  }

  private keepOriginal(source: string, filePath: string, error: unknown): string {
    this.logger.error(
      '[Liquidify] Context bridge transform failed. Fix the TSX syntax in this file before sharing contexts:',
      `${filePath} ${error instanceof Error ? error.message : String(error)}`,
    )
    return source
  }

  private bridgeCall(pathNode: NodePath<CallExpression>, relativePath: string): void {
    const callee = pathNode.node.callee
    const isCreateContext =
      (isIdentifier(callee) && callee.name === 'createContext') ||
      (isMemberExpression(callee) && isIdentifier(callee.property) && callee.property.name === 'createContext')
    _match(isCreateContext)
      .with(true, () => this.ensureBridgeId(pathNode, relativePath))
      .with(false, () => undefined)
      .exec()
  }

  private ensureBridgeId(pathNode: NodePath<CallExpression>, relativePath: string): void {
    _match(this.hasBridgeId(pathNode.node.arguments))
      .with(true, () => undefined)
      .with(false, () => this.appendBridgeId(pathNode, relativePath))
      .exec()
  }

  private hasBridgeId(args: CallExpression['arguments']): boolean {
    const second = args[1] as Expression | undefined
    if (second === undefined || !isStringLiteral(second)) return false
    const value = (second as { value: string }).value
    return value.startsWith('__LIQUIDIFY_CONTEXT_ID__:') || value.startsWith('__LIQUIDX_CONTEXT_ID__:')
  }

  private appendBridgeId(pathNode: NodePath<CallExpression>, relativePath: string): void {
    pathNode.node.arguments.push(stringLiteral(`__LIQUIDIFY_CONTEXT_ID__:${relativePath}:${this.contextName(pathNode.parent)}`))
  }

  private contextName(parent: NodePath<CallExpression>['parent']): string {
    return _match(isVariableDeclarator(parent) && isIdentifier(parent.id))
      .with(true, () => (parent as { id: { name: string } }).id.name)
      .with(false, () => 'anonymous_context')
      .exec() as string
  }

  public async compile(metadata: ComponentMetadataType, source: string, filePath?: string): Promise<ReactBuildResult> {
    const componentName = _match(!metadata.name)
      .with(true, () => 'Component')
      .with(false, () => metadata.name as string)
      .exec() as string
    _match(COMPONENT_NAME_PATTERN.test(componentName))
      .with(true, () => undefined)
      .with(false, () => {
        throw new Error(`Invalid React component name: ${componentName}`)
      })
      .exec()
    _match(RAW_LIQUID_GLOBALS_PATTERN.test(source))
      .with(true, () => {
        throw new ValidationError(
          `Raw Liquid tags ({{ routes.* }}, {{ shop.* }}, ...) do not render inside React components — use runtime helpers (rootUrl(), translate()) instead.`,
          filePath,
        )
      })
      .with(false, () => undefined)
      .exec()
    this.assertNoInlineHandlers(source, filePath)
    const rootId = _match(!metadata.reactRootId)
      .with(true, () => '')
      .with(false, () => metadata.reactRootId as string)
      .exec() as string
    const injector = this.cssInjector.build()
    const bridged = _match(filePath === undefined)
      .with(true, () => source)
      .with(false, () => this.processContextBridge(source, filePath as string))
      .exec() as string
    const dir = _match(filePath === undefined)
      .with(true, () => this.projectRoot)
      .with(false, () => path.dirname(filePath as string))
      .exec() as string
    const entry = this.getClientRuntimeScript(componentName, this.keepStylesheetsImported(bridged, dir), injector, rootId)
    const result = await this.compiler.build({
      stdin: { contents: entry, resolveDir: dir, loader: 'tsx' },
      bundle: true,
      write: false,
      outdir: 'out',
      format: 'iife',
      platform: 'browser',
      loader: { '.css': 'css' },
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
    return this.assemble(result, rootId, componentName)
  }

  private assertNoInlineHandlers(source: string, filePath?: string): void {
    if (this.options.strictCsp === false) return
    const match = INLINE_HANDLER_PATTERN.exec(source)
    if (!match) return
    throw new ValidationError(
      `Inline event handler "${match[0].trim()}" is not allowed with react.strictCsp enabled (the default) — the runtime refuses to build functions from attribute text, so the handler would be dropped in production. Pass a function (onClick={() => ...}) or use registerLiquidifyAction("name", handler) with data-liquidify-on-<event>. Set react.strictCsp to false in liquidify.config to opt into the legacy new Function behaviour.`,
      filePath,
    )
  }

  private assemble(result: BuildResult, rootId: string, componentName: string): ReactBuildResult {
    const built = this.processBuildResult(result)
    const finalScript = this.appendCssInjection(built.script, built.css, rootId, componentName)
    const template = _match(rootId === '')
      .with(true, () => 'island.html')
      .with(false, () => 'root.html')
      .exec() as 'island.html' | 'root.html'
    const label = _match(rootId === '')
      .with(true, () => componentName)
      .with(false, () => rootId)
      .exec() as string
    const html = readReactTemplate(template)
      .trim()
      .replace('__VALUE__', () => escapeHtml(label))
    return { html, assetName: `${componentName}.js`, script: finalScript, css: '' }
  }

  private getContextBridgeScript(): string {
    return [readReactTemplate('context-bridge.js').trimEnd(), ';'].join('')
  }

  private keepStylesheetsImported(source: string, dir: string): string {
    const specifiers = new Set<string>()
    for (const match of source.matchAll(STYLESHEET_IMPORT_PATTERN)) {
      const specifier = match[1]
      const relative = specifier.startsWith('.') || path.isAbsolute(specifier)
      if (relative) specifiers.add(path.resolve(dir, specifier))
    }
    if (specifiers.size === 0) return source
    return `${[...specifiers].map((resolved) => `import ${JSON.stringify(resolved)};`).join('\n')}\n${source}`
  }

  private getClientRuntimeScript(componentName: string, source: string, injector: string, rootId: string): string {
    return readReactTemplate('component.tsx').replace(
      /__LIQUIDIFY_(INJECTOR|SOURCE|COMPONENT|INLINE_HANDLER|ROOT_ID)__/g,
      (token) =>
        _match(token)
          .with('__LIQUIDIFY_INLINE_HANDLER__', () =>
            readReactTemplate(this.options.strictCsp !== false ? 'inline-handler-strict.js' : 'inline-handler-legacy.js'),
          )
          .with('__LIQUIDIFY_ROOT_ID__', () => JSON.stringify(rootId))
          .with('__LIQUIDIFY_INJECTOR__', () => injector)
          .with('__LIQUIDIFY_SOURCE__', () => source)
          .with(token, () => componentName)
          .exec() as string,
    )
  }

  private getEsbuildPlugins(): Plugin[] {
    return [
      {
        name: 'global-externals',
        setup: (build: PluginBuild) => this.setupExternals(build),
      },
      {
        name: 'liquidify-context-bridge',
        setup: (build: PluginBuild) => this.setupBridge(build),
      },
    ]
  }

  private setupExternals(build: PluginBuild): void {
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
        content: RUNTIME_GLOBAL_STUB,
      },
    ]
    externals.forEach((ext) => {
      build.onResolve({ filter: ext.filter }, (args) => ({ path: args.path, namespace: ext.namespace }))
      build.onLoad({ filter: /.*/, namespace: ext.namespace }, () => ({ contents: ext.content, loader: 'js' }))
    })
    build.onResolve({ filter: /^liquidex$/ }, (args) => ({ path: args.path, namespace: 'liquidex-stub' }))
    build.onLoad({ filter: /.*/, namespace: 'liquidex-stub' }, () => ({
      contents:
        'module.exports = { RenderSnippet: function(props) { var Slot = props.slot; if (!Slot) return null; var rest = Object.assign({}, props); delete rest.slot; return window.React.createElement(Slot, rest); }, RenderSvg: function() { return null; }, DynamicBlock: function() { return null; }, Fallback: function() { return null; } };',
      loader: 'js',
    }))
    build.onResolve({ filter: /^(liquidify|liquidx)(\/.*)?$/ }, (args) =>
      _match(args.path === 'liquidify/runtime' || args.path === 'liquidx/runtime')
        .with(true, () => ({ path: args.path, namespace: 'liquidify-runtime-global' }))
        .with(false, () => ({ external: true }))
        .exec(),
    )
  }

  private setupBridge(build: PluginBuild): void {
    build.onLoad({ filter: /\.[jt]sx?$/ }, async (args) => {
      const contents = this.processContextBridge(await fsPromises.readFile(args.path, 'utf8'), args.path)
      return { contents, loader: args.path.endsWith('x') ? 'tsx' : 'ts' }
    })
  }

  private processBuildResult(result: BuildResult) {
    const built = { script: '', css: '' }
    ;(result.outputFiles ?? []).forEach((file) => {
      this.accumulateOutput(built, file)
    })
    return built
  }

  private accumulateOutput(built: { script: string; css: string }, file: { path: string; text: string }): void {
    _match(true)
      .with(file.path.endsWith('.css'), () => {
        built.css = file.text
      })
      .with(file.path.endsWith('.js'), () => {
        built.script = file.text
      })
      .with(true, () => undefined)
      .exec()
  }

  private appendCssInjection(script: string, css: string, rootId: string, componentName: string): string {
    return _match(!css || !css.trim())
      .with(true, () => script)
      .with(false, () => [script, this.cssInjector.buildCall(css, `css-${rootId || componentName}`)].join('\n'))
      .exec() as string
  }
}
