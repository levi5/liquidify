import fs from 'node:fs'
import path from 'node:path'
import { _try } from 'funcio'
import { NodeFileSystem } from '../../../../infra/adapters/fs/node-file-system'
import { configureTemplate } from './template-source'

const IGNORED_ENTRIES = new Set([
  'node_modules',
  '.shopify',
  '.git',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  '.liquidify-manifest.json',
])

function inspectTemplate(source: string, destination: string, root: string, force: boolean): void {
  if (fs.lstatSync(source).isSymbolicLink()) throw new Error(`Refusing to copy symlink: ${source}. Templates must not contain symlinks.`)
  new NodeFileSystem(root).assertSafePath(destination, root)
  if (fs.existsSync(destination) && !fs.statSync(destination).isDirectory()) {
    throw new Error(`Refusing to overwrite existing path: ${destination}.`)
  }
  for (const entry of fs.readdirSync(source, { withFileTypes: true })) {
    if (IGNORED_ENTRIES.has(entry.name)) continue
    const sourcePath = path.join(source, entry.name)
    const destinationPath = path.join(destination, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`Refusing to copy symlink: ${sourcePath}. Templates must not contain symlinks.`)
    new NodeFileSystem(root).assertSafePath(destinationPath, root)
    if (entry.isDirectory()) inspectTemplate(sourcePath, destinationPath, root, force)
    else if (!force && fs.existsSync(destinationPath)) {
      throw new Error(`Refusing to overwrite existing file: ${destinationPath}. Initialize in an empty directory or use --force.`)
    }
  }
}

export const copyTemplate = (sourceDir: string, targetDir: string, projectName: string, force = false) =>
  _try.sync(() => {
    const root = path.resolve(targetDir)
    inspectTemplate(sourceDir, root, root, force)
    fs.mkdirSync(root, { recursive: true })
    fs.cpSync(sourceDir, root, {
      recursive: true,
      force,
      errorOnExist: !force,
      filter: (filename) => !IGNORED_ENTRIES.has(path.basename(filename)),
    })
    configureTemplate(root, projectName)
  })
