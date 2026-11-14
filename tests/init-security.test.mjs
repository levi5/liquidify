import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { copyTemplate } from '#dist/presentation/cli/commands/init.js'
import { createTemporaryDirectory } from '#tests/helpers/temp-directory.mjs'

test('force initialization still refuses source and destination symlinks', (context) => {
  const directory = createTemporaryDirectory('liquidify-init-security-')
  context.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const source = path.join(directory, 'source')
  const target = path.join(directory, 'target')
  const outside = path.join(directory, 'outside.txt')
  fs.mkdirSync(source)
  fs.mkdirSync(target)
  fs.writeFileSync(outside, 'protected')
  fs.symlinkSync(outside, path.join(source, 'link.txt'))
  assert.equal(copyTemplate(source, target, 'project', true).isLeft(), true)
  fs.unlinkSync(path.join(source, 'link.txt'))
  fs.writeFileSync(path.join(source, 'file.txt'), 'replacement')
  fs.symlinkSync(outside, path.join(target, 'file.txt'))
  assert.equal(copyTemplate(source, target, 'project', true).isLeft(), true)
  assert.equal(fs.readFileSync(outside, 'utf8'), 'protected')
})
