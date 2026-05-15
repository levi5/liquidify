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
