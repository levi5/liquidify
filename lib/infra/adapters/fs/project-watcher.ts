import path from 'node:path'
import chokidar, { type FSWatcher } from 'chokidar'
import type { IFileReader } from '../../../core/protocols/file-system'
import type { BuildWatcher, BuildWatchCallbacks } from '../../../core/protocols/build-watcher'

/** Coalesces file events and keeps at most one watch-triggered build active. */
export class ProjectWatcher implements BuildWatcher {
  watcher: FSWatcher | null = null
  private dependencies = new Set<string>()
  private timer?: NodeJS.Timeout
  private building = false
  private queued = false
  private disposed = false

  constructor(
    private readonly componentsDir: string,
    private readonly reader: IFileReader,
    private readonly callbacks: BuildWatchCallbacks,
  ) {}

  get handle(): FSWatcher | null {
    return this.watcher
  }

  update(dependencies: Set<string>): void {
    this.dependencies = new Set(dependencies)
    this.watcher?.add(this.targets())
  }

  start(): void {
    if (this.watcher || this.disposed) return
    this.watcher = chokidar.watch(this.targets(), { ignoreInitial: true, ignored: (filename) => !this.isWatched(filename) })
    for (const event of ['add', 'change', 'unlink', 'addDir', 'unlinkDir'] as const) {
      this.watcher.on(event, (filename) => {
        if (this.disposed) return
        this.callbacks.changed(filename)
        if (this.timer) clearTimeout(this.timer)
        this.timer = setTimeout(() => {
          void this.runSerialized()
        }, 200)
      })
    }
    this.watcher.on('ready', () => this.callbacks.ready())
    this.watcher.on('error', (error) => this.callbacks.failed(error))
  }

  async runSerialized(): Promise<void> {
    if (this.disposed) return
    if (this.building) {
      this.queued = true
      return
    }
    this.building = true
    try {
      do {
        this.queued = false
        try {
          await this.callbacks.build()
        } catch (error) {
          this.callbacks.failed(error)
        }
      } while (this.queued && !this.disposed)
    } finally {
      this.building = false
    }
  }

  async close(): Promise<void> {
    this.disposed = true
    this.queued = false
    if (this.timer) clearTimeout(this.timer)
    const watcher = this.watcher
    this.watcher = null
    this.dependencies.clear()
    if (watcher) await watcher.close()
  }

  private targets(): string[] {
    return [
      ...new Set([
        path.resolve(this.componentsDir),
        ...this.dependencies,
        ...Array.from(this.dependencies, (filename) => this.nearestExisting(filename)),
      ]),
    ]
  }

  private nearestExisting(filename: string): string {
    let directory = filename
    while (!this.reader.existsSync(directory) && path.dirname(directory) !== directory) directory = path.dirname(directory)
    return directory
  }

  private isWatched(filename: string): boolean {
    const absolute = path.resolve(filename)
    const components = path.resolve(this.componentsDir)
    if (absolute === components || absolute.startsWith(`${components}${path.sep}`) || components.startsWith(`${absolute}${path.sep}`))
      return true
    for (const dependency of this.dependencies) {
      if (dependency === absolute || dependency.startsWith(`${absolute}${path.sep}`)) return true
    }
    return false
  }
}
