import * as T from "three"

/** Photo-informed 42 mm Murph hands. Insets are distinct recessed cells, not a
 * scaled silhouette with painted crossbars. The reverse remains solid metal. */
export function buildMurphHands(
  parent: T.Group,
  metal: T.Material,
  edge: T.Material,
  lume: T.Material,
  dark: T.Material,
) {
  const path = (points: number[][]) => {
    const s = new T.Shape()
    points.forEach(([x, y], i) => (i ? s.lineTo(x!, y!) : s.moveTo(x!, y!)))
    s.closePath()
    return s
  }
  const plate = (
    p: T.Object3D,
    s: T.Shape,
    z: number,
    h: number,
    m: T.Material | T.Material[],
    name: string,
    bevel = 0.012,
  ) => {
    const geometry = new T.ExtrudeGeometry(s, {
      depth: h,
      bevelEnabled: true,
      bevelSize: bevel,
      bevelThickness: bevel,
      bevelSegments: 3,
      curveSegments: 48,
    })
    geometry.translate(0, 0, -h / 2)
    const mesh = new T.Mesh(geometry, m)
    mesh.position.z = z
    mesh.name = name
    p.add(mesh)
    return mesh
  }
  const hub = (p: T.Object3D, r: number, h: number, z: number) => {
    const o = new T.Mesh(new T.CylinderGeometry(r, r, h, 96).rotateX(Math.PI / 2), edge)
    o.position.z = z
    p.add(o)
  }
  const inset = (p: T.Object3D, s: T.Shape, name: string) => {
    const hole = new T.Path(s.getPoints(48))
    ;(p === hour ? outline : minuteOutline).holes.push(hole)
    return plate(p, s, 0, 0.11, lume, name, 0.003)
  }
  const hour = new T.Group()
  hour.name = "hour_hand"
  hour.rotation.z = Math.PI / 3
  parent.add(hour)
  const outline = new T.Shape()
  outline.moveTo(-0.3, -0.8)
  outline.lineTo(-0.32, 5.18)
  outline.bezierCurveTo(-1.6, 5.2, -1.86, 6.55, -1.33, 7.63)
  outline.quadraticCurveTo(-0.67, 8.35, 0, 10.7)
  outline.quadraticCurveTo(0.67, 8.35, 1.33, 7.63)
  outline.bezierCurveTo(1.86, 6.55, 1.6, 5.2, 0.32, 5.18)
  outline.lineTo(0.3, -0.8)
  outline.closePath()
  inset(
    hour,
    path([
      [-0.17, 1.1],
      [-0.18, 5.03],
      [0.18, 5.03],
      [0.17, 1.1],
    ]),
    "hour_stem_lume",
  )
  const left = new T.Shape()
  left.moveTo(-0.12, 5.46)
  left.bezierCurveTo(-1.25, 5.38, -1.56, 6.33, -1.2, 7.4)
  left.bezierCurveTo(-0.55, 7.19, -0.18, 6.43, -0.12, 5.46)
  left.closePath()
  inset(hour, left, "hour_left_petal")
  const right = new T.Shape()
  right.moveTo(0.13, 5.46)
  right.bezierCurveTo(0.06, 6.3, -0.04, 7.0, 0.13, 7.7)
  right.bezierCurveTo(0.62, 7.86, 1.02, 7.64, 1.2, 7.4)
  right.bezierCurveTo(1.56, 6.33, 1.25, 5.38, 0.13, 5.46)
  right.closePath()
  inset(hour, right, "hour_right_petal")
  inset(
    hour,
    path([
      [-0.64, 7.8],
      [0, 10.11],
      [0.64, 7.8],
      [0, 8.08],
    ]),
    "hour_point_lume",
  )
  plate(hour, outline, 0, 0.13, [metal, edge], "hour_cathedral_frame")
  const hourBack = outline.clone()
  hourBack.holes = []
  plate(hour, hourBack, -0.075, 0.02, metal, "hour_backing", 0.003)
  hub(hour, 1.02, 0.22, 0.005)
  const minute = new T.Group()
  minute.name = "minute_hand"
  minute.rotation.z = -Math.PI / 3
  minute.position.z = 0.3
  parent.add(minute)
  const minuteOutline = path([
    [-0.29, -0.7],
    [-0.36, 8.75],
    [-0.59, 9.8],
    [-0.59, 12.2],
    [-0.18, 13.05],
    [-0.055, 16.3],
    [0.055, 16.3],
    [0.18, 13.05],
    [0.59, 12.2],
    [0.59, 9.8],
    [0.36, 8.75],
    [0.29, -0.7],
  ])

  inset(
    minute,
    path([
      [-0.16, 1.15],
      [-0.18, 3.15],
      [0.18, 3.15],
      [0.16, 1.15],
    ]),
    "minute_inner_cell",
  )
  inset(
    minute,
    path([
      [-0.18, 3.32],
      [-0.22, 8.64],
      [0.22, 8.64],
      [0.18, 3.32],
    ]),
    "minute_long_cell",
  )
  inset(
    minute,
    path([
      [-0.23, 8.82],
      [-0.44, 9.84],
      [-0.44, 12.14],
      [0, 12.85],
      [0.44, 12.14],
      [0.44, 9.84],
      [0.23, 8.82],
    ]),
    "minute_point_cell",
  )
  plate(minute, minuteOutline, 0, 0.12, [metal, edge], "minute_spear_frame")
  const minuteBack = minuteOutline.clone()
  minuteBack.holes = []
  plate(minute, minuteBack, -0.07, 0.02, metal, "minute_backing", 0.003)
  hub(minute, 0.8, 0.19, 0.015)
  const seconds = new T.Group()
  seconds.name = "seconds_hand"
  seconds.position.z = 0.61
  seconds.rotation.z = 2.43
  parent.add(seconds)
  plate(
    seconds,
    path([
      [-0.055, -3.5],
      [-0.22, -3.12],
      [-0.055, -2.75],
      [-0.055, 16.65],
      [0.055, 16.65],
      [0.055, -2.75],
      [0.22, -3.12],
      [0.055, -3.5],
    ]),
    0,
    0.08,
    [metal, edge],
    "seconds_needle",
    0.005,
  )
  let y = 1.85
  for (const letter of [".", "..-", ".-.", ".", "-.-", ".-"]) {
    for (const mark of letter) {
      const length = mark === "-" ? 0.38 : 0.12
      const m = new T.Mesh(new T.BoxGeometry(0.05, length, 0.009), lume)
      m.position.set(0, y + length / 2, 0.046)
      seconds.add(m)
      y += length + 0.12
    }
    y += 0.22
  }
  hub(seconds, 0.48, 0.12, 0.015)
  const pin = new T.Mesh(new T.CylinderGeometry(0.12, 0.12, 0.025, 48).rotateX(Math.PI / 2), dark)
  pin.position.z = 0.09
  seconds.add(pin)
  return { hour, minute, seconds }
}
