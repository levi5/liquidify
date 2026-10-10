function replaceLiquidOutputs(source) {
  let out = ''
  let i = 0
  const n = source.length
  let boundaryCandidate = true
  while (i < n) {
    const ch = source[i]
    console.log(`i=${i} ch=${JSON.stringify(ch)} boundary=${boundaryCandidate}`)
    if (ch === '>' || (ch === '%' && i + 1 < n && source[i + 1] === '}')) {
      boundaryCandidate = true
      console.log('  -> boundary=true from > or %}')
    } else if (ch === '\n') {
      boundaryCandidate = true
      console.log('  -> boundary=true from newline')
    } else if (ch !== ' ' && ch !== '\t' && ch !== '\r') {
      boundaryCandidate = false
      console.log('  -> boundary=false from non-whitespace')
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch
      out += ch
      i++
      let escaped = false
      while (i < n) {
        const c = source[i]
        out += c
        i++
        if (escaped) { escaped = false }
        else if (c === '\\') { escaped = true }
        else if (c === quote) { break }
      }
      boundaryCandidate = false
      continue
    }
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
          if (i + 1 < n) { out += source[i] + source[i + 1]; i += 2 }
        }
        boundaryCandidate = false
        continue
      }
    }
    if (boundaryCandidate && ch === '{' && i + 1 < n && source[i + 1] === '{') {
      console.log('FOUND {{ at i=' + i);
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
          else if (c === '\\') { escaped = true }
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
        console.log('FOUND CLOSING }}');
        const trimmed = outputBody.trim()
        const isLiquid = /[|]/.test(trimmed) || /^[a-z_$][\w$]*(\s*[|.])/.test(trimmed)
        console.log('isLiquid:', isLiquid, 'trimmed:', trimmed);
        if (isLiquid) {
          const fullOutput = '{{' + outputBody + '}}'
          out += '{' + JSON.stringify(fullOutput) + '}'
          i += 2
          boundaryCandidate = false
          continue
        }
      }
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

const src = "return (\n  <p>{{ x }}</p>\n)";
console.log('src:', JSON.stringify(src));
console.log('result:', JSON.stringify(replaceLiquidOutputs(src)));