import * as T from "three"

/** Frustum checks miss scenery in front of a lesson. Center rays can also pass
 * straight through hollow/disconnected assemblies, so probe a few actual mesh
 * triangle centers too. Report the anatomy hit first, not the intended target.
 * This is visibility evidence, not certification of full silhouettes or detail. */
export function unobscuredSubjects(
  camera: T.Camera,
  subjects: Record<string, T.Object3D>,
  scenery?: T.Object3D,
) {
  camera.updateMatrixWorld(true)
  const entries = Object.entries(subjects),
    roots = entries.map(([, node]) => node)
  roots.forEach((node) => node.updateWorldMatrix(true, true))
  scenery?.updateWorldMatrix(true, true)
  const obstacles = scenery?.visible ? [...roots, scenery] : roots
  const ray = new T.Raycaster(),
    point = new T.Vector3(),
    box = new T.Box3(),
    seen = new Set<string>()
  const ids = new Map(entries.map(([id, node]) => [node, id]))
  const probe = (world: T.Vector3) => {
    point.copy(world).project(camera)
    if (Math.abs(point.x) > 1 || Math.abs(point.y) > 1 || point.z < -1 || point.z > 1) return
    ray.setFromCamera(new T.Vector2(point.x, point.y), camera)
    const hit = ray.intersectObjects(obstacles, true).find((h) => {
      for (let p: T.Object3D | null = h.object; p; p = p.parent) if (!p.visible) return false
      return true
    })
    if (hit)
      for (let current: T.Object3D | null = hit.object; current; current = current.parent) {
        const id = ids.get(current)
        if (id) {
          seen.add(id)
          break
        }
      }
  }
  for (const [id, node] of entries) {
    if (!node.visible) continue
    probe(box.setFromObject(node).getCenter(new T.Vector3()))
    if (seen.has(id)) continue
    const meshes: T.Mesh[] = []
    node.traverseVisible((o) => {
      if (o instanceof T.Mesh) meshes.push(o)
    })
    for (let n = 0; n < Math.min(meshes.length, 6) && !seen.has(id); n++) {
      const mesh = meshes[Math.floor((n * meshes.length) / Math.min(meshes.length, 6))]!,
        g = mesh.geometry,
        p = g.getAttribute("position")
      if (!p || p.count < 3) continue
      const center = new T.Vector3()
      for (let i = 0; i < 3; i++)
        center.add(new T.Vector3().fromBufferAttribute(p, g.index ? g.index.getX(i) : i))
      probe(center.multiplyScalar(1 / 3).applyMatrix4(mesh.matrixWorld))
    }
  }
  return [...seen]
}
