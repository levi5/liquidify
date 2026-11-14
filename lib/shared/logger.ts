import { _match } from 'funcio'
import type { Logger } from '../core/protocols/logger'
export type { Logger } from '../core/protocols/logger'

export class ConsoleLogger implements Logger {
  info(message: string): void {
    console.log(message)
  }
  warn(message: string): void {
    console.warn(message)
  }
  error(message: string, cause?: unknown): void {
    _match(cause === undefined)
      .with(true, () => console.error(message))
      .with(false, () => console.error(message, cause))
      .exec()
  }
}

export class SilentLogger implements Logger {
  info(): void {}
  warn(): void {}
  error(): void {}
}
