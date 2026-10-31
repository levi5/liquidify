import { _match, _try, _Array } from 'funcio'
import type { IFileSystem } from '../../../../core/protocols/file-system'
import type { Logger } from '../../../../shared/logger'

export class OutputTransaction {
  private readonly originals = new Map<string, string | undefined>()

  constructor(
    private readonly fs: IFileSystem,
    private readonly logger: Logger,
    private readonly root?: string,
  ) {}

  private async remember(file: string): Promise<void> {
    if (this.root) this.fs.assertSafePath?.(file, this.root)
    await _match(this.originals.has(file))
      .with(true, () => undefined)
      .with(false, () => this.capture(file))
      .exec()
  }

  private async capture(file: string): Promise<void> {
    const content = await _match(await this.fs.exists(file))
      .with(true, () => this.fs.readFile(file))
      .with(false, () => Promise.resolve(undefined))
      .exec()
    this.originals.set(file, content as string | undefined)
  }

  public async write(file: string, content: string): Promise<void> {
    await this.remember(file)
    await this.fs.writeFile(file, content)
  }

  public async remove(file: string): Promise<void> {
    await this.remember(file)
    await this.fs.unlink(file)
  }

  public async rollback(): Promise<string[]> {
    const failures: string[] = []
    await _Array.forEachAsync([...this.originals].reverse(), ([file, content]) => this.restore(file, content, failures))
    _match(failures.length > 0)
      .with(true, () => this.logger.error(`Output transaction rollback incomplete for: ${failures.join(', ')}`))
      .with(false, () => undefined)
      .exec()
    return failures
  }

  private async restore(file: string, content: string | undefined, failures: string[]): Promise<void> {
    const result = await _try.async(() => {
      if (this.root) this.fs.assertSafePath?.(file, this.root)
      return _match(content === undefined)
        .with(true, () => this.fs.unlink(file))
        .with(false, () => this.fs.writeFile(file, content as string))
        .exec()
    })
    result.match({
      right: () => undefined,
      left: () => failures.push(file),
    })
  }
}
