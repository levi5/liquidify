import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { pathToFileURL } from 'node:url'

const repository = path.resolve(process.argv[2] ?? '.')
const { makeLiquidifyBuilder } = await import(pathToFileURL(path.join(repository, 'dist/index.js')))
const { SilentLogger } = await import(pathToFileURL(path.join(repository, 'dist/shared/logger.js')))
const example = path.join(repository, 'resources/templates/theme')
const temporaryRoot = fs.existsSync('/tmp/opencode') ? '/tmp/opencode' : os.tmpdir()
const output = fs.mkdtempSync(path.join(temporaryRoot, 'liquidify-benchmark-'))
const previousDirectory = process.cwd()
process.chdir(example)
const builder = makeLiquidifyBuilder({ componentsDir: path.join(example, 'src/app'), output }, { logger: new SilentLogger() })
const durations = []
try {
  for (let iteration = 0; iteration < 6; iteration++) {
    const started = performance.now()
    await builder.build()
    durations.push(performance.now() - started)
  }
  const warm = durations.slice(1).sort((first, second) => first - second)
  console.log(JSON.stringify({
    node: process.version,
    coldMs: durations[0],
    warmMedianMs: warm[Math.floor(warm.length / 2)],
    warmSamplesMs: durations.slice(1),
    memoryRssMiB: process.memoryUsage().rss / 1024 / 1024,
  }, null, 2))
} finally {
  await builder.dispose()
  process.chdir(previousDirectory)
  fs.rmSync(output, { recursive: true, force: true })
}
