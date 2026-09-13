import type { Compiler } from '../../../../../core/protocols/compiler'
import { LiquidifyError } from '../../../../../core/errors/liquidify-error'

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
					window.LiquidifyEvents = {
						on(event, callback) {
							const handler = (e) => callback(e.detail);
							window.addEventListener(event, handler);
							if (!callback.__liquidify_handlers__) callback.__liquidify_handlers__ = new Map();
							callback.__liquidify_handlers__.set(event, handler);
							return () => {
								window.removeEventListener(event, handler);
								callback.__liquidify_handlers__.delete(event);
							};
						},
						off(event, callback) {
							if (callback.__liquidify_handlers__) {
								const handler = callback.__liquidify_handlers__.get(event);
								if (handler) {
									window.removeEventListener(event, handler);
									callback.__liquidify_handlers__.delete(event);
								}
							}
						},
						emit(event, data) {
							const ev = new CustomEvent(event, {
								detail: data,
								bubbles: true,
								cancelable: true
							});
							window.dispatchEvent(ev);
						}
					};
					window.LiquidxEvents = window.LiquidifyEvents;

					// React Hook for Events
					window.LiquidifyUseEvent = (event, callback) => {
						const savedCallback = React.useRef(callback);
						React.useEffect(() => {
							savedCallback.current = callback;
						}, [callback]);

						React.useEffect(() => {
							const listener = (data) => {
								if (savedCallback.current) savedCallback.current(data);
							};
							return window.LiquidifyEvents.on(event, listener);
						}, [event]);
					};
					window.LiquidxUseEvent = window.LiquidifyUseEvent;

					// React Emit Function
					window.LiquidifyEmitEvent = (event, data) => {
						window.LiquidifyEvents.emit(event, data);
					};
					window.LiquidxEmitEvent = window.LiquidifyEmitEvent;
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

    const output = result.outputFiles?.[0]?.text
    if (!output) {
      throw new LiquidifyError('Failed to bundle the React runtime: esbuild returned no output.')
    }

    return output
  }
}
