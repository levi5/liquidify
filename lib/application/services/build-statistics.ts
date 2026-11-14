import path from 'node:path'
import type { IFileReader } from '@core/protocols/file-system'
import type { PluginStats } from '@core/protocols/plugin'
import type { DirectiveReader } from '@core/protocols/project-compilation'

export function collectBuildStatistics(files: string[], fileSystem: IFileReader, scanner: DirectiveReader): PluginStats {
  const statistics: PluginStats = { total: files.length, tsx: 0, jsx: 0, ts: 0, js: 0, byDirective: {} }
  for (const file of files) {
    const extension = path.extname(file).slice(1) as 'tsx' | 'jsx' | 'ts' | 'js'
    statistics[extension]++
    const directives = scanner.scan(fileSystem.readFileSync(file), file)
    const labels = [
      directives.isReact && 'use react',
      directives.isDom && 'use dom',
      directives.isSnippet && 'use snippets',
      directives.isSections && 'use sections',
    ].filter(Boolean)
    const label = labels.length ? labels.join(', ') : 'none'
    statistics.byDirective[label] = (statistics.byDirective[label] ?? 0) + 1
  }
  return statistics
}
