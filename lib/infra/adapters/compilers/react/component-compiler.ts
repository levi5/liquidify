import { Compiler } from '../../../../core/protocols/compiler'
import { ComponentMetadataType } from '../../../../types/component'
import { CssInjector } from './runtime/css-injector'
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
  ) { }

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
              path.node.arguments[1].value.includes('__LIQUIDX_CONTEXT_ID__')

            if (!hasId) {
              let varName = 'anonymous_context'
              if (isVariableDeclarator(path.parent)) {
                if (isIdentifier(path.parent.id)) {
                  varName = path.parent.id.name
                }
              }
              const bridgeId = `__LIQUIDX_CONTEXT_ID__:${relativePath}:${varName}`
              path.node.arguments.push(stringLiteral(bridgeId))
              console.log(`[Liquidx] Bridged Context: ${varName} in ${relativePath}`)
            }
          }
        },
      })
      return generate(ast as any).code
    })


    if (box.isLeft()) {
      console.error('Failed to parse source for context bridge:', filePath, box.value)
      return source
    }

    return box.value as string
  }

  public async compile(metadata: ComponentMetadataType, source: string, filePath?: string): Promise<ReactBuildResult> {
    const componentName = metadata.name || 'Component'
    const assetName = `${componentName}.js`
    const rootId = metadata.reactRootId || ''
    const injector = this.cssInjector.build()

    if (filePath) source = this.processContextBridge(source, filePath)

    const entry = this.getClientRuntimeScript(componentName, source, injector)
    const dir = filePath ? require('path').dirname(filePath) : process.cwd()

    const result = await this.compiler.build({
      stdin: { contents: entry, resolveDir: dir, loader: 'tsx' },
      bundle: true,
      write: false,
      outdir: 'out',
      format: 'iife',
      platform: 'browser',
      loader: { '.css': 'local-css' },
      target: ['es2020'],
      charset: 'utf8',
      legalComments: 'none',
      minifySyntax: true,
      minifyWhitespace: true,
      minifyIdentifiers: false,
      plugins: this.getEsbuildPlugins(filePath),
    })

    const { script, css } = this.processBuildResult(result)
    const finalScript = this.appendCssInjection(script, css, rootId, componentName)
    const html = rootId ? `<div id="${rootId}"></div>` : `<react-island component="${componentName}"></react-island>`

    return { html, assetName, script: finalScript, css: '' }
  }

  private getClientRuntimeScript(componentName: string, source: string, injector: string): string {
    return `
          const React = window.React;
          const { createRoot } = ReactDOM || window.ReactDOM || {};
          window.LiquidxComponents = window.LiquidxComponents || {};
          window.__LIQUIDX_CONTEXTS__ = window.__LIQUIDX_CONTEXTS__ || {};

          if (React && !React.__createContext_patched__) {
            const originalCreate = React.createContext;
            React.createContext = function(defaultValue, id) {
              if (id && typeof id === 'string') {
                if (!window.__LIQUIDX_CONTEXTS__[id]) window.__LIQUIDX_CONTEXTS__[id] = originalCreate(defaultValue);
                return window.__LIQUIDX_CONTEXTS__[id];
              }
              return originalCreate(defaultValue);
            };
            React.__createContext_patched__ = true;
          }
          ${injector}
          ${source}
          try { window.LiquidxComponents['${componentName}'] = typeof ${componentName} !== 'undefined' ? ${componentName} : null; } catch(e) {}
          document.dispatchEvent(new CustomEvent('liquidx:ready:${componentName}'));

          const parseProps = (node) => {
            const props = {};
            Array.from(node.attributes || []).forEach(attr => {
               const val = attr.value;
               let finalVal = val;
               if (val === 'true') finalVal = true;
               else if (val === 'false') finalVal = false;
               else if (!isNaN(val) && val.trim() !== '') finalVal = Number(val);
               const key = attr.name === 'class' ? 'className' : attr.name;
               props[key] = finalVal;
            });
            const propsScript = Array.from(node.children).find(c => (c as any).tagName === 'SCRIPT' && (c as any).hasAttribute('data-react-props'));
            if (propsScript) {
              try { Object.assign(props, JSON.parse(propsScript.textContent || '{}')); } catch (e) {}
            }
            return props;
          };

          const getComponent = (tagName, islandComp) => {
             let C = islandComp ? window.LiquidxComponents[islandComp] : null;
             if (!C) {
                const k = Object.keys(window.LiquidxComponents).find(k => k.toLowerCase() === tagName.toLowerCase());
                if (k) C = window.LiquidxComponents[k];
             }
             return (C && C.default) ? C.default : C;
          };

          function LazyIsland({ componentName, node, ...props }) {
            const [Comp, setComp] = React.useState(() => getComponent(node.tagName, componentName));
            React.useEffect(() => {
              if (Comp) return;
              const onReady = () => {
                const found = getComponent(node.tagName, componentName);
                if (found) setComp(() => found);
              };
              document.addEventListener('liquidx:ready:' + componentName, onReady);
              return () => document.removeEventListener('liquidx:ready:' + componentName, onReady);
            }, [Comp, componentName]);

            if (!Comp) {
              return React.createElement(node.tagName.toLowerCase(), { dangerouslySetInnerHTML: { __html: node.innerHTML }, ...parseProps(node) });
            }

            node.setAttribute('data-react-hydrated', 'true');
            const childNodes = Array.from(node.children || []).filter(c => c.tagName !== 'SCRIPT');
            const children = childNodes.length > 0 ? childNodes.map((c, i) => createReactElementFromNode(c, i)) : (props.children || node.innerHTML);
            return React.createElement(Comp, { ...props, children });
          }

          function createReactElementFromNode(node, index) {
            if (!node || node.nodeType !== 1) return null;
            const nodeName = node.tagName;
            const islandComp = node.getAttribute('component');
            const Comp = getComponent(nodeName, islandComp);

            if (islandComp || Comp) {
              return React.createElement(LazyIsland, { ...parseProps(node), key: index, componentName: islandComp || nodeName, node: node });
            }
            
            const props = parseProps(node);
            const childNodes = Array.from(node.children || []);
            return React.createElement(nodeName.toLowerCase(), {
              key: index,
              ...props,
              dangerouslySetInnerHTML: childNodes.length === 0 ? { __html: node.innerHTML } : undefined
            }, childNodes.length > 0 ? childNodes.map((c, i) => createReactElementFromNode(c, i)) : undefined);
          }

          if (!window.LiquidxHydrate) window.LiquidxHydrate = {};
          window.LiquidxHydrate['${componentName}'] = (container) => {
            if (container.hasAttribute('data-react-hydrated')) return;
            if (container.parentElement && container.parentElement.closest('react-island')) return;

            const hydrate = () => {
              if (container.hasAttribute('data-react-hydrated')) return;
              container.setAttribute('data-react-hydrated', 'true');
              const props = parseProps(container);
              const childrenElements = Array.from(container.children || []).filter(child => child.tagName !== 'SCRIPT');
              props.children = childrenElements.length > 0 ? childrenElements.map((child, index) => createReactElementFromNode(child, index)) : container.innerHTML;
              createRoot(container).render(React.createElement(${componentName}, props));
            };
            if (container.getAttribute('data-hydrate') === 'eager') hydrate();
            else if ('IntersectionObserver' in window) {
              const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) { hydrate(); observer.unobserve(container); }
              }, { rootMargin: '200px' });
              observer.observe(container);
            } else hydrate();
          };

          if (!customElements.get('react-island')) {
            class ReactIsland extends HTMLElement {
              connectedCallback() {
                const name = this.getAttribute('component');
                if (window.LiquidxHydrate && window.LiquidxHydrate[name]) {
                  window.LiquidxHydrate[name](this);
                } else {
                  const onReady = () => {
                    if (window.LiquidxHydrate && window.LiquidxHydrate[name]) {
                      window.LiquidxHydrate[name](this);
                      document.removeEventListener('liquidx:ready:' + name, onReady);
                    }
                  };
                  document.addEventListener('liquidx:ready:' + name, onReady);
                }
              }
            }
            customElements.define('react-island', ReactIsland);
          }
          document.querySelectorAll('react-island[component="${componentName}"]:not([data-react-hydrated])').forEach(island => {
             if (!island.parentElement || !island.parentElement.closest('react-island')) window.LiquidxHydrate['${componentName}'](island);
          });
        `
  }

  private getEsbuildPlugins(filePath?: string): any[] {
    return [
      {
        name: 'global-externals',
        setup(build: any) {
          const externals = [
            { filter: /^preact$/, namespace: 'preact-global', content: 'module.exports = window.React' },
            { filter: /^preact\/hooks$/, namespace: 'preact-hooks-global', content: 'module.exports = window.React' },
            { filter: /^preact\/compat$/, namespace: 'preact-compat-global', content: 'module.exports = window.React' },
            { filter: /^react$/, namespace: 'react-global', content: 'module.exports = window.React' },
            { filter: /^react-dom$/, namespace: 'react-dom-global', content: 'module.exports = window.ReactDOM' },
          ]

          externals.forEach(ext => {
            build.onResolve({ filter: ext.filter }, (args: any) => ({ path: args.path, namespace: ext.namespace }))
            build.onLoad({ filter: /.*/, namespace: ext.namespace }, () => ({ contents: ext.content, loader: 'js' }))
          })

          build.onResolve({ filter: /^liquidex$/ }, (args: any) => ({ path: args.path, namespace: 'liquidex-stub' }))
          build.onLoad({ filter: /.*/, namespace: 'liquidex-stub' }, () => ({
            contents: 'module.exports = { RenderSnippet: function(props) { var Slot = props.slot; if (!Slot) return null; var rest = Object.assign({}, props); delete rest.slot; return window.React.createElement(Slot, rest); }, RenderSvg: function() { return null; }, DynamicBlock: function() { return null; } };',
            loader: 'js',
          }))
        },
      },
      {
        name: 'liquidx-context-bridge',
        setup: (build: any) => {
          const fs = require('fs')
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

    const escapedCss = css.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')
    const cssId = rootId ? `css-${rootId}` : `css-${componentName}`
    return script + `\nif(window.__react_css_inject__) { window.__react_css_inject__(\`${escapedCss}\`, '${cssId}'); }`
  }
}
