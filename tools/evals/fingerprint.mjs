import { readdir, readFile } from "node:fs/promises"
import { createHash } from "node:crypto"
import path from "node:path"
// Include imported rendering helpers and locked dependencies, not just the page.
export async function experienceFingerprint() {
  const files = ["package-lock.json"]
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name)
      if (entry.isDirectory()) await visit(file)
      else if (/\.(ts|tsx|css|html|mjs)$/.test(file)) files.push(file)
    }
  }
  await visit("src")
  await visit("tools/murph-study")
  const hash = createHash("sha256")
  for (const file of files.sort())
    hash
      .update(file.split(path.sep).join("/"))
      .update("\0")
      .update(await readFile(file))
      .update("\0")
  return hash.digest("hex")
}
