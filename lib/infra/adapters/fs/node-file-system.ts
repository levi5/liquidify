import { appendFileSync, existsSync, mkdirSync, readFileSync, unlinkSync, utimesSync, writeFileSync } from 'node:fs'
import { _match } from 'funcio'
import type { IFileSystem } from '../../../core/protocols/file-system'

export class NodeFileSystem implements IFileSystem {
  public async appendFile(path: string, content: string): Promise<void> {
    appendFileSync(path, content, 'utf-8')
  }

  public async exists(path: string): Promise<boolean> {
    return existsSync(path)
  }

  public async readFile(path: string): Promise<string> {
    return readFileSync(path, 'utf-8')
  }

  public async writeFile(path: string, content: string): Promise<void> {
    writeFileSync(path, content, 'utf-8')
  }

  public async mkdir(path: string, recursive = true): Promise<void> {
    _match(existsSync(path))
      .with(true, () => undefined)
      .with(false, () => mkdirSync(path, { recursive }))
      .exec()
  }

  public async unlink(path: string): Promise<void> {
    _match(existsSync(path))
      .with(true, () => unlinkSync(path))
      .with(false, () => undefined)
      .exec()
  }

  public async utimes(path: string, atime: Date, mtime: Date): Promise<void> {
    _match(existsSync(path))
      .with(true, () => utimesSync(path, atime, mtime))
      .with(false, () => undefined)
      .exec()
  }

  public existsSync(path: string): boolean {
    return existsSync(path)
  }

  public readFileSync(path: string): string {
    return readFileSync(path, 'utf-8')
  }

  public writeFileSync(path: string, content: string): void {
    writeFileSync(path, content, 'utf-8')
  }

  public mkdirSync(path: string, recursive = true): void {
    _match(existsSync(path))
      .with(true, () => undefined)
      .with(false, () => mkdirSync(path, { recursive }))
      .exec()
  }
}
