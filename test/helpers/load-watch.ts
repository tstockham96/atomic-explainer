import { readFileSync } from "node:fs"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"

/** Exercise the shipped mesh and animation data without requiring a GPU or DOM image decoder. */
export async function loadWatchGeometry() {
  const file = readFileSync("public/models/chronograph/watch.glb")
  const length = file.readUInt32LE(12)
  const json = JSON.parse(file.subarray(20, 20 + length).toString())
  const binStart = 20 + length
  const bin = file.subarray(binStart + 8, binStart + 8 + file.readUInt32LE(binStart))
  // Keep geometry, hierarchy, transforms, animations, and physical material scalars.
  // Texture decoding itself remains a browser integration concern.
  function removeTextures(value: Record<string, unknown>) {
    for (const key of Object.keys(value)) {
      if (/texture$/i.test(key)) delete value[key]
      else if (value[key] && typeof value[key] === "object") removeTextures(value[key] as Record<string, unknown>)
    }
  }
  for (const material of json.materials) removeTextures(material)
  delete json.images; delete json.textures
  const encoded = Buffer.from(JSON.stringify(json))
  const padded = Buffer.alloc(Math.ceil(encoded.length / 4) * 4, 0x20)
  encoded.copy(padded)
  const result = Buffer.alloc(12 + 8 + padded.length + 8 + bin.length)
  result.writeUInt32LE(0x46546c67, 0); result.writeUInt32LE(2, 4); result.writeUInt32LE(result.length, 8)
  result.writeUInt32LE(padded.length, 12); result.writeUInt32LE(0x4e4f534a, 16); padded.copy(result, 20)
  const offset = 20 + padded.length
  result.writeUInt32LE(bin.length, offset); result.writeUInt32LE(0x004e4942, offset + 4); bin.copy(result, offset + 8)
  return new GLTFLoader().parseAsync(result.buffer.slice(result.byteOffset, result.byteOffset + result.byteLength), "")
}
