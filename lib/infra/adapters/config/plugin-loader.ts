import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { createRequire } from 'node:module'
import { transformSync } from 'esbuild'
import type { LiquidifyPlugin } from '@core/protocols/plugin'
import { ValidationError } from '@core/errors/validation-error'
import { tsxStatsPlugin } from '@presentation/cli/plugins/tsx-stats'

const nodeRequire = createRequire(__filename)
const LOCAL_NAME = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/
const PACKAGE_NAME = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/

function validatePlugin(value: unknown, name: string, configPath: string): LiquidifyPlugin {
  if (typeof value === 'object' && value !== null) {
    const plugin = value as Partial<LiquidifyPlugin>
    if (typeof plugin.name === 'string' && plugin.name.trim() && typeof plugin.setup === 'function') return plugin as LiquidifyPlugin
  }
  throw new ValidationError(`Plugin "${name}" must export an object with a name and setup function.`, configPath)
}

function assertLocalPath(filename: string, directory: string, configPath: string): void {
  const relative = path.relative(fs.realpathSync(directory), fs.realpathSync(filename))
  if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new ValidationError(`Local plugin escapes the .plugins directory: ${filename}`, configPath)
  }
  if (fs.lstatSync(directory).isSymbolicLink()) {
    throw new ValidationError('The .plugins directory cannot be a symbolic link.', configPath)
  }
}

function loadTypeScriptPlugin(filename: string): unknown {
  const source = fs.readFileSync(filename, 'utf8')
  const transformed = transformSync(source, { loader: filename.endsWith('.tsx') ? 'tsx' : 'ts', format: 'cjs', target: 'es2020' })
  const module = { exports: {} }

  const script = new vm.Script(`(function(module, exports, require) {\n${transformed.code}\n})`, { filename })
  const initialize = script.runInThisContext() as (module: unknown, exports: unknown, require: unknown) => void
  initialize(module, module.exports, createRequire(filename))
  return module.exports
}

function localPluginPath(name: string, configPath: string): string | undefined {
  if (!LOCAL_NAME.test(name)) return undefined
  const directory = path.join(path.dirname(configPath), '.plugins')
  const candidates = ['.js', '.cjs', '.ts', '.tsx'].flatMap((extension) => [
    path.join(directory, `${name}${extension}`),
    path.join(directory, name, `index${extension}`),
  ])
  const filename = candidates.find((candidate) => fs.existsSync(candidate))
  if (filename) assertLocalPath(filename, directory, configPath)
  return filename
}

function resolvePlugin(name: string, configPath: string): LiquidifyPlugin {
  if (name === 'tsx-stats') return tsxStatsPlugin
  if ((!LOCAL_NAME.test(name) && !PACKAGE_NAME.test(name)) || name === '__proto__' || name === 'constructor') {
    throw new ValidationError(`Invalid plugin reference "${name}". Use a local plugin name or an npm package name, not a path.`, configPath)
  }
  try {
    const localPath = localPluginPath(name, configPath)
    const filename = localPath ?? nodeRequire.resolve(name, { paths: [path.dirname(configPath)] })
    const loaded = localPath && /\.tsx?$/.test(filename) ? loadTypeScriptPlugin(filename) : nodeRequire(filename)
    return validatePlugin(loaded?.default ?? loaded, name, configPath)
  } catch (error) {
    if (error instanceof ValidationError) throw error
    throw new ValidationError(`Failed to load plugin "${name}": ${error instanceof Error ? error.message : String(error)}`, configPath)
  }
}

export function resolvePlugins(value: unknown, configPath: string): LiquidifyPlugin[] {
  if (value === undefined) return []
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) {
    throw new ValidationError('Configuration plugins must be an array of strings.', configPath)
  }
  return value.map((name: string) => resolvePlugin(name, configPath))
}
