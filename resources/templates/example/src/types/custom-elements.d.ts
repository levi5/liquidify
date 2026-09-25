declare global {
  namespace JSX {
    interface IntrinsicElements {
      'my-accordion': any
      'my-accordion-item': any
      'my-accordion-trigger': any
      'my-accordion-content': any
    }
  }
  namespace React.JSX {
    interface IntrinsicElements {
      'my-accordion': any
      'my-accordion-item': any
      'my-accordion-trigger': any
      'my-accordion-content': any
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'my-accordion': any
      'my-accordion-item': any
      'my-accordion-trigger': any
      'my-accordion-content': any
    }
  }
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'my-accordion': any
      'my-accordion-item': any
      'my-accordion-trigger': any
      'my-accordion-content': any
    }
  }
}

export {}
