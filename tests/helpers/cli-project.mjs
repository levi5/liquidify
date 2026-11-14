import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

export const cliExecutable = path.resolve('dist/presentation/cli/index.js')

export function createCliProject(context) {
  const directory = fs.mkdtempSync('/tmp/opencode/liquidify-cli-')
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  fs.mkdirSync(path.join(directory, 'components'))
  fs.writeFileSync(path.join(directory, 'components/Card.tsx'), '"use snippets"; export default function Card() { return <div>Card</div> }')
  fs.writeFileSync(path.join(directory, 'liquidify.config.json'), JSON.stringify({ componentsDir: 'components', output: 'out' }))
  return directory
}

export function runCli(directory, argumentsList, environment = process.env) {
  return spawnSync(process.execPath, [cliExecutable, ...argumentsList], {
    cwd: directory,
    encoding: 'utf8',
    timeout: 15000,
    env: environment,
  })
}
