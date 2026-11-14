import { replaceLiquidTags } from '@adapters/parsers/babel/preprocessing/replace-liquid-tags'
import { replaceLiquidOutputs } from '@adapters/parsers/babel/preprocessing/replace-liquid-outputs'
import { replaceLiquidPipes } from '@adapters/parsers/babel/preprocessing/replace-liquid-pipes'

export function preprocessLiquidDelimiters(source: string): string {
  return replaceLiquidTags(replaceLiquidOutputs(source))
}

export function preprocessLiquidExpressions(source: string): string {
  return replaceLiquidPipes(preprocessLiquidDelimiters(source))
}
