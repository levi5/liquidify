export interface InitOptions {
  targetDir: string
  template: string
  force?: boolean
}

/** Keep legacy aliases compatible; the distribution currently ships one theme. */
export const normalizeTemplateName = (_templateName = 'theme'): string => 'theme'

export function parseInitArgs(argumentsList: string[]): InitOptions {
  let targetDir = '.'
  let template = 'theme'
  let force = false
  for (let index = 0; index < argumentsList.length; index++) {
    const argument = argumentsList[index]
    if (argument === '--force' || argument === '-f') force = true
    else if (argument === '--template' || argument === '-t') {
      if (argumentsList[index + 1] && !argumentsList[index + 1].startsWith('-')) template = argumentsList[++index]
    } else if (/^(--template|-t)=/.test(argument)) template = argument.slice(argument.indexOf('=') + 1) || template
    else if (!argument.startsWith('-')) targetDir = argument
  }
  return { targetDir, template: normalizeTemplateName(template), ...(force ? { force: true } : {}) }
}
