import { FC, ReactNode } from 'preact/compat'

export interface DynamicBlockProps {
  slot: any[]
}
export const DynamicBlock: FC<DynamicBlockProps> = (() => null) as any

export interface RenderSnippetProps {
  slot: any
  options?: any
  [key: string]: any
}
export const RenderSnippet: FC<RenderSnippetProps> = (() => null) as any

export interface RenderSvgProps {
  name: string
}
export const RenderSvg: FC<RenderSvgProps> = (() => null) as any

export interface PaginateByLiquidProps {
  collection: any
  by: number | string
  children: ReactNode
}
export const PaginateByLiquid: FC<PaginateByLiquidProps> = (() => null) as any

export interface FormBlockProps {
  name: string
  lang?: string
  className?: string
  children?: ReactNode
  [key: string]: any
}
export const FormBlock: FC<FormBlockProps> = (() => null) as any

export interface FallbackProps {
  of: unknown
  fallback?: unknown
  children?: ReactNode
  only?: 'default' | 'nil' | 'blank'
  allowFalse?: boolean
  allow_false?: boolean
}
export const Fallback: FC<FallbackProps> = (() => null) as any

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'liquid-data': {
        'data-liquid-store'?: string
        store?: any
        children?: any
        [key: string]: any
      }
      'product-provider': any
      'react-island': any
    }
  }
  
  namespace React.JSX {
    interface IntrinsicElements {
      'liquid-data': {
        'data-liquid-store'?: string
        store?: any
        children?: any
        [key: string]: any
      }
      'product-provider': any
      'react-island': any
    }
  }
}

declare module 'preact' {
  namespace JSX {
    interface IntrinsicElements {
      'liquid-data': any
      'product-provider': any
      'react-island': any
    }
  }
}
