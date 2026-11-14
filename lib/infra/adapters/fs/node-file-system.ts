import { existsSync, lstatSync, mkdirSync, readFileSync, type Stats } from 'node:fs'
import { promises as filesystem } from 'node:fs'
import path from 'node:path'
import { ValidationError } from '../../../core/errors/validation-error'
import { _match } from 'funcio'
import type { IFileSystem } from '../../../core/protocols/file-system'
import { writeAtomicFile, writeAtomicFileSync } from './atomic-write'

export class NodeFileSystem implements IFileSystem {
  constructor(private readonly outputRoot?: string) {}

  public assertSafePath(file: string, root: string): void {
    const base = path.resolve(root)
    const relative = path.relative(base, path.resolve(file))
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new ValidationError(`Output path escapes its root: ${file}`, file)
    }
    let current = base
    for (const part of ['', ...relative.split(path.sep).filter(Boolean)]) {
      current = path.join(current, part)
      let stat: Stats
      try {
        stat = lstatSync(current)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue
        throw error
      }
      if (stat.isSymbolicLink()) throw new ValidationError(`Symbolic links are not allowed in output paths: ${current}`, file)
    }
  }

  private checkWrite(file: string): void {
    this.assertSafePath(file, this.outputRoot ?? path.dirname(path.resolve(file)))
  }

  public async appendFile(path: string, content: string): Promise<void> {
    this.checkWrite(path)
    await this.writeFile(path, (existsSync(path) ? await this.readFile(path) : '') + content)
  }

  public async exists(path: string): Promise<boolean> {
    return existsSync(path)
  }

  public async readFile(path: string): Promise<string> {
    return filesystem.readFile(path, 'utf-8')
  }

  public async writeFile(path: string, content: string): Promise<void> {
    await writeAtomicFile(path, content, () => this.checkWrite(path))
  }

  public async mkdir(path: string, recursive = true): Promise<void> {
    this.checkWrite(path)
    await filesystem.mkdir(path, { recursive })
  }

  public async unlink(path: string): Promise<void> {
    this.checkWrite(path)
    await filesystem.unlink(path).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error
    })
  }

  public async utimes(path: string, atime: Date, mtime: Date): Promise<void> {
    this.checkWrite(path)
    await filesystem.utimes(path, atime, mtime).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error
    })
  }

  public existsSync(path: string): boolean {
    return existsSync(path)
  }

  public readFileSync(path: string): string {
    return readFileSync(path, 'utf-8')
  }

  public writeFileSync(file: string, content: string): void {
    writeAtomicFileSync(file, content, () => this.checkWrite(file))
  }

  public mkdirSync(path: string, recursive = true): void {
    this.checkWrite(path)
    _match(existsSync(path))
      .with(true, () => undefined)
      .with(false, () => mkdirSync(path, { recursive }))
      .exec()
  }
}
