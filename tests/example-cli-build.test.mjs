import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { createTemporaryDirectory } from './helpers/temp-directory.mjs'
import { runCli } from './helpers/cli-project.mjs'

test('initialized example theme builds and checks through the public CLI with its built-in plugin', { timeout: 30000 }, (context) => {
  const directory = createTemporaryDirectory('liquidify-example-cli-')
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const initialization = runCli(directory, ['init', 'example-store', '--quiet'])
  assert.equal(initialization.status, 0, initialization.stderr)
  const project = path.join(directory, 'example-store')
  // Reuse installed dependencies; this test neither installs packages nor contacts Shopify.
  fs.symlinkSync(path.resolve('node_modules'), path.join(project, 'node_modules'), 'junction')
  const build = runCli(project, ['build', '--force', '--json'])
  assert.equal(build.status, 0, build.stdout + build.stderr)
  const report = JSON.parse(build.stdout)
  assert.equal(report.status, 'success')
  assert.ok(report.outputFiles.length > 60)
  assert.match(fs.readFileSync(path.join(project, 'sections/header.liquid'), 'utf8'), /{% schema %}/)
  assert.ok(fs.statSync(path.join(project, 'assets/react-runtime.js')).size > 10000)
  const manifestBefore = fs.readFileSync(path.join(project, '.liquidify-manifest.json'), 'utf8')
  const check = runCli(project, ['check', '--json'])
  assert.equal(check.status, 0, check.stdout + check.stderr)
  assert.equal(JSON.parse(check.stdout).status, 'success')
  assert.equal(fs.readFileSync(path.join(project, '.liquidify-manifest.json'), 'utf8'), manifestBefore)
})
