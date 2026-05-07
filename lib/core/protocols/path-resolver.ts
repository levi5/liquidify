export interface IPathResolver {
	resolve(importPath: string, basePath?: string): string
}
