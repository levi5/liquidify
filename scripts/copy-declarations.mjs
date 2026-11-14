import fs from 'node:fs/promises'
import path from 'node:path'

const rootDirectory = path.resolve(import.meta.dirname, '..')
const sourceDirectory = path.join(rootDirectory, 'lib')
const outputDirectory = path.join(rootDirectory, 'dist')

async function copyDeclarations(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true })
  for (const entry of entries) {
    const source = path.join(directory, entry.name)
    if (entry.isDirectory()) {
      await copyDeclarations(source)
      continue
    }
    if (!entry.name.endsWith('.d.ts')) continue
    const destination = path.join(outputDirectory, path.relative(sourceDirectory, source))
    await fs.mkdir(path.dirname(destination), { recursive: true })
    await fs.copyFile(source, destination)
  }
}

await copyDeclarations(sourceDirectory)
