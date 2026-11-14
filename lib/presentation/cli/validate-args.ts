const BOOLEAN_FLAGS = new Set([
  '--watch',
  '-w',
  '--force',
  '-f',
  '--quiet',
  '-q',
  '--no-banner',
  '--version',
  '-V',
  '--help',
  '-h',
  '--json',
  '--dry-run',
  '--verbose',
  '--profile',
  '--no-plugins',
  '--sourcemap',
])

export function validateCliArgs(argumentsList: string[]): void {
  const isInit = argumentsList[0] === 'init'
  const isGenerate = argumentsList[0] === 'generate'
  for (let index = 0; index < argumentsList.length; index++) {
    const argument = argumentsList[index]
    if (index === 0 && ['init', 'build', 'check', 'doctor', 'generate', 'theme-check'].includes(argument)) continue
    if (BOOLEAN_FLAGS.has(argument)) continue
    if (['--config', '--concurrency', '--mode'].includes(argument) || (isInit && ['--template', '-t'].includes(argument))) {
      const value = argumentsList[++index]
      if (!value?.trim() || value.startsWith('-')) throw new Error(`Option ${argument} requires a value.`)
      continue
    }
    if (/^--(config|concurrency|mode)=/.test(argument) || (isInit && /^(--template|-t)=/.test(argument))) {
      if (!argument.slice(argument.indexOf('=') + 1).trim()) throw new Error(`Option ${argument.split('=')[0]} requires a value.`)
      continue
    }
    if ((isInit || isGenerate) && !argument.startsWith('-')) continue
    throw new Error(`Unknown argument "${argument}". Run liquidify --help for available options.`)
  }
}
