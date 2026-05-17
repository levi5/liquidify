import { Compiler } from '../../../../../core/protocols/compiler'

export class ReactRuntimeBuilder {
	constructor(private readonly compiler: Compiler) {}

	public async build(): Promise<string> {
		const result = await this.compiler.build({
			stdin: {
				contents: `
					import React from 'preact/compat'
					import * as ReactDOM from 'preact/compat'

					const createRoot = (container) => {
						return {
						render: (element) => {
							ReactDOM.render(element, container);
						}
						}
					}

					window.React = React
					window.ReactDOM = { ...ReactDOM, createRoot }

					// Global Event Bridge
					window.LiquidxEvents = {
						on(event, callback) {
							const handler = (e) => callback(e.detail);
							window.addEventListener('liquidx:' + event, handler);
							if (!callback.__liquidx_handlers__) callback.__liquidx_handlers__ = new Map();
							callback.__liquidx_handlers__.set(event, handler);
							return () => {
								window.removeEventListener('liquidx:' + event, handler);
								callback.__liquidx_handlers__.delete(event);
							};
						},
						off(event, callback) {
							if (callback.__liquidx_handlers__) {
								const handler = callback.__liquidx_handlers__.get(event);
								if (handler) {
									window.removeEventListener('liquidx:' + event, handler);
									callback.__liquidx_handlers__.delete(event);
								}
							}
						},
						emit(event, data) {
							const ev = new CustomEvent('liquidx:' + event, {
								detail: data,
								bubbles: true,
								cancelable: true
							});
							window.dispatchEvent(ev);
						}
					};

					// React Hook for Events
					window.LiquidxUseEvent = (event, callback) => {
						const savedCallback = React.useRef(callback);
						React.useEffect(() => {
							savedCallback.current = callback;
						}, [callback]);

						React.useEffect(() => {
							const listener = (data) => {
								if (savedCallback.current) savedCallback.current(data);
							};
							return window.LiquidxEvents.on(event, listener);
						}, [event]);
					};

					// React Emit Function
					window.LiquidxEmitEvent = (event, data) => {
						window.LiquidxEvents.emit(event, data);
					};
				`,
				resolveDir: process.cwd(),
				loader: 'ts',
			},
			bundle: true,
			write: false,
			format: 'iife',
			platform: 'browser',
			minify: true,
			target: ['es2020'],
		})

		return result.outputFiles[0].text
	}
}
