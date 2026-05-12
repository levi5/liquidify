import { FC, ReactNode } from 'preact/compat'

declare module 'liquidex' {
  export interface DynamicBlockProps {
    slot: any[]
  }
  export const DynamicBlock: FC<DynamicBlockProps>

  export interface RenderSnippetProps {
    slot: any
    options?: any
    [key: string]: any
  }
  export const RenderSnippet: FC<RenderSnippetProps>

  export interface RenderSvgProps {
    name: string
  }
  export const RenderSvg: FC<RenderSvgProps>

  export interface PaginateByLiquidProps {
    collection: any
    by: number | string
    children: ReactNode
  }
  export const PaginateByLiquid: FC<PaginateByLiquidProps>

  export interface FormBlockProps {
    name: string
    lang?: string
    className?: string
    children?: ReactNode
    [key: string]: any
  }
  export const FormBlock: FC<FormBlockProps>
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any
    }
    interface HTMLAttributes {
      [key: string]: any
    }
  }
}
