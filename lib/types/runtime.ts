export interface LiquidxEventBus {
	on(event: string, callback: (data: any) => void): () => void
	off(event: string, callback: (data: any) => void): void
	emit(event: string, data?: any): void
}

export const LiquidxEvents: LiquidxEventBus = {
	on: () => (() => {}),
	off: () => {},
	emit: () => {},
}

export function useLiquidxEvent<T = any>(event: string, callback: (data: T) => void): void {}
export function emitLiquidxEvent<T = any>(event: string, data?: T): void {}
export function registerLiquidIsland(name: string, component: any): void {}

declare global {
	interface Window {
		LiquidxEvents: LiquidxEventBus
		LiquidxUseEvent: <T = any>(event: string, callback: (data: T) => void) => void
		LiquidxEmitEvent: <T = any>(event: string, data?: T) => void
	}
}
