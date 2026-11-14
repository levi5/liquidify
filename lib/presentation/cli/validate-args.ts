const BOOLEAN_FLAGS = new Set(['--watch', '-w', '--force', '-f', '--quiet', '-q', '--no-banner', '--version', '-V', '--help', '-h'])

export function validateCliArgs(argumentsList: string[]): void {
  const isInit = argumentsList[0] === 'init'
  for (let index = 0; index < argumentsList.length; index++) {
    const argument = argumentsList[index]
    if (index === 0 && ['init', 'build'].includes(argument)) continue
    if (BOOLEAN_FLAGS.has(argument)) continue
    if (argument === '--config' || (isInit && ['--template', '-t'].includes(argument))) {
      const value = argumentsList[++index]
      if (!value?.trim() || value.startsWith('-')) throw new Error(`Option ${argument} requires a value.`)
      continue
    }
    if (argument.startsWith('--config=') || (isInit && /^(--template|-t)=/.test(argument))) {
      if (!argument.slice(argument.indexOf('=') + 1).trim()) throw new Error(`Option ${argument.split('=')[0]} requires a value.`)
      continue
    }
    if (isInit && !argument.startsWith('-')) continue
    throw new Error(`Unknown argument "${argument}". Run liquidify --help for available options.`)
  }
}
