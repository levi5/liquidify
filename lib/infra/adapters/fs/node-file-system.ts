import { appendFileSync, existsSync, mkdirSync, readFileSync, unlinkSync, utimesSync, writeFileSync } from 'fs'
import { IFileSystem } from '../../../core/protocols/file-system'

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
    if (!existsSync(path)) {
      mkdirSync(path, { recursive })
    }
  }

  public async unlink(path: string): Promise<void> {
    if (existsSync(path)) {
      unlinkSync(path)
    }
  }

  public async utimes(path: string, atime: Date, mtime: Date): Promise<void> {
    if (existsSync(path)) {
      utimesSync(path, atime, mtime)
    }
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
    if (!existsSync(path)) {
      mkdirSync(path, { recursive })
    }
  }
}
