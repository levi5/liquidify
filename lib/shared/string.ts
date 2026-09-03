export function pascalToKebab(str: string = '') {
  return str.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

export const placeholder = (value: string, values: any) => {
  value.replace(/\$\{(\w+)\}/g, (match, key: string) => {
    return typeof values[key] !== 'undefined' ? String(values[key]) : match
  })
}
