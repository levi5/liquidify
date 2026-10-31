export interface IFileReader {
  assertSafePath?(path: string, root: string): void
  exists(path: string): Promise<boolean>
  readFile(path: string): Promise<string>
  existsSync(path: string): boolean
  readFileSync(path: string): string
}

export interface IFileWriter {
  writeFile(path: string, content: string): Promise<void>
  mkdir(path: string, recursive?: boolean): Promise<void>
  unlink(path: string): Promise<void>
  utimes(path: string, atime: Date, mtime: Date): Promise<void>
  appendFile(path: string, content: string): Promise<void>
  writeFileSync(path: string, content: string): void
  mkdirSync(path: string, recursive?: boolean): void
}

export interface IFileSystem extends IFileReader, IFileWriter {}
