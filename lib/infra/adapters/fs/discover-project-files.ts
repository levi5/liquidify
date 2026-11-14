import path from 'node:path'
import { glob } from 'glob'
import { promises as filesystem } from 'node:fs'
import { ValidationError } from '../../../core/errors/validation-error'

export async function discoverProjectFiles(componentsDirectory: string, outputDirectory: string): Promise<string[]> {
  const components = path.resolve(componentsDirectory)
  const output = path.resolve(outputDirectory)
  if (components === output)
    throw new ValidationError('componentsDir and output must be different directories to avoid compiling generated assets.', components)
  const sourceDirectory = await filesystem.stat(components).catch((error: NodeJS.ErrnoException) => {
    if (error.code === 'ENOENT' || error.code === 'ENOTDIR') return undefined
    throw error
  })
  if (!sourceDirectory?.isDirectory())
    throw new ValidationError(`Components directory does not exist or is not a directory: ${components}`, components)
  const nestedOutput = output.startsWith(`${components}${path.sep}`)
  return (
    await glob('**/*.{tsx,jsx,ts,js}', {
      cwd: components,
      absolute: true,
      ignore: {
        childrenIgnored: (entry) => entry.name === 'node_modules' || entry.name === '.git' || (nestedOutput && entry.fullpath() === output),
      },
    })
  ).sort()
}
