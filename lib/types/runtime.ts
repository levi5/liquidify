export interface LiquidifyEventBus {
	on(event: string, callback: (data: any) => void): () => void
	off(event: string, callback: (data: any) => void): void
	emit(event: string, data?: any): void
}

export const LiquidifyEvents: LiquidifyEventBus = {
	on: () => (() => {}),
	off: () => {},
	emit: () => {},
}

export function useLiquidifyEvent<T = any>(event: string, callback: (data: T) => void): void {}
export function emitLiquidifyEvent<T = any>(event: string, data?: T): void {}
export function registerLiquidIsland(name: string, component: any): void {}

declare global {
	interface Window {
		LiquidifyEvents: LiquidifyEventBus
		LiquidifyUseEvent: <T = any>(event: string, callback: (data: T) => void) => void
		LiquidifyEmitEvent: <T = any>(event: string, data?: T) => void
	}
}

