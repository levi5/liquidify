import { _try } from 'funcio'
import type { IFileSystem } from '../../../../core/protocols/file-system'

export class OutputTransaction {
  private readonly originals = new Map<string, string | undefined>()

  constructor(private readonly fs: IFileSystem) {}

  private async remember(file: string): Promise<void> {
    if (!this.originals.has(file)) this.originals.set(file, (await this.fs.exists(file)) ? await this.fs.readFile(file) : undefined)
  }

  public async write(file: string, content: string): Promise<void> {
    await this.remember(file)
    await this.fs.writeFile(file, content)
  }

  public async remove(file: string): Promise<void> {
    await this.remember(file)
    await this.fs.unlink(file)
  }

  public async rollback(): Promise<void> {
    for (const [file, content] of [...this.originals].reverse()) {
      await _try.async(() => (content === undefined ? this.fs.unlink(file) : this.fs.writeFile(file, content)))
    }
  }
}
