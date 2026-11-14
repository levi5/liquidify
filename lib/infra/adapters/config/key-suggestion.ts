function editDistance(sourceKey: string, candidateKey: string): number {
  let previousRow = Array.from({ length: candidateKey.length + 1 }, (_, candidateIndex) => candidateIndex)
  for (let sourceIndex = 1; sourceIndex <= sourceKey.length; sourceIndex++) {
    const currentRow = [sourceIndex]
    for (let candidateIndex = 1; candidateIndex <= candidateKey.length; candidateIndex++) {
      currentRow[candidateIndex] = Math.min(
        previousRow[candidateIndex] + 1,
        currentRow[candidateIndex - 1] + 1,
        previousRow[candidateIndex - 1] + (sourceKey[sourceIndex - 1] === candidateKey[candidateIndex - 1] ? 0 : 1),
      )
    }
    previousRow = currentRow
  }
  return previousRow[candidateKey.length]
}

export function configurationKeySuggestion(unknownKey: string, allowedKeys: Iterable<string>): string {
  if (unknownKey.length > 128) return ''
  let closestKey: string | undefined
  let shortestDistance = Number.POSITIVE_INFINITY
  for (const candidateKey of allowedKeys) {
    const distance = editDistance(unknownKey, candidateKey)
    if (distance < shortestDistance) {
      shortestDistance = distance
      closestKey = candidateKey
    }
  }
  return closestKey !== undefined && shortestDistance <= Math.max(2, Math.floor(unknownKey.length / 2))
    ? ` Did you mean "${closestKey}"?`
    : ''
}
