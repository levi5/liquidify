const fs = require('fs')
const path = require('path')

const filePath = path.join(__dirname, 'lib/infra/adapters/parsers/babel/ASTParser.ts')
let content = fs.readFileSync(filePath, 'utf8')

// Find and fix the replaceLiquidOutputs function
// Move boundary tracking AFTER the {{ block

// Pattern to match the boundary tracking block that comes BEFORE the strings
const oldOrder = `    const ch = source[i]
    // track boundary: start of line, >, %}, or newline
    if (ch === '>' || (ch === '%' && i + 1 < n && source[i + 1] === '}')) {
      boundaryCandidate = true
    } else if (ch === '\\n') {
      boundaryCandidate = true
    } else if (ch !== ' ' && ch !== '\\t' && ch !== '\\r') {
      boundaryCandidate = false
    }
    // strings`

// New order: {{ check first, then strings/comments, THEN boundary
const newOrder = `    const ch = source[i]
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
          if (escaped) { escaped = false }
          else if (c === '\\\\') { escaped = true }
          else if (c === stringQuote) { inString = false }
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
        const isLiquid = /[|]/.test(trimmed) || /^[a-z_$][\\w$]*(\\s*[|.])/.test(trimmed)
        if (isLiquid) {
          const fullOutput = '{{' + outputBody + '}}'
          out += \`{\${JSON.stringify(fullOutput)}}\`
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
    } else if (ch === '\\n') {
      boundaryCandidate = true
    } else if (ch !== ' ' && ch !== '\\t' && ch !== '\\r') {
      boundaryCandidate = false
    }
    // strings`

if (content.includes(oldOrder)) {
  content = content.replace(oldOrder, newOrder)
  fs.writeFileSync(filePath, content)
  console.log('Fixed!')
} else {
  console.log('Pattern not found - trying alternate...')
  // Try alternate matching with different whitespace
}

const debugContent = fs.readFileSync(filePath, 'utf8')
// Debug: print the function to verify
const idx = debugContent.indexOf('const replaceLiquidOutputs = (source: string): string => {')
if (idx >= 0) {
  console.log('Function found at index', idx)
  console.log(debugContent.substring(idx, idx + 500))
}