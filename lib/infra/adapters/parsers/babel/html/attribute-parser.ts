export class HTMLAttributeConverter {
  private readonly SPECIAL_CASES: Record<string, string> = {
    className: 'class',
    htmlFor: 'for',
  }

  public toHtmlAttribute(name: string): string {
    if (!name) return name
    if (name === 'key' || name === 'ref') return ''

    if (this.SPECIAL_CASES[name]) return this.SPECIAL_CASES[name]

    if (name.startsWith('data-') || name.startsWith('aria-')) return name

    if (name.startsWith('on') && name[2] === name[2]?.toUpperCase()) return name.toLowerCase()

    return name.toLowerCase()
  }

  public convertProps(props: Record<string, any>): Record<string, any> {
    return Object.entries(props).reduce<Record<string, any>>((acc, [key, value]) => {
      const htmlKey = this.toHtmlAttribute(key)
      if (!htmlKey) return acc

      acc[htmlKey] = value
      return acc
    }, {})
  }
}
