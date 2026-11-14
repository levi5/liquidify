import type { EventEmitter } from 'node:events'

export interface BuildWatchCallbacks {
  build(): Promise<unknown>
  changed(filename: string): void
  failed(error: unknown): void
  ready(): void
}

export interface BuildWatcher {
  readonly handle: (EventEmitter & { close(): Promise<void> }) | null
  update(dependencies: Set<string>): void
  start(): void
  runSerialized(): Promise<void>
  close(): Promise<void>
}

export type BuildWatcherFactory = (callbacks: BuildWatchCallbacks) => BuildWatcher
