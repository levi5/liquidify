import { _match, _try } from 'funcio'
import { LiquidifyError } from '../../../../core/errors/liquidify-error'
import { parse, parseExpression } from '@babel/parser'
import type { File } from '@babel/types'

const LIQUID_PIPE_PATTERN =
  /("(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|`(?:\\[\s\S]|[^`\\])*`|\/\*[\s\S]*?\*\/|\/\/[^\r\n]*)|(\{([^{}]*?[^|&]\s*\|\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:[^{}]*?)\})/g

const LIQUID_TAGS = new Set([
  'assign',
  'capture',
  'case',
  'comment',
  'decrement',
  'echo',
  'elsif',
  'else',
  'endcapture',
  'endcase',
  'endcomment',
  'endfor',
  'endform',
  'endif',
  'endpaginate',
  'endraw',
  'endstyle',
  'endtablerow',
  'for',
  'form',
  'if',
  'ifchanged',
  'include',
  'increment',
  'layout',
  'liquid',
  'paginate',
  'raw',
  'render',
  'section',
  'style',
  'tablerow',
  'unless',
  'when',
  'schema',
  'stylesheet',
  'endstylesheet',
  'javascript',
  'endjavascript',
  'layout',
  'endlayout',
  'endfor',
  'endcase',
])

function isValidJsExpr(code: string): boolean {
  return _try
    .sync(() => parseExpression(code, { plugins: ['jsx', 'typescript'] }))
    .match({
      right: () => true,
      left: () => false,
    })
}

export function preprocessLiquidDelimiters(source: string): string {
  return replaceLiquidTags(replaceLiquidOutputs(source))
}

export function preprocessLiquidExpressions(source: string): string {
  return replaceLiquidPipes(preprocessLiquidDelimiters(source))
}

const replaceLiquidTags = (source: string): string => {
  let out = ''
  let i = 0
  const n = source.length
  while (i < n) {
    const ch = source[i]
    // string literals and template literals
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch
      out += ch
      i++
      let escaped = false
      while (i < n) {
        const c = source[i]
        out += c
        i++
        if (escaped) {
          escaped = false
        } else if (c === '\\') {
          escaped = true
        } else if (c === quote) {
          break
        }
      }
      continue
    }
    // comments
    if (ch === '/' && i + 1 < n) {
      const next = source[i + 1]
      if (next === '/' || next === '*') {
        out += ch + next
        i += 2
        if (next === '/') {
          while (i < n && source[i] !== '\n' && source[i] !== '\r') {
            out += source[i]
            i++
          }
        } else {
          while (i + 1 < n && !(source[i] === '*' && source[i + 1] === '/')) {
            out += source[i]
            i++
          }
          if (i + 1 < n) {
            out += source[i] + source[i + 1]
            i += 2
          }
        }
        continue
      }
    }
    // {% tag %}
    if (ch === '{' && i + 1 < n && source[i + 1] === '%') {
      const tagStart = i
      i += 2
      // find end %}
      let tagBody = ''
      let inString = false
      let stringQuote = ''
      let escaped = false
      while (i + 1 < n) {
        const c = source[i]
        const next = source[i + 1]
        if (inString) {
          tagBody += c
          i++
          if (escaped) {
            escaped = false
          } else if (c === '\\') {
            escaped = true
          } else if (c === stringQuote) {
            inString = false
          }
        } else if (c === '"' || c === "'") {
          inString = true
          stringQuote = c
          tagBody += c
          i++
        } else if (c === '%' && next === '}') {
          break
        } else {
          tagBody += c
          i++
        }
      }
      if (i + 1 < n && source[i] === '%' && source[i + 1] === '}') {
        // parse tag name from body
        const trimmed = tagBody.trim()
        const firstSpace = trimmed.indexOf(' ')
        const tagName = firstSpace >= 0 ? trimmed.slice(0, firstSpace) : trimmed
        if (LIQUID_TAGS.has(tagName)) {
          const fullTag = '{%' + tagBody + '%}'
          out += `{${JSON.stringify(fullTag)}}`
          i += 2
          continue
        }
      }
      // not a valid liquid tag, backtrack
      out += '{%'
      i = tagStart + 2
      continue
    }
    out += ch
    i++
  }
  return out
}

