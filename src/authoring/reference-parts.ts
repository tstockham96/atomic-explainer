import * as T from "three"

/** Trace a measured/observed outline, retaining actual notches and openings.
 * The caller owns scale/evidence. This creates geometry, not new observations. */
export function contourPlate(
  points: [number, number][],
  depth: number,
  material: T.Material,
  holes: { x: number; y: number; r: number }[] = [],
  bevel = 0.08,
) {
  const shape = new T.Shape(points.map((p) => new T.Vector2(...p)))
  shape.closePath()
  for (const h of holes) {
    const path = new T.Path()
    path.absarc(h.x, h.y, h.r, 0, Math.PI * 2, true)
    shape.holes.push(path)
  }
  const geometry = new T.ExtrudeGeometry(shape, {
    depth,
    steps: 1,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 2,
    curveSegments: 24,
  })
  return new T.Mesh(geometry, material)
}
export function roundedPlate(
  width: number,
  height: number,
  depth: number,
  radius: number,
  material: T.Material,
) {
  const s = new T.Shape(),
    x = -width / 2,
    y = -height / 2,
    r = Math.min(radius, width / 2, height / 2)
  s.moveTo(x + r, y)
  s.lineTo(x + width - r, y)
  s.quadraticCurveTo(x + width, y, x + width, y + r)
  s.lineTo(x + width, y + height - r)
  s.quadraticCurveTo(x + width, y + height, x + width - r, y + height)
  s.lineTo(x + r, y + height)
  s.quadraticCurveTo(x, y + height, x, y + height - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  return new T.Mesh(
    new T.ExtrudeGeometry(s, {
      depth,
      steps: 1,
      bevelEnabled: true,
      bevelSize: Math.min(0.08, depth / 4),
      bevelThickness: Math.min(0.08, depth / 4),
      bevelSegments: 2,
      curveSegments: 16,
    }),
    material,
  )
}
export function annulus(outer: number, inner: number, depth: number, material: T.Material) {
  const s = new T.Shape()
  s.absarc(0, 0, outer, 0, Math.PI * 2, false)
  const h = new T.Path()
  h.absarc(0, 0, inner, 0, Math.PI * 2, true)
  s.holes.push(h)
  return new T.Mesh(
    new T.ExtrudeGeometry(s, { depth, steps: 1, bevelEnabled: false, curveSegments: 40 }),
    material,
  )
}
/** Instance repeated real surface features without hundreds of draw calls. */
export function repeatGeometry(
  parent: T.Object3D,
  geometry: T.BufferGeometry,
  material: T.Material,
  positions: [number, number, number][],
) {
  const mesh = new T.InstancedMesh(geometry, material, positions.length),
    m = new T.Matrix4()
  positions.forEach((p, i) => {
    m.makeTranslation(...p)
    mesh.setMatrixAt(i, m)
  })
  mesh.instanceMatrix.needsUpdate = true
  parent.add(mesh)
  return mesh
}
