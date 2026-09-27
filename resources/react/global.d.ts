import '../../lib/types/runtime'

interface LiquidifyHydrateEntry {
  (container: any): void
}

interface LiquidifyProps {
  [key: string]: unknown
}

interface LiquidifyTry {
  sync<T>(run: () => T): { isLeft(): boolean; isRight(): boolean; value: any }
}

declare global {
  interface Element {
    _unmountTimeout?: ReturnType<typeof setTimeout> | null
    _liquidifyReadyCleanup?: (() => void) | null
    _liquidifyObserver?: IntersectionObserver | null
    _liquidifyInitialProps?: LiquidifyProps
    _reactRoot?: { render: (node: any) => void; unmount: () => void } | null
  }

  interface Window {
    React: typeof import('preact/compat')
    ReactDOM: typeof import('preact/compat') & typeof import('preact/compat/client')
    ReactDOMClient: typeof import('preact/compat/client')
    __react_css_inject__?: (cssText: string, id: string) => void

    LiquidifyComponents: Record<string, unknown>
    LiquidxComponents: Record<string, unknown>

    LiquidifyTry: LiquidifyTry
    LiquidifyJSXRuntime: typeof import('preact/jsx-runtime')
    LiquidifyJSXDevRuntime: typeof import('preact/jsx-dev-runtime')

    LiquidxEvents: import('../../lib/types/runtime').LiquidifyEventBus
    LiquidxEmitEvent: <T = any>(event: string, data?: T) => void
    LiquidxUseEvent: <T = any>(event: string, callback: (data: T) => void) => void

    LiquidifyParseJSON: <T>(
      text: string,
      node: Node,
      attribute: string,
      fallback: T,
      allowText?: boolean,
    ) => T | string
    LiquidifyParseProps: (node: Element) => LiquidifyProps
    LiquidifyCreateReactElement: (node: Node, index: number) => unknown
    LiquidifyGetProps: (node: Element, propName?: string) => LiquidifyProps

    LiquidifyCanMount: (container: Element) => boolean
    LiquidifyMount: (container: HTMLElement, name?: string | null) => void
    LiquidifyUnmount: (container: HTMLElement) => void
    LiquidifyRegisterRoot: (id: string, componentName: string) => void
    LiquidifyHydrate: Record<string, LiquidifyHydrateEntry>
    LiquidxHydrate: Record<string, LiquidifyHydrateEntry>

    __LIQUIDIFY_CONTEXTS__?: Record<string, unknown>
    __LIQUIDX_CONTEXTS__?: Record<string, unknown>
  }

  const __LIQUIDIFY_COMPONENT__: any
  const __LIQUIDIFY_CONTEXTS__: any
  const __LIQUIDIFY_INJECTOR__: any
  const __LIQUIDIFY_INLINE_HANDLER__: any
  const __LIQUIDIFY_ROOT_ID__: any
  const __LIQUIDIFY_SOURCE__: any
}
