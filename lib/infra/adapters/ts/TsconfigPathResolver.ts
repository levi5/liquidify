import pathModule from 'node:path'
import type { IPathResolver } from '../../../core/protocols/path-resolver'
import type { IFileSystem } from '../../../core/protocols/file-system'
import { NodeFileSystem } from '../fs/node-file-system'

export class TsconfigPathResolver implements IPathResolver {
  private tsconfigPaths: Record<string, string> | null = null
  private readonly cwd = process.cwd()

  constructor(private readonly fs: IFileSystem = new NodeFileSystem()) {
    this.loadPaths()
  }

  private loadPaths(): void {
    try {
      const tsconfigPath = pathModule.resolve(this.cwd, 'tsconfig.json')
      if (!this.fs.existsSync(tsconfigPath)) return

      const tsconfigContent = this.fs.readFileSync(tsconfigPath)
      const cleanContent = tsconfigContent.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '')
      const tsconfig = JSON.parse(cleanContent)

      if (tsconfig?.compilerOptions?.paths) {
        this.tsconfigPaths = {}
        for (const [key, values] of Object.entries(tsconfig.compilerOptions.paths)) {
          const alias = key.replace('/*', '/')
          const target = (values as string[])[0].replace('/*', '/')
          this.tsconfigPaths[alias] = target
        }
      }
    } catch (_e) {}
  }

  public resolve(importPath: string, basePath?: string): string {
    let resolvedPath = importPath

    if (this.tsconfigPaths) {
      for (const [alias, target] of Object.entries(this.tsconfigPaths)) {
        if (resolvedPath.startsWith(alias)) {
          resolvedPath = resolvedPath.replace(alias, target)
          break
        }
      }
    }

    if (resolvedPath.startsWith('.') && basePath) {
      resolvedPath = pathModule.resolve(pathModule.dirname(basePath), resolvedPath)
    } else if (!pathModule.isAbsolute(resolvedPath)) {
      resolvedPath = pathModule.resolve(this.cwd, resolvedPath)
    }

    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.schema', '']
    for (const ext of extensions) {
      const fullPath = resolvedPath + ext
      if (this.fs.existsSync(fullPath)) {
        return fullPath
      }
    }

    return resolvedPath
  }
}
