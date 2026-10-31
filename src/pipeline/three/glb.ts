/** Give each mesh a stable address without changing its geometry, textures, or transforms. */
export function indexMeshNodes(bytes: Uint8Array) {
  const buffer = Buffer.from(bytes)
  if (buffer.length < 20 || buffer.readUInt32LE(0) !== 0x46546c67 || buffer.readUInt32LE(4) !== 2 || buffer.readUInt32LE(8) !== buffer.length) {
    throw new Error("Provider output is not a valid GLB 2.0 file.")
  }
  const jsonLength = buffer.readUInt32LE(12)
  if (buffer.readUInt32LE(16) !== 0x4e4f534a || jsonLength + 20 > buffer.length) throw new Error("GLB has an invalid JSON chunk.")
  const document = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString("utf8"))
  if (document.extensionsRequired?.some((name: string) => ["KHR_draco_mesh_compression", "EXT_meshopt_compression", "KHR_texture_basisu"].includes(name))) {
    throw new Error("Generated GLB requires a compression decoder. Export an uncompressed GLB first.")
  }
  if ([...(document.buffers ?? []), ...(document.images ?? [])].some((entry: { uri?: string }) => entry.uri && !entry.uri.startsWith("data:"))) {
    throw new Error("Generated model must be self-contained; external resources are not supported.")
  }
  const nodes = document.nodes ?? []
  const entries: { node: string; label: string }[] = []
  const visited = new Set<number>()
  const visit = (index: number, ancestors: number[]) => {
    if (ancestors.includes(index)) throw new Error("Model contains a cyclic node hierarchy.")
    if (visited.has(index)) throw new Error("Model reuses a node in multiple parents.")
    visited.add(index)
    const node = nodes[index]
    if (!node) throw new Error("Model refers to a missing node.")
    if (node.skin !== undefined) throw new Error("Skinned models need a separate rig adapter before exploding.")
    if (node.mesh !== undefined) {
      if (ancestors.some(parent => nodes[parent].mesh !== undefined)) throw new Error("Nested mesh assemblies need review before automatic separation.")
      if (!document.meshes?.[node.mesh]) throw new Error("Model refers to a missing mesh.")
      entries.push({ node: `explode_mesh_${index}`, label: [node.name, document.meshes[node.mesh].name].filter(Boolean).join(" / ") || `Unnamed mesh ${index}` })
    }
    for (const child of node.children ?? []) visit(child, [...ancestors, index])
  }
  for (const root of document.scenes?.[document.scene ?? 0]?.nodes ?? []) visit(root, [])
  if (entries.length < 2) throw new Error("The model has fewer than two separable meshes. It cannot yet make an exploded explainer.")
  if (entries.length > 128) throw new Error("More than 128 meshes need assembly grouping before automatic narration.")
  nodes.forEach((node: { name?: string; mesh?: number }, index: number) => { node.name = node.mesh === undefined ? `explode_group_${index}` : `explode_mesh_${index}` })
  const json = Buffer.from(JSON.stringify(document))
  const padded = Buffer.alloc(Math.ceil(json.length / 4) * 4, 0x20); json.copy(padded)
  const tail = buffer.subarray(20 + jsonLength)
  const header = Buffer.alloc(20)
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4)
  header.writeUInt32LE(20 + padded.length + tail.length, 8)
  header.writeUInt32LE(padded.length, 12); header.writeUInt32LE(0x4e4f534a, 16)
  return { bytes: Buffer.concat([header, padded, tail]), entries }
}
