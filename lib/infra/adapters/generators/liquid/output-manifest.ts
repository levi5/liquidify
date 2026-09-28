import { _match, _try, _Array } from 'funcio'
import path from 'node:path'
import type { IFileSystem } from '../../../../core/protocols/file-system'
import { ValidationError } from '../../../../core/errors/validation-error'
import { OutputTransaction } from './output-transaction'
import { sha256Hex } from '../../../../shared/liquid-helpers'
import { MANIFEST_VERSION, OUTPUT_RESERVED } from '../../../../shared/liquid-constants'
import type { Logger } from '../../../../shared/logger'

if (typeof globalThis.structuredClone !== 'function') {
  globalThis.structuredClone = <T>(value: T): T => JSON.parse(JSON.stringify(value))
}

type Entry = { files: Record<string, string>; scripts: string[]; css: string }
type Entries = Record<string, Entry>
const isRecord = (value: unknown): value is Record<string, unknown> =>
  _match(typeof value === 'object' && value !== null && !Array.isArray(value))
    .with(true, () => true)
    .with(false, () => false)
    .exec() as boolean
const digest = (content: string) => sha256Hex(content)
const HASH_PATTERN = /^[a-f0-9]{64}$/

export class OutputManifest {
  private previous: Entries = {}
  private next: Entries = {}
  private backup: Entries = {}
  private writes = new Map<string, string>()
  private readonly root: string
  private readonly manifestPath: string
  private readonly force: boolean

  constructor(
    output: string,
    private readonly fs: IFileSystem,
    private readonly logger: Logger,
    options?: { force?: boolean },
  ) {
    this.root = path.resolve(output)
    this.manifestPath = path.join(this.root, '.liquidify-manifest.json')
    this.force = _match(options?.force === true)
      .with(true, () => true)
      .with(false, () => false)
      .exec() as boolean
  }

  public async begin(files: string[], changed: Set<string>): Promise<void> {
    await _match(await this.fs.exists(this.manifestPath))
      .with(true, () => this.loadPrevious())
      .with(false, () => undefined)
      .exec()
    this.writes.clear()
    const active = new Set(files.map((file) => path.resolve(file)))
    await _Array.forEachAsync(Object.entries(this.previous), ([source, entry]) =>
      _match(!active.has(source))
        .with(true, () => undefined)
        .with(false, () => this.markMissingOutputs(source, entry, changed))
        .exec(),
    )
    this.next = Object.fromEntries(Object.entries(this.previous).filter(([file]) => active.has(file) && !changed.has(file)))
    this.backup = structuredClone(this.next)
  }

  public async abort(): Promise<void> {
    this.writes.clear()
    this.next = structuredClone(this.backup)
  }

  private async loadPrevious(): Promise<void> {
    const content = await this.fs.readFile(this.manifestPath)
    const stored: unknown = _try
      .sync(() => JSON.parse(content))
      .match({
        right: (value) => value,
        left: (error) => {
          throw new ValidationError(`Invalid output manifest JSON: ${error.message}`, this.manifestPath)
        },
      })
    this.previous = this.validateManifest(stored)
  }

  private async markMissingOutputs(source: string, entry: Entry, changed: Set<string>): Promise<void> {
    const missing = await _Array.filterAsync(Object.keys(entry.files), (relative) => this.isMissingOutput(relative))
    _match(missing.length > 0)
      .with(true, () => changed.add(source))
      .with(false, () => undefined)
      .exec()
  }

  private async isMissingOutput(relative: string): Promise<boolean> {
    return !(await this.fs.exists(this.safePath(relative)))
  }

  private validateManifest(stored: unknown): Entries {
    return _match(
      isRecord(stored) &&
        (stored as Record<string, unknown>).version === MANIFEST_VERSION &&
        isRecord((stored as Record<string, unknown>).entries),
    )
      .with(true, () => this.validateEntries((stored as { entries: Record<string, unknown> }).entries))
      .with(false, () => {
        throw new ValidationError('Invalid output manifest: expected version 1 and an entries object.', this.manifestPath)
      })
      .exec() as Entries
  }

  private validateEntries(raw: Record<string, unknown>): Entries {
    const entries: Entries = {}
    Object.entries(raw).forEach(([source, entry]) => {
      entries[source] = this.validateEntry(source, entry)
    })
    return entries
  }