const replaceLiquidOutputs = (source: string): string => {
  let out = ''
  let i = 0
  const n = source.length
  let boundaryCandidate = true // true at start or after boundary chars
  while (i < n) {
    const ch = source[i]
    // FIRST: check for {{ at boundary - must happen BEFORE boundary reset
    if (boundaryCandidate && ch === '{' && i + 1 < n && source[i + 1] === '{') {
      const start = i
      i += 2
      let outputBody = ''
      let depth = 0
      let inString = false
      let stringQuote = ''
      let escaped = false
      while (i < n) {
        const c = source[i]
        const next = i + 1 < n ? source[i + 1] : ''
        if (inString) {
          outputBody += c
          i++
          if (escaped) {
            escaped = false
          } else if (c === '\\') {
            escaped = true
          } else if (c === stringQuote) {
            inString = false
          }
        } else if (c === '"' || c === "'") {
          inString = true
          stringQuote = c
          outputBody += c
          i++
        } else if (c === '{' && next === '{') {
          depth++
          outputBody += '{'
          i++
        } else if (c === '}' && next === '}') {
          if (depth > 0) {
            depth--
            outputBody += '}'
            i++
          } else {
            break
          }
        } else {
          outputBody += c
          i++
        }
      }
      if (i + 1 < n && source[i] === '}' && source[i + 1] === '}') {
        const trimmed = outputBody.trim()
        const isLiquid = trimmed.length > 0 && (/[|.[]/.test(trimmed) || /^[a-zA-Z_$][\w$]*$/.test(trimmed))
        if (isLiquid) {
          const fullOutput = '{{' + outputBody + '}}'
          out += `{${JSON.stringify(fullOutput)}}`
          i += 2
          boundaryCandidate = false
          continue
        }
      }
      // not liquid, backtrack
      out += '{{'
      i = start + 2
      boundaryCandidate = false
      continue
    }
    // THEN: update boundary tracking
    if (ch === '>' || (ch === '%' && i + 1 < n && source[i + 1] === '}')) {
      boundaryCandidate = true
    } else if (ch === '\n') {
      boundaryCandidate = true
    } else if (ch !== ' ' && ch !== '\t' && ch !== '\r' && ch !== '}') {
      boundaryCandidate = false
    }
    // strings
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch
      out += ch
      i++
      let escaped = false
      while (i < n) {
        const c = source[i]
        out += c
        i++
        if (escaped) {
          escaped = false
        } else if (c === '\\') {
          escaped = true
        } else if (c === quote) {
          break
        }
      }
      boundaryCandidate = false
      continue
    }
    // comments
    if (ch === '/' && i + 1 < n) {
      const next = source[i + 1]
      if (next === '/' || next === '*') {
        out += ch + next
        i += 2
        if (next === '/') {
          while (i < n && source[i] !== '\n' && source[i] !== '\r') {
            out += source[i]
            i++
          }
        } else {
          while (i + 1 < n && !(source[i] === '*' && source[i + 1] === '/')) {
            out += source[i]
            i++
          }
          if (i + 1 < n) {
            out += source[i] + source[i + 1]
            i += 2
          }
        }
        boundaryCandidate = false
        continue
      }
    }
    // {{ ... }}
    if (boundaryCandidate && ch === '{' && i + 1 < n && source[i + 1] === '{') {
      const start = i
      i += 2
      let outputBody = ''
      let depth = 0
      let inString = false
      let stringQuote = ''
      let escaped = false
      while (i < n) {
        const c = source[i]
        const next = i + 1 < n ? source[i + 1] : ''
        if (inString) {
          outputBody += c
          i++
          if (escaped) {
            escaped = false
          } else if (c === '\\') {
            escaped = true
          } else if (c === stringQuote) {
            inString = false
          }
        } else if (c === '"' || c === "'") {
          inString = true
          stringQuote = c
          outputBody += c
          i++
        } else if (c === '{' && next === '{') {
          depth++
          outputBody += '{'
          i++
        } else if (c === '}' && next === '}') {
          if (depth > 0) {
            depth--
            outputBody += '}'
            i++
          } else {
            // found closing }}
            break
          }
        } else {
          outputBody += c
          i++
        }
      }
      if (i + 1 < n && source[i] === '}' && source[i + 1] === '}') {
        // check if the body looks like Liquid (not valid JS)
        const trimmed = outputBody.trim()
        const isLiquid = trimmed.length > 0 && (/[|.[]/.test(trimmed) || /^[a-zA-Z_$][\w$]*$/.test(trimmed))
        if (isLiquid) {
          const fullOutput = '{{' + outputBody + '}}'
          out += `{${JSON.stringify(fullOutput)}}`
          i += 2
          boundaryCandidate = false
          continue
        }
      }
      // not liquid, backtrack
      out += '{{'
      i = start + 2
      boundaryCandidate = false
      continue
    }
    out += ch
    i++
  }
  return out
}

const replaceLiquidPipes = (source: string): string =>
  source.replace(
    LIQUID_PIPE_PATTERN,
    (_matched, strOrComment, fullBraces, inner) =>
      _match(strOrComment !== undefined)
        .with(true, () => strOrComment as string)
        .with(false, () => preprocessBraces(fullBraces as string, inner as string))
        .exec() as string,
  )

function preprocessBraces(fullBraces: string, inner: string): string {
  const trimmed = inner.trim()
  return _match(true)
    .with((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'")), () => fullBraces)
    .with(isValidJsExpr(inner), () => fullBraces)
    .with(true, () => `{${JSON.stringify(unwrapTemplate(trimmed))}}`)
    .exec() as string
}

function unwrapTemplate(trimmed: string): string {
  return _match(trimmed.startsWith('`') && trimmed.endsWith('`'))
    .with(true, () => trimmed.slice(1, -1).trim())
    .with(false, () => trimmed)
    .exec() as string
}

export class ASTParser {
  public parse(source: string, filePath?: string): File {
    const delimited = preprocessLiquidDelimiters(source)
    return _try
      .sync(() =>
        parse(delimited, {
          sourceType: 'module',
          plugins: ['jsx', 'typescript'],
        }),
      )
      .match({
        right: (ast) => ast,
        left: () => this.parsePreprocessed(delimited, filePath),
      })
  }

  private parsePreprocessed(source: string, filePath?: string): File {
    return _try
      .sync(() =>
        parse(replaceLiquidPipes(source), {
          sourceType: 'module',
          plugins: ['jsx', 'typescript'],
        }),
      )
      .match({
        right: (ast) => ast,
        left: (error) => {
          throw new LiquidifyError(`Failed to parse JavaScript/TypeScript: ${error.message}`, filePath, this.errorLocation(error))
        },
      })
  }

  private errorLocation(error: unknown): { line: number; column: number } | undefined {
    const loc = (error as { loc?: { line: number; column: number } }).loc
    return _match(loc === undefined)
      .with(true, () => undefined)
      .with(false, () => ({ line: (loc as { line: number }).line, column: (loc as { column: number }).column + 1 }))
      .exec() as { line: number; column: number } | undefined
  }
}
