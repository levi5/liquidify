import {
  closeSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  unlinkSync,
  utimesSync,
  writeFileSync,
  type Stats,
} from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { ValidationError } from '../../../core/errors/validation-error'
import { _match } from 'funcio'
import type { IFileSystem } from '../../../core/protocols/file-system'

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
    this.writeFileSync(path, (existsSync(path) ? readFileSync(path, 'utf-8') : '') + content)
  }

  public async exists(path: string): Promise<boolean> {
    return existsSync(path)
  }

  public async readFile(path: string): Promise<string> {
    return readFileSync(path, 'utf-8')
  }

  public async writeFile(path: string, content: string): Promise<void> {
    this.writeFileSync(path, content)
  }

  public async mkdir(path: string, recursive = true): Promise<void> {
    this.checkWrite(path)
    _match(existsSync(path))
      .with(true, () => undefined)
      .with(false, () => mkdirSync(path, { recursive }))
      .exec()
  }

  public async unlink(path: string): Promise<void> {
    this.checkWrite(path)
    _match(existsSync(path))
      .with(true, () => unlinkSync(path))
      .with(false, () => undefined)
      .exec()
  }

  public async utimes(path: string, atime: Date, mtime: Date): Promise<void> {
    this.checkWrite(path)
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

  public writeFileSync(file: string, content: string): void {
    this.checkWrite(file)
    const temporary = path.join(path.dirname(file), `.liquidify-${randomUUID()}.tmp`)
    const mode = existsSync(file) ? lstatSync(file).mode & 0o777 : 0o666
    let fd: number | undefined
    let created = false
    try {
      fd = openSync(temporary, 'wx', mode)
      created = true
      writeFileSync(fd, content, 'utf-8')
      fsyncSync(fd)
      closeSync(fd)
      fd = undefined
      this.checkWrite(file)
      renameSync(temporary, file)
    } finally {
      if (fd !== undefined) closeSync(fd)
      if (created && existsSync(temporary)) unlinkSync(temporary)
    }
  }

  public mkdirSync(path: string, recursive = true): void {
    this.checkWrite(path)
    _match(existsSync(path))
      .with(true, () => undefined)
      .with(false, () => mkdirSync(path, { recursive }))
      .exec()
  }
}
