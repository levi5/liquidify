import fs from 'node:fs'
import { promises as filesystem } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'

export function writeAtomicFileSync(filename: string, content: string, assertSafe: () => void): void {
  assertSafe()
  const temporary = path.join(path.dirname(filename), `.liquidify-${randomUUID()}.tmp`)
  const mode = fs.existsSync(filename) ? fs.lstatSync(filename).mode & 0o777 : 0o666
  let descriptor: number | undefined
  let created = false
  try {
    descriptor = fs.openSync(temporary, 'wx', mode)
    created = true
    fs.writeFileSync(descriptor, content, 'utf8')
    fs.fsyncSync(descriptor)
    fs.closeSync(descriptor)
    descriptor = undefined
    assertSafe()
    fs.renameSync(temporary, filename)
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor)
    if (created && fs.existsSync(temporary)) fs.unlinkSync(temporary)
  }
}

export async function writeAtomicFile(filename: string, content: string, assertSafe: () => void): Promise<void> {
  assertSafe()
  const temporary = path.join(path.dirname(filename), `.liquidify-${randomUUID()}.tmp`)
  const existing = await filesystem.lstat(filename).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error
    return undefined
  })
  const descriptor = await filesystem.open(temporary, 'wx', existing ? existing.mode & 0o777 : 0o666)
  try {
    await descriptor.writeFile(content, 'utf8')
    await descriptor.sync()
    await descriptor.close()
    assertSafe()
    await filesystem.rename(temporary, filename)
  } finally {
    await descriptor.close()
    await filesystem.unlink(temporary).catch((error: NodeJS.ErrnoException) => {
      if (error.code !== 'ENOENT') throw error
    })
  }
}
