export interface LiquidifyEventBus {
  on(event: string, callback: (data: any) => void): () => void
  off(event: string, callback: (data: any) => void): void
  emit(event: string, data?: any): void
}

const hasWindow = (): boolean => typeof window !== 'undefined'

const noopUnsubscribe = (): void => {}

const eventBus: LiquidifyEventBus = {
  on(event, callback) {
    if (!hasWindow() || !window.LiquidifyEvents) return noopUnsubscribe
    return window.LiquidifyEvents.on(event, callback)
  },
  off(event, callback) {
    if (!hasWindow() || !window.LiquidifyEvents) return
    window.LiquidifyEvents.off(event, callback)
  },
  emit(event, data) {
    if (!hasWindow() || !window.LiquidifyEvents) return
    window.LiquidifyEvents.emit(event, data)
  },
}

export const LiquidifyEvents: LiquidifyEventBus = eventBus

export function useLiquidifyEvent<T = any>(event: string, callback: (data: T) => void): void {
  if (!hasWindow() || !window.LiquidifyUseEvent) return
  window.LiquidifyUseEvent(event, callback)
}

export function emitLiquidifyEvent<T = any>(event: string, data?: T): void {
  if (!hasWindow() || !window.LiquidifyEmitEvent) return
  window.LiquidifyEmitEvent(event, data)
}

export function registerLiquidIsland(name: string, component: any): () => void {
  if (!hasWindow() || !window.registerLiquidIsland) return noopUnsubscribe
  return window.registerLiquidIsland(name, component)
}

declare global {
  interface Window {
    LiquidifyActions: Map<string, (this: EventTarget, event: Event) => void>
    registerLiquidifyAction: (name: string, handler: (this: EventTarget, event: Event) => void) => () => void
    registerLiquidIsland: (name: string, component: any) => () => void
    LiquidxRegisterIsland: (name: string, component: any) => () => void
    LiquidifyComponents: Record<string, unknown>
    LiquidxComponents: Record<string, unknown>
    LiquidifyEvents: LiquidifyEventBus
    LiquidifyUseEvent: <T = any>(event: string, callback: (data: T) => void) => void
    LiquidifyEmitEvent: <T = any>(event: string, data?: T) => void
    LiquidifyTakePendingEvents: <T = any>(event: string) => T[]
  }
}

export function registerLiquidifyAction(name: string, handler: (this: EventTarget, event: Event) => void): () => void {
  if (!hasWindow() || !window.registerLiquidifyAction) return noopUnsubscribe
  return window.registerLiquidifyAction(name, handler)
}
