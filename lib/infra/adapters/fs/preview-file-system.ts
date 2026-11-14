import path from 'node:path'
import type { IFileSystem } from '@core/protocols/file-system'
import { NodeFileSystem } from '@adapters/fs/node-file-system'

export interface OutputChange {
  filename: string
  operation: 'create' | 'update' | 'delete'
}

export class PreviewFileSystem implements IFileSystem {
  private readonly overlay = new Map<string, string | null>()
  private readonly directories = new Set<string>()
  private readonly reader: NodeFileSystem

  constructor(private readonly outputRoot: string) {
    this.reader = new NodeFileSystem(outputRoot)
  }

  assertSafePath(filename: string, root: string): void {
    this.reader.assertSafePath(filename, root)
  }

  existsSync(filename: string): boolean {
    const resolved = path.resolve(filename)
    if (this.overlay.has(resolved)) return this.overlay.get(resolved) !== null
    return this.directories.has(resolved) || this.reader.existsSync(resolved)
  }

  async exists(filename: string): Promise<boolean> {
    return this.existsSync(filename)
  }

  readFileSync(filename: string): string {
    const resolved = path.resolve(filename)
    const content = this.overlay.get(resolved)
    if (content === null) throw new Error(`File does not exist in preview: ${resolved}`)
    return content ?? this.reader.readFileSync(resolved)
  }

  async readFile(filename: string): Promise<string> {
    return this.readFileSync(filename)
  }

  writeFileSync(filename: string, content: string): void {
    this.assertSafePath(filename, this.outputRoot)
    this.overlay.set(path.resolve(filename), content)
  }

  async writeFile(filename: string, content: string): Promise<void> {
    this.writeFileSync(filename, content)
  }

  mkdirSync(directory: string): void {
    this.assertSafePath(directory, this.outputRoot)
    this.directories.add(path.resolve(directory))
  }

  async mkdir(directory: string): Promise<void> {
    this.mkdirSync(directory)
  }

  async unlink(filename: string): Promise<void> {
    this.assertSafePath(filename, this.outputRoot)
    this.overlay.set(path.resolve(filename), null)
  }

  async utimes(filename: string): Promise<void> {
    this.assertSafePath(filename, this.outputRoot)
  }

  async appendFile(filename: string, content: string): Promise<void> {
    this.writeFileSync(filename, (this.existsSync(filename) ? this.readFileSync(filename) : '') + content)
  }

  changes(): OutputChange[] {
    return Array.from(this.overlay)
      .flatMap(([filename, content]): OutputChange[] => {
        const exists = this.reader.existsSync(filename)
        if (content === null) return exists ? [{ filename, operation: 'delete' }] : []
        if (exists && this.reader.readFileSync(filename) === content) return []
        return [{ filename, operation: exists ? 'update' : 'create' }]
      })
      .sort((first, second) => first.filename.localeCompare(second.filename))
  }
}
