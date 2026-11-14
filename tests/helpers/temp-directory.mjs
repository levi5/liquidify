import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export function createTemporaryDirectory(prefix) {
  const root = process.env.LIQUIDIFY_TEST_TMPDIR ?? (fs.existsSync('/tmp/opencode') ? '/tmp/opencode' : os.tmpdir())
  fs.mkdirSync(root, { recursive: true })
  return fs.mkdtempSync(path.join(root, prefix))
}
