import { readFile } from "node:fs/promises"
import path from "node:path"

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
}

export async function readPhoto(photoPath: string) {
  const resolved = path.resolve(photoPath)
  const extension = path.extname(resolved).toLowerCase()
  const mediaType = TYPES[extension]
  if (!mediaType) {
    throw new Error(`Unsupported photo type "${extension || "(none)"}". Use jpg, png, webp, or gif.`)
  }
  const bytes = new Uint8Array(await readFile(resolved))
  if (bytes.byteLength === 0) throw new Error(`Photo is empty: ${resolved}`)
  return { bytes, mediaType, resolved }
}
