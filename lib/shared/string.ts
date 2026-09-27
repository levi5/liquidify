import { _Maybe, _match, _pipe } from 'funcio'

export function pascalToKebab(str = '') {
  return _pipe(
    str,
    (value) => value.replace(/([a-z0-9])([A-Z])/g, '$1-$2'),
    (value) => value.toLowerCase(),
  )
}

const SAFE_FILE_NAME = /^[a-z0-9][a-z0-9-_]*$/

const lastSegment = (value: string): string =>
  _pipe(
    value,
    (current) => current.replace(/\\/g, '/'),
    (current) => current.split('/'),
    (parts) => _Maybe.of(parts.pop()).getOrElse(''),
  )

const slugify = (value: string): string =>
  _pipe(
    value,
    (current) => current.replace(/[^a-z0-9-_]+/g, '-'),
    (current) => current.replace(/^-+|-+$/g, ''),
  )

const pickValid = (candidate: string, fallback: string): string =>
  _match(SAFE_FILE_NAME.test(candidate))
    .with(true, () => candidate)
    .with(false, () => fallback)
    .exec() as string

export function toSafeFileName(componentName: string, fallback = 'component'): string {
  return _Maybe
    .of(pascalToKebab(componentName ?? ''))
    .map(
      (kebab) =>
        _match(SAFE_FILE_NAME.test(kebab))
          .with(true, () => kebab)
          .with(false, () => pickValid(slugify(lastSegment(kebab)), fallback))
          .exec() as string,
    )
    .getOrElse(fallback)
}

export function assertSafeFileName(fileName: string): void {
  _match(SAFE_FILE_NAME.test(fileName))
    .with(true, () => undefined)
    .with(false, () => {
      throw new Error(`Unsafe component name "${fileName}": expected kebab-case [a-z0-9-_]. Refusing to write outside target directory.`)
    })
    .exec()
}

export const placeholder = (value: string, values: Record<string, unknown>) =>
  value.replace(/\$\{(\w+)\}/g, (match, key: string) => _Maybe.of(values[key]).map(String).getOrElse(match))
