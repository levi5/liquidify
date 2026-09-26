export {}
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any
    }
  }
}

declare function h(tag: string, props: any, ...children: any[]): any
declare const Fragment: any
