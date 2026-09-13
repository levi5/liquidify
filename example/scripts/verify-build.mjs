import { readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const themeRoot = fileURLToPath(new URL('../', import.meta.url))

async function filesIn(directory, extension) {
  const entries = await readdir(path.join(themeRoot, directory), { withFileTypes: true })
  const groups = await Promise.all(entries.map((entry) => {
    const name = path.join(directory, entry.name)
    return entry.isDirectory() ? filesIn(name, extension) : name.endsWith(extension) ? [name] : []
  }))
  return groups.flat()
}

export async function verifyBuild() {
  const errors = new Set()
  const requireFile = async (file, source) => {
    try {
      if (!(await stat(path.join(themeRoot, file))).size) errors.add(`${source}: ${file} está vazio.`)
    } catch {
      errors.add(`${source}: arquivo ausente: ${file}.`)
    }
  }
  const liquidFiles = (await Promise.all(
    ['layout', 'sections', 'snippets'].map((directory) => filesIn(directory, '.liquid')),
  )).flat()

  for (const file of liquidFiles) {
    const source = await readFile(path.join(themeRoot, file), 'utf8')
    const schema = source.match(/{%-?\s*schema\s*-?%}([\s\S]*?){%-?\s*endschema\s*-?%}/)
    if (schema) {
      try {
        JSON.parse(schema[1])
      } catch {
        errors.add(`${file}: schema JSON inválido.`)
      }
    }
    const markup = source.replace(/{%-?\s*(schema|comment)\s*-?%}[\s\S]*?{%-?\s*end\1\s*-?%}/g, '')
    if (file.startsWith('sections/') && !markup.trim()) errors.add(`${file}: seção sem conteúdo.`)
    if (/<(?:span|div|button|a|p|textarea|select)\b[^>]*\/\s*>/i.test(markup)) {
      errors.add(`${file}: elemento HTML não vazio foi autoencerrado.`)
    }
    if (/{%\s*paginate\b[^%]*\bby\s*%}/.test(markup)) errors.add(`${file}: paginação sem tamanho.`)
    if (/{{\s*{%/.test(markup)) errors.add(`${file}: tag Liquid dentro de uma expressão de saída.`)
    if (/\s(?:checked|disabled|selected|multiple|required|readonly)="(?:false|true|{{[\s\S]*?}})"/.test(markup)) {
      errors.add(`${file}: atributo booleano dinâmico serializado como texto.`)
    }
    for (const match of markup.matchAll(/{%-?\s*render\s+['"]([^'"]+)['"]/g)) {
      await requireFile(`snippets/${match[1]}.liquid`, file)
    }
    for (const match of markup.matchAll(/{%-?\s*sections\s+['"]([^'"]+)['"]/g)) {
      await requireFile(`sections/${match[1]}.json`, file)
    }
    for (const match of markup.matchAll(/['"]([^'"\n]+)['"]\s*\|\s*asset_url\b/g)) {
      await requireFile(`assets/${match[1]}`, file)
    }
  }

  const jsonFiles = (await Promise.all(
    ['templates', 'sections', 'config', 'locales'].map((directory) => filesIn(directory, '.json')),
  )).flat()
  for (const file of jsonFiles) {
    try {
      const data = JSON.parse(await readFile(path.join(themeRoot, file), 'utf8'))
      if (file.startsWith('templates/') || file.startsWith('sections/')) {
        for (const section of Object.values(data.sections || {})) {
          await requireFile(`sections/${section.type}.liquid`, file)
        }
        for (const id of data.order || []) {
          if (!data.sections?.[id]) errors.add(`${file}: seção ${id} ausente da composição.`)
        }
      }
    } catch (error) {
      errors.add(`${file}: ${error.message}`)
    }
  }

  if (errors.size) throw new Error(`Verificação do tema falhou:\n- ${[...errors].join('\n- ')}`)
  console.log(`Verificação concluída: ${liquidFiles.length} arquivos Liquid e ${jsonFiles.length} arquivos JSON.`)
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  try {
    await verifyBuild()
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
