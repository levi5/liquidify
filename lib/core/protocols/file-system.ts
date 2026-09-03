export interface IFileSystem {
  exists(path: string): Promise<boolean>
  readFile(path: string): Promise<string>
  writeFile(path: string, content: string): Promise<void>
  mkdir(path: string, recursive?: boolean): Promise<void>
  unlink(path: string): Promise<void>
  utimes(path: string, atime: Date, mtime: Date): Promise<void>
  appendFile(path: string, content: string): Promise<void>
  existsSync(path: string): boolean
  readFileSync(path: string): string
  writeFileSync(path: string, content: string): void
  mkdirSync(path: string, recursive?: boolean): void
}