  private validateEntry(source: string, entry: unknown): Entry {
    const record = _match(this.isEntryShape(source, entry))
      .with(true, () => entry as Record<string, unknown>)
      .with(false, () => {
        throw new ValidationError(`Invalid output manifest entry for "${source}": expected files, scripts and css.`, this.manifestPath)
      })
      .exec() as Record<string, unknown>
    const files: Record<string, string> = {}
    Object.entries(record.files as Record<string, unknown>).forEach(([relative, hash]) => {
      files[relative] = this.validateHash(source, relative, hash)
    })
    return { files, scripts: [...(record.scripts as string[])], css: record.css as string }
  }

  private isEntryShape(source: string, entry: unknown): boolean {
    return _match(!path.isAbsolute(source) || !isRecord(entry))
      .with(true, () => false)
      .with(false, () => this.hasEntryFields(entry as Record<string, unknown>))
      .exec() as boolean
  }

  private hasEntryFields(entry: Record<string, unknown>): boolean {
    return (
      isRecord(entry.files) &&
      Array.isArray(entry.scripts) &&
      (entry.scripts as unknown[]).every((script) => typeof script === 'string') &&
      typeof entry.css === 'string'
    )
  }

  private validateHash(source: string, relative: string, hash: unknown): string {
    this.safePath(relative)
    return _match(typeof hash === 'string' && HASH_PATTERN.test(hash as string))
      .with(true, () => hash as string)
      .with(false, () => {
        throw new ValidationError(`Invalid output manifest hash for "${relative}" in "${source}".`, this.manifestPath)
      })
      .exec() as string
  }

  public async write(source: string, file: string, content: string): Promise<void> {
    const resolvedSource = path.resolve(source)
    const relative = path.relative(this.root, path.resolve(file))
    this.safePath(relative)
    _match(OUTPUT_RESERVED.has(relative.replace(/\\/g, '/')))
      .with(true, () => {
        throw new ValidationError(`Output path is reserved by Liquidify: ${relative}`, resolvedSource)
      })
      .with(false, () => undefined)
      .exec()
    const conflict = Object.entries(this.next).find(([owner, entry]) => owner !== resolvedSource && relative in entry.files)
    _match(conflict === undefined)
      .with(true, () => undefined)
      .with(false, () => {
        throw new ValidationError(`Output conflict: ${relative} is also generated by ${(conflict as [string, Entry])[0]}.`, resolvedSource)
      })
      .exec()
    await this.ensureAdoptable(resolvedSource, relative, content)
    this.writes.set(file, content)
    this.entry(resolvedSource).files[relative] = digest(content)
  }

  private async ensureAdoptable(source: string, relative: string, content: string): Promise<void> {
    const owned = Object.values(this.previous).some((entry) => relative in entry.files)
    const blocked = _match(owned || this.force)
      .with(true, () => false)
      .with(false, () => true)
      .exec() as boolean
    await _match(blocked)
      .with(true, () => this.rejectUnmanaged(source, relative, content))
      .with(false, () => undefined)
      .exec()
  }

  private async rejectUnmanaged(source: string, relative: string, content: string): Promise<void> {
    await _match(await this.fs.exists(this.safePath(relative)))
      .with(true, () => this.compareExisting(source, relative, content))
      .with(false, () => undefined)
      .exec()
  }

  private async compareExisting(source: string, relative: string, content: string): Promise<void> {
    const existing = await this.fs.readFile(this.safePath(relative))
    _match(digest(existing) === digest(content))
      .with(true, () => undefined)
      .with(false, () => {
        throw new ValidationError(`Output conflict: ${relative} already exists and is not managed by Liquidify.`, source)
      })
      .exec()
  }

  public contributions(source: string, scripts: string[], css: string): void {
    const record = this.entry(path.resolve(source))
    record.scripts = scripts
    record.css = css
  }

  private entry(source: string): Entry {
    this.next[source] ??= { files: {}, scripts: [], css: '' }
    return this.next[source]
  }

  private safePath(relative: string): string {
    const resolved = path.resolve(this.root, relative)
    _match(
      !relative ||
        path.isAbsolute(relative) ||
        path.relative(this.root, resolved).startsWith('..') ||
        !/^(assets|sections|snippets|blocks)[/\\].+\.(js|liquid)$/.test(relative),
    )
      .with(true, () => {
        throw new ValidationError(`Unsafe output path in manifest: ${relative}`, this.manifestPath)
      })
      .with(false, () => undefined)
      .exec()
    return resolved
  }

