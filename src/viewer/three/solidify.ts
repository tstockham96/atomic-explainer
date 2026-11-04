import * as THREE from "three"

/** Give an explicitly opted-in planar cover a thin, beveled edge, using its own boundary. */
export function solidifyCover(geometry: THREE.BufferGeometry, thickness: number) {
  geometry.computeBoundingBox()
  const bounds = geometry.boundingBox!
  const size = bounds.getSize(new THREE.Vector3())
  if (size.z > 0.0001 || size.x <= 0 || size.y <= 0)
    throw new Error("Cover solidification expects a planar XY surface.")
  const position = geometry.getAttribute("position")
  const points = new Map<string, THREE.Vector2>()
  const key = (i: number) => {
    const x = position.getX(i),
      y = position.getY(i)
    const value = `${x.toFixed(5)},${y.toFixed(5)}`
    points.set(value, new THREE.Vector2(x, y))
    return value
  }
  const edges = new Map<string, { a: string; b: string; count: number }>()
  const count = geometry.index?.count ?? position.count
  const index = (i: number) => geometry.index?.getX(i) ?? i
  for (let i = 0; i < count; i += 3) {
    const triangle = [key(index(i)), key(index(i + 1)), key(index(i + 2))]
    for (let j = 0; j < 3; j++) {
      const a = triangle[j]!,
        b = triangle[(j + 1) % 3]!
      const id = [a, b].sort().join("|")
      const edge = edges.get(id)
      if (edge) edge.count++
      else edges.set(id, { a, b, count: 1 })
    }
  }
  const neighbors = new Map<string, string[]>()
  for (const { a, b, count } of edges.values())
    if (count === 1) {
      neighbors.set(a, [...(neighbors.get(a) ?? []), b])
      neighbors.set(b, [...(neighbors.get(b) ?? []), a])
    }
  if (neighbors.size < 3 || [...neighbors.values()].some((list) => list.length !== 2))
    throw new Error("The cover must have one closed boundary.")
  const first = neighbors.keys().next().value!
  const outline: THREE.Vector2[] = []
  let current = first,
    previous = ""
  do {
    outline.push(points.get(current)!)
    const next = neighbors.get(current)!.find((value) => value !== previous)!
    previous = current
    current = next
    if (outline.length > neighbors.size) throw new Error("Invalid cover boundary.")
  } while (current !== first)
  if (outline.length !== neighbors.size)
    throw new Error("Cover holes require a separately authored solid mesh.")
  const shape = new THREE.Shape(outline)
  const bevel = thickness * 0.18
  const solid = new THREE.ExtrudeGeometry(shape, {
    depth: thickness - bevel * 2,
    steps: 1,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 32,
  })
  solid.translate(0, 0, bounds.min.z - thickness + bevel)
  return solid
}
