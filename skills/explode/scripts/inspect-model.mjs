import { readFile } from "node:fs/promises"
import path from "node:path"

// Read-only inventory. No model download, conversion, or provider calls.
try {
  if (process.argv.length !== 3) throw new Error("Usage: node inspect-model.mjs /path/to/model.glb")
  const file = path.resolve(process.argv[2])
  const bytes = await readFile(file)
  if (bytes.length < 20 || bytes.readUInt32LE(0) !== 0x46546c67 || bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) throw new Error("Not a valid GLB 2.0 file.")
  const length = bytes.readUInt32LE(12)
  if (bytes.readUInt32LE(16) !== 0x4e4f534a || length + 20 > bytes.length) throw new Error("Invalid GLB JSON chunk.")
  const document = JSON.parse(bytes.subarray(20, 20 + length).toString("utf8"))
  const nodes = document.nodes ?? []
  const warnings = []
  const meshes = []
  const visited = new Set()
  const names = new Set()
  function visit(index, parents) {
    if (visited.has(index)) throw new Error("Repeated or cyclic node reference.")
    visited.add(index)
    const node = nodes[index]
    if (!node) throw new Error("Missing node reference.")
    if (node.mesh !== undefined) {
      const mesh = document.meshes?.[node.mesh]
      if (!mesh) throw new Error("Missing mesh reference.")
      if (!node.name || names.has(node.name)) warnings.push(`Node ${index} needs a unique name for direct viewer mapping.`)
      if (node.name) names.add(node.name)
      if (parents.some(parent => nodes[parent].mesh !== undefined)) warnings.push(`Node ${index} is nested under another mesh; review assembly grouping.`)
      meshes.push({ index, node: node.name ?? null, mesh: mesh.name ?? null, parents, primitives: mesh.primitives?.length ?? 0, skinned: node.skin !== undefined })
    }
    for (const child of node.children ?? []) visit(child, [...parents, index])
  }
  for (const root of document.scenes?.[document.scene ?? 0]?.nodes ?? []) visit(root, [])
  const externalResources = [...(document.buffers ?? []), ...(document.images ?? [])].flatMap(item => item.uri && !item.uri.startsWith("data:") ? [item.uri] : [])
  if (meshes.length < 2) warnings.push("Fewer than two mesh nodes: no separately addressable multipart assembly is established.")
  if (externalResources.length) warnings.push("External resources must be embedded for a self-contained export.")
  if (meshes.some(mesh => mesh.skinned)) warnings.push("Skinned geometry needs rig-aware assembly handling.")
  console.log(JSON.stringify({ file, bytes: bytes.length, meshNodes: meshes.length, meshes, requiredExtensions: document.extensionsRequired ?? [], externalResources, warnings, visualQuality: "Not evaluated; inspect actual renders." }, null, 2))
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
}