  public async finish(): Promise<void> {
    const transaction = new OutputTransaction(this.fs, this.logger)
    try {
      await _Array.forEachAsync([...this.writes], ([file, content]) => transaction.write(file, content))
      await this.collectStale(transaction)
      await this.writeAggregates(transaction)
      await transaction.write(this.manifestPath, JSON.stringify({ version: MANIFEST_VERSION, entries: this.next }, null, 2))
      this.previous = structuredClone(this.next)
    } catch (error) {
      await transaction.rollback()
      throw error
    }
  }

  private async collectStale(transaction: OutputTransaction): Promise<void> {
    const retained = new Set(Object.values(this.next).flatMap((entry) => Object.keys(entry.files)))
    await _Array.forEachAsync(Object.values(this.previous), (entry) => this.collectStaleEntry(entry, retained, transaction))
  }

  private async collectStaleEntry(entry: Entry, retained: Set<string>, transaction: OutputTransaction): Promise<void> {
    await _Array.forEachAsync(Object.entries(entry.files), ([relative, hash]) =>
      _match(retained.has(relative))
        .with(true, () => undefined)
        .with(false, () => this.removeUnchanged(relative, hash, transaction))
        .exec(),
    )
  }

  private async removeUnchanged(relative: string, hash: string, transaction: OutputTransaction): Promise<void> {
    const file = this.safePath(relative)
    const exists = await this.fs.exists(file)
    if (!exists) return
    if (digest(await this.fs.readFile(file)) === hash) {
      await transaction.remove(file)
      return
    }
    this.logger.warn(`Preserving user-modified output (not managed by last build): ${relative}`)
  }

  private async writeAggregates(transaction: OutputTransaction): Promise<void> {
    const entries = Object.entries(this.next)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, entry]) => entry)
    const scripts = [...new Set(entries.flatMap((entry) => entry.scripts))]
      .map((script) => `<script src="{{ '${script}' | asset_url }}" defer></script>`)
      .join('\n')
    const css = [...new Set(entries.map((entry) => entry.css.trim()).filter(Boolean))].join('\n')
    await this.updateAggregate(
      'snippets/script-global.liquid',
      scripts,
      '{% comment %}liquidify:start{% endcomment %}',
      '{% comment %}liquidify:end{% endcomment %}',
      (file, content) => transaction.write(file, content),
    )
    await this.updateAggregate('assets/global.css', css, '/* liquidify:start */', '/* liquidify:end */', (file, content) =>
      transaction.write(file, content),
    )
  }

  private async updateAggregate(
    relative: string,
    content: string,
    start: string,
    end: string,
    write: (file: string, content: string) => Promise<void>,
  ): Promise<void> {
    const file = path.join(this.root, relative)
    const exists = await this.fs.exists(file)
    const previous = _match(exists)
      .with(true, () => this.fs.readFile(file))
      .with(false, () => Promise.resolve(''))
      .exec() as Promise<string>
    const body = await previous
    const next = this.mergeAggregate(body, content, start, end)
    await _match(next === body)
      .with(true, () => undefined)
      .with(false, () => this.persistAggregate(file, next, write))
      .exec()
  }

  private mergeAggregate(previous: string, content: string, start: string, end: string): string {
    const begin = previous.indexOf(start)
    const finish = previous.indexOf(end, begin)
    const managed = _match(content === '')
      .with(true, () => '')
      .with(false, () => `${start}\n${content}\n${end}`)
      .exec() as string
    return _match(begin >= 0 && finish >= begin)
      .with(true, () => previous.slice(0, begin) + managed + previous.slice(finish + end.length))
      .with(false, () => previous + this.aggregateSuffix(previous, managed))
      .exec() as string
  }

  private aggregateSuffix(previous: string, managed: string): string {
    return _match(managed === '')
      .with(true, () => '')
      .with(false, () => this.prefixNewline(previous, managed))
      .exec() as string
  }

  private prefixNewline(previous: string, managed: string): string {
    return _match(previous !== '' && !previous.endsWith('\n'))
      .with(true, () => `\n${managed}`)
      .with(false, () => managed)
      .exec() as string
  }

  private async persistAggregate(file: string, next: string, write: (file: string, content: string) => Promise<void>): Promise<void> {
    await this.fs.mkdir(path.dirname(file), true)
    await write(file, next)
  }
}
