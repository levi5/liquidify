import { _match } from 'funcio'

export class HTMLAttributeConverter {
  private readonly SPECIAL_CASES: Record<string, string> = {
    className: 'class',
    htmlFor: 'for',
  }

  public toHtmlAttribute(name: string): string {
    return _match(true)
      .with(!name, () => name)
      .with(name === 'key' || name === 'ref', () => '')
      .with(this.SPECIAL_CASES[name] !== undefined, () => this.SPECIAL_CASES[name])
      .with(name.startsWith('data-') || name.startsWith('aria-'), () => name)
      .with(name.startsWith('on') && name[2] === name[2]?.toUpperCase(), () => name.toLowerCase())
      .with(true, () => name.toLowerCase())
      .exec() as string
  }

  public convertProps(props: Record<string, unknown>): Record<string, unknown> {
    return Object.entries(props).reduce<Record<string, unknown>>((acc, [key, value]) => this.assignProp(acc, key, value), {})
  }

  private assignProp(acc: Record<string, unknown>, key: string, value: unknown): Record<string, unknown> {
    const htmlKey = this.toHtmlAttribute(key)
    return _match(htmlKey === '')
      .with(true, () => acc)
      .with(false, () => ({ ...acc, [htmlKey]: value }))
      .exec() as Record<string, unknown>
  }
}
