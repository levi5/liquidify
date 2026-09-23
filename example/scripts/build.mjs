import liquidify from '../../dist/index.js'
import { buildAssets, themeRoot } from './build-assets.mjs'
import { verifyBuild } from './verify-build.mjs'

process.chdir(themeRoot)

const builder = liquidify.makeLiquidifyBuilder(liquidify.ConfigLoader.load())
const errors = []
builder.on('error', (error) => errors.push(error))

try {
  await builder.build()
  // The alpha compiler emits recoverable errors without rejecting build().
  if (errors.length) throw new AggregateError(errors, 'Failed to compile theme components.')
  await buildAssets()
  await verifyBuild()
  console.log('Theme compiled with local Liquidify.')
} catch (error) {
  console.error(error)
  process.exitCode = 1
} finally {
  builder.disposeSync()
}
