import * as T from "three"

/** Align a photographed/generated dial's best-fit plane before fitting authored internals.
 * The earlier image alignment is not a mechanical coordinate system.
 */
export function alignWatchReference(root: T.Group) {
  root.rotation.order = "ZYX"
  root.rotation.set(0, -Math.PI / 2, -Math.PI / 2)
  root.updateMatrixWorld(true)
  const dial = root.getObjectByName("tripo_part_3") as T.Mesh
  const positions = dial.geometry.attributes.position!,
    points: T.Vector3[] = []
  const mean = new T.Vector3()
  for (let i = 0; i < positions.count; i++) {
    const p = new T.Vector3().fromBufferAttribute(positions, i).applyMatrix4(dial.matrixWorld)
    points.push(p)
    mean.add(p)
  }
  mean.divideScalar(points.length)
  const a = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ],
    v = [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ]
  for (const p of points) {
    const d = p.clone().sub(mean).toArray()
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) a[i]![j]! += d[i]! * d[j]!
  }
  // Jacobi eigensolver for the symmetric covariance matrix.
  for (let n = 0; n < 30; n++) {
    let p = 0,
      q = 1
    for (let i = 0; i < 3; i++)
      for (let j = i + 1; j < 3; j++)
        if (Math.abs(a[i]![j]!) > Math.abs(a[p]![q]!)) {
          p = i
          q = j
        }
    if (Math.abs(a[p]![q]!) < 1e-12) break
    const phi = 0.5 * Math.atan2(2 * a[p]![q]!, a[q]![q]! - a[p]![p]!),
      c = Math.cos(phi),
      s = Math.sin(phi)
    const app = a[p]![p]!,
      aqq = a[q]![q]!,
      apq = a[p]![q]!
    for (let i = 0; i < 3; i++)
      if (i !== p && i !== q) {
        const aip = a[i]![p]!,
          aiq = a[i]![q]!
        a[i]![p] = a[p]![i] = c * aip - s * aiq
        a[i]![q] = a[q]![i] = s * aip + c * aiq
      }
    a[p]![p] = c * c * app - 2 * s * c * apq + s * s * aqq
    a[q]![q] = s * s * app + 2 * s * c * apq + c * c * aqq
    a[p]![q] = a[q]![p] = 0
    for (let i = 0; i < 3; i++) {
      const vip = v[i]![p]!,
        viq = v[i]![q]!
      v[i]![p] = c * vip - s * viq
      v[i]![q] = s * vip + c * viq
    }
  }
  let k = 0
  for (let i = 1; i < 3; i++) if (a[i]![i]! < a[k]![k]!) k = i
  const normal = new T.Vector3(v[0]![k], v[1]![k], v[2]![k]).normalize()
  if (normal.z < 0) normal.negate()
  const correction = new T.Quaternion().setFromUnitVectors(normal, new T.Vector3(0, 0, 1))
  root.quaternion.premultiply(correction)
  root.updateMatrixWorld(true)
  const caseMesh = root.getObjectByName("tripo_part_0") as T.Mesh
  const caseBox = new T.Box3().setFromObject(caseMesh),
    dialBox = new T.Box3().setFromObject(dial)
  const center = dialBox.getCenter(new T.Vector3()),
    scale = 42 / caseBox.getSize(new T.Vector3()).x
  root.scale.setScalar(scale)
  root.position.copy(center.multiplyScalar(-scale))
  root.position.z += 1.65
  root.updateMatrixWorld(true)
  return { caseMesh, dial, normal }
}

/** Keep only the generated exterior shell. Discard every face in the central cavity.
 * Cuts are conservative; an independently authored inner wall completes the surface.
 */
export function hollowCase(source: T.Mesh) {
  const g = source.geometry.clone().applyMatrix4(source.matrixWorld)
  const index = g.index,
    position = g.attributes.position!,
    indices: number[] = []
  for (let i = 0; i < (index?.count ?? position.count); i += 3) {
    const ids = [0, 1, 2].map((j) => (index ? index.getX(i + j) : i + j))
    const vertices = ids.map((j) => new T.Vector3().fromBufferAttribute(position, j))
    const center = vertices.reduce((a, b) => a.add(b), new T.Vector3()).divideScalar(3)
    if (Math.hypot(center.x, center.y) < 17.35) continue
    indices.push(...ids)
  }
  g.setIndex(indices)
  g.computeBoundingBox()
  g.computeBoundingSphere()
  return g
}
