import * as T from "three"
import { surfaceFinish, finishUV } from "./finishes.ts"
import { engravedSatin, planarSurfaceUV, frontSurfaceGroups } from "./surface.ts"

type Finishes = {
  steel: T.Material
  polish: T.Material
  nickel: T.Material
  brass: T.Material
  dark: T.Material
  ruby: T.Material
}

/** Visible topology follows the actual 42 mm Murph rear macros (Fratello 2019,
 * SJX 2020) and Hamilton's H-10 family photo. Hidden gearing remains illustrative.
 * Coordinates are an estimated rear view in mm, with the crown to the left.
 */
export function buildH10(part: (id: string) => T.Group, m: Finishes) {
  // Carry the observed surface finish into core glTF textures, as on the rotor.
  // Satin caps and polished cut edges are different surfaces, not one grey shader.
  const satin = engravedSatin(26.6, () => {}, "linear", {
    reliefMm: 0.003,
    roughness: 0.34,
    variation: 0.06,
    color: "#bfc1bd",
    evidence:
      "H-10 rear macros in murph-study dossier: silver satin bridge faces; alloy/plating not established",
  })
  m = {
    ...m,
    nickel: satin,
    steel: surfaceFinish("steel", {
      evidence: "H-10 family reference: silver metallic rims and winding wheels; exact alloy unverified",
    }),
    brass: surfaceFinish("brass", {
      evidence: "H-10 rear references: gold-toned wheels; concealed wheel details approximate",
    }),
  }
  const headFinish = surfaceFinish("machined", {
    evidence: "Rear macro references: machined screw heads, slots modeled separately",
  })
  const add = (p: T.Object3D, g: T.BufferGeometry, mat: T.Material | T.Material[], x = 0, y = 0, z = 0) => {
    let geometry = g,
      material = mat
    if (mat === satin) {
      geometry = frontSurfaceGroups(planarSurfaceUV(g, 26.6), 0)
      material = [satin, m.polish]
    } else if (!Array.isArray(mat) && mat.userData.surfaceFinish)
      geometry = finishUV(g, mat.userData.surfaceFinish.tileMm)
    const o = new T.Mesh(geometry, material)
    o.position.set(x, y, z)
    p.add(o)
    return o
  }
  const disc = (r: number, h: number) => new T.CylinderGeometry(r, r, h, 96).rotateX(Math.PI / 2)
  const ring = (p: T.Object3D, r: number, inner: number, h: number, x = 0, y = 0, z = 0, mat = m.polish) => {
    const b = Math.min(0.055, h / 4, (r - inner) / 4),
      pts = [
        [inner + b, -h / 2],
        [r - b, -h / 2],
        [r, -h / 2 + b],
        [r, h / 2 - b],
        [r - b, h / 2],
        [inner + b, h / 2],
        [inner, h / 2 - b],
        [inner, -h / 2 + b],
        [inner + b, -h / 2],
      ]
    return add(
      p,
      new T.LatheGeometry(
        pts.map((v) => new T.Vector2(v[0]!, v[1]!)),
        128,
      ).rotateX(Math.PI / 2),
      mat,
      x,
      y,
      z,
    )
  }
  const solid = (
    p: T.Object3D,
    s: T.Shape,
    h: number,
    z: number,
    mat: T.Material | T.Material[] = m.nickel,
    b = 0.045,
  ) => {
    const g = new T.ExtrudeGeometry(s, {
      depth: h,
      bevelEnabled: true,
      bevelThickness: b,
      bevelSize: b,
      bevelSegments: 3,
      steps: 1,
      curveSegments: 48,
    })
    g.translate(0, 0, -h / 2)
    return add(p, g, mat, 0, 0, z)
  }
  const hole = (s: T.Shape, x: number, y: number, r: number) => {
    const h = new T.Path()
    h.absarc(x, y, r, 0, Math.PI * 2, true)
    s.holes.push(h)
  }
  const screw = (p: T.Object3D, x: number, y: number, z: number, r = 0.6) => {
    ring(p, r + 0.18, r * 0.85, 0.15, x, y, z, m.nickel)
    add(p, disc(r, 0.13), headFinish, x, y, z + 0.035)
    const slot = add(p, new T.BoxGeometry(r * 1.6, 0.115, 0.035), m.dark, x, y, z + 0.11)
    slot.rotation.z = x * 0.38 + y * 0.53
  }
  const jewel = (p: T.Object3D, x: number, y: number, z: number, r = 0.25) => {
    ring(p, r * 1.6, r * 0.95, 0.11, x, y, z, m.brass)
    add(p, disc(r, 0.1), m.ruby, x, y, z + 0.02)
    add(p, disc(r * 0.2, 0.12), m.dark, x, y, z + 0.025)
  }
  const assembly = (id: string, z = -0.85) => {
    const p = part(id)
    p.position.z = z
    p.rotation.y = Math.PI
    return p
  }
  const movement = assembly("movement"),
    bridgePack = new T.Group()
  bridgePack.name = "bridge_pack"
  movement.add(bridgePack)
  // Layered mainplate, recessed balance pocket and a continuous circular perimeter.
  add(movement, disc(12.8, 0.38), m.nickel, 0, 0, -1.15)
  ring(movement, 13.3, 12.65, 2.5, 0, 0, -0.05, m.steel)
  const perimeter = new T.Shape()
  perimeter.absarc(0, 0, 12.75, 0, Math.PI * 2, false)
  hole(perimeter, 0.7, 7.4, 4.15)
  solid(movement, perimeter, 0.3, -0.73, m.nickel)
  // Peripheral scallops and polished fixing seats, visible in both exact-model macros.
  for (const [x, y, r] of [
    [-11.1, -2.6, 0.73],
    [-9.0, -8.0, 0.72],
    [6.7, -10.5, 0.6],
    [10.9, -4.3, 0.68],
    [9.7, 6.4, 0.65],
    [-6.8, 10.2, 0.55],
  ]) {
    ring(movement, r + 0.3, r, 0.13, x, y, -0.47, m.polish)
    add(movement, disc(r, 0.06), m.dark, x, y, -0.52)
    screw(movement, x, y, -0.38, r * 0.65)
  }
  // Broad automatic bridge: most wheels are covered in an assembled H-10.
  const bridge = new T.Shape()
  bridge.moveTo(-6.5, 4.6)
  bridge.bezierCurveTo(-9.2, 3.2, -9.1, -2.9, -6.3, -6.6)
  bridge.bezierCurveTo(-3.7, -9.1, 1.6, -8.8, 5.7, -6.0)
  bridge.bezierCurveTo(8.9, -3.1, 8.3, 2.5, 5.1, 5.1)
  bridge.bezierCurveTo(2.5, 6.6, -2.9, 6.0, -6.5, 4.6)
  bridge.closePath()
  for (const [x, y] of [
    [-5.95, 1.1],
    [-4.3, -5.8],
    [5.9, -2.5],
  ])
    hole(bridge, x, y, 0.64)
  solid(bridgePack, bridge, 0.55, 0.65, m.nickel, 0.065)
  // A curved step across the automatic bridge, rather than independent polygon tiles.
  const step = new T.Shape()
  step.absarc(0, 0, 7.6, 2.5, 5.65, false)
  step.absarc(0, 0, 6.75, 5.65, 2.5, true)
  step.closePath()
  solid(bridgePack, step, 0.24, 1.03, m.steel, 0.045)
  for (const [x, y] of [
    [-5.95, 1.1],
    [-4.3, -5.8],
    [5.9, -2.5],
  ])
    screw(bridgePack, x, y, 1.12, 0.63)
  for (const [x, y] of [
    [-1.8, 3.3],
    [4.1, 2.1],
    [5.5, 0.1],
    [2.6, -4.8],
  ])
    jewel(bridgePack, x, y, 1.01, 0.22)
  // Rotor bearing support remains on the bridge when the oscillating weight lifts.
  ring(bridgePack, 2.65, 1.15, 0.3, 0, 0, 1.09, m.nickel)
  add(bridgePack, disc(0.8, 0.4), m.polish, 0, 0, 1.18)
  const barrelBridge = new T.Shape()
  barrelBridge.moveTo(6.3, 5.1)
  barrelBridge.bezierCurveTo(8.6, 4, 9.8, 1.2, 9.1, -2.4)
  barrelBridge.lineTo(11.5, -3.7)
  barrelBridge.bezierCurveTo(13.0, 1, 11.1, 7, 7.9, 9.5)
  barrelBridge.lineTo(5.2, 8.8)
  barrelBridge.quadraticCurveTo(4.8, 6.6, 6.3, 5.1)
  barrelBridge.closePath()
  hole(barrelBridge, 9.5, 4.5, 0.65)
  solid(bridgePack, barrelBridge, 0.45, 0.45, m.nickel)
  screw(bridgePack, 9.5, 4.5, 0.75, 0.57)
  // Small dark drill holes and raised dowels are separate geometry.
  for (const [x, y] of [
    [10.8, -2.2],
    [7.3, 8.7],
    [-8.6, -7.8],
    [-7.5, 8.6],
  ]) {
    add(movement, disc(0.35, 0.05), m.dark, x, y, -0.36)
    ring(movement, 0.48, 0.34, 0.07, x, y, -0.33, m.polish)
  }

  const wheels: T.Group[] = []
  function gear(
    parent: T.Object3D,
    x: number,
    y: number,
    r: number,
    teeth: number,
    z: number,
    open = true,
    mat = m.brass,
  ) {
    const group = new T.Group()
    group.position.set(x, y, z)
    parent.add(group)
    wheels.push(group)
    const shape = new T.Shape()
    for (let i = 0; i < teeth * 4; i++) {
      const a = (i / teeth / 4) * Math.PI * 2,
        rad = r - (i % 4 === 0 || i % 4 === 3 ? 0.14 : 0)
      if (i === 0) shape.moveTo(Math.cos(a) * rad, Math.sin(a) * rad)
      else shape.lineTo(Math.cos(a) * rad, Math.sin(a) * rad)
    }
    shape.closePath()
    if (open) hole(shape, 0, 0, r * 0.73)
    solid(group, shape, 0.18, 0, mat, 0.012)
    if (open)
      for (let i = 0; i < 5; i++) {
        const a = (i * Math.PI * 2) / 5
        const arm = add(
          group,
          new T.BoxGeometry(0.13, r * 0.78, 0.13),
          mat,
          -Math.sin(a) * r * 0.39,
          Math.cos(a) * r * 0.39,
        )
        arm.rotation.z = a
      }
    add(group, disc(0.36, 0.27), headFinish, 0, 0, 0.03)
    return group
  }
  const winding = assembly("winding-train")
  gear(winding, -8.6, -3.8, 2.15, 40, 0.06, false, m.steel)
  gear(winding, -6.3, -7, 2.45, 48, 0.04, false, m.brass)
  screw(winding, -8.6, -3.8, 0.25, 0.42)
  screw(winding, -6.3, -7, 0.25, 0.46)
  const reversing = gear(winding, 4.8, 3.9, 2.35, 52, 0.22, false)
  reversing.name = "reversing_wheel"
  gear(winding, 4.5, -3.5, 2.35, 52, 0.23, false)
  const barrel = assembly("barrel")
  gear(barrel, 5.3, -6.4, 3.3, 78, -0.19, false)
  add(barrel, disc(3.1, 0.55), m.brass, 5.3, -6.4, -0.13)
  ring(barrel, 3.1, 2.92, 0.08, 5.3, -6.4, 0.19, m.polish)
  // A mainspring is a ribbon, not a wire. Its hidden H-10 dimensions are
  // illustrative; keeping it independent makes the stored-energy lesson visible.
  const mainspring = assembly("mainspring"),
    spiral = new T.Shape(),
    segments = 640
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 14,
      r = 0.3 + (i / segments) * 2.55 + 0.025,
      x = 5.3 + Math.cos(a) * r,
      y = -6.4 + Math.sin(a) * r
    if (i === 0) spiral.moveTo(x, y)
    else spiral.lineTo(x, y)
  }
  for (let i = segments; i >= 0; i--) {
    const a = (i / segments) * Math.PI * 14,
      r = 0.3 + (i / segments) * 2.55 - 0.025
    spiral.lineTo(5.3 + Math.cos(a) * r, -6.4 + Math.sin(a) * r)
  }
  spiral.closePath()
  solid(mainspring, spiral, 0.28, -0.13, m.steel, 0.004).name = "mainspring_ribbon"
  const train = assembly("wheel-train")
  gear(train, 0.9, -2.6, 2.65, 68, -0.24).name = "center_wheel"
  gear(train, -2.9, 0.4, 2.2, 58, -0.05).name = "third_wheel"
  gear(train, -1.7, 4.1, 1.65, 45, 0.05).name = "fourth_wheel"
  const escape = assembly("escapement")
  gear(escape, -2.0, 6.5, 1.0, 15, 0.1, false, m.steel)
  const fork = new T.Shape()
  fork.moveTo(-1.4, 6.7)
  fork.lineTo(-0.6, 6.4)
  fork.lineTo(0.05, 7.0)
  fork.lineTo(0.3, 6.7)
  fork.lineTo(-0.45, 6.0)
  fork.lineTo(-1.55, 6.35)
  fork.closePath()
  solid(escape, fork, 0.14, 0.35, m.polish, 0.015)
  jewel(escape, -0.55, 6.25, 0.47, 0.16)
  const balance = assembly("balance"),
    balanceWheel = new T.Group()
  balanceWheel.name = "balance_wheel"
  balanceWheel.position.set(0.7, 7.4, -0.1)
  balance.add(balanceWheel)
  ring(balanceWheel, 3.7, 3.47, 0.24, 0, 0, 0, m.brass)
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3
    const arm = add(
      balanceWheel,
      new T.BoxGeometry(0.18, 3.5, 0.14),
      m.brass,
      -Math.sin(a) * 1.75,
      Math.cos(a) * 1.75,
    )
    arm.rotation.z = a
  }
  // Two opposed regulating weights visible on the reference wheel rim.
  for (const a of [0, Math.PI]) {
    add(balanceWheel, disc(0.25, 0.22), m.brass, Math.cos(a) * 3.45, Math.sin(a) * 3.45, 0.12)
    screw(balanceWheel, Math.cos(a) * 3.45, Math.sin(a) * 3.45, 0.23, 0.16)
  }
  const hair = []
  for (let i = 0; i <= 320; i++) {
    const a = (i / 320) * Math.PI * 16,
      r = 0.32 + (i / 320) * 2.5
    hair.push(new T.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0.3))
  }
  add(balanceWheel, new T.TubeGeometry(new T.CatmullRomCurve3(hair), 640, 0.012, 5, false), m.steel)
  // Distinctive broad balance cock and large round shock setting.
  const cock = new T.Shape()
  cock.moveTo(-8.8, 5.2)
  cock.quadraticCurveTo(-9.2, 6.0, -8, 6.8)
  cock.lineTo(-1.1, 8.7)
  cock.quadraticCurveTo(0.5, 9.4, 2.0, 8.5)
  cock.quadraticCurveTo(3.1, 7.2, 1.6, 6.0)
  cock.quadraticCurveTo(0.6, 5.3, -0.8, 5.8)
  cock.lineTo(-6.9, 3.7)
  cock.quadraticCurveTo(-8, 3.5, -8.8, 5.2)
  cock.closePath()
  hole(cock, -5.8, 5.65, 0.58)
  hole(cock, -8, 5.25, 0.68)
  solid(balance, cock, 0.45, 0.93, m.nickel, 0.055)
  screw(balance, -8, 5.25, 1.19, 0.56)
  ring(balance, 1.55, 0.87, 0.34, 0.7, 7.4, 1.32, m.polish)
  ring(balance, 1.04, 0.54, 0.15, 0.7, 7.4, 1.57, m.steel)
  jewel(balance, 0.7, 7.4, 1.63, 0.39)
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + 0.3
    const prong = add(
      balance,
      new T.BoxGeometry(0.12, 0.65, 0.07),
      m.brass,
      0.7 - Math.sin(a) * 0.43,
      7.4 + Math.cos(a) * 0.43,
      1.72,
    )
    prong.rotation.z = a
  }

  const rotor = assembly("rotor", -2.95),
    rotorPivot = new T.Group()
  rotorPivot.name = "rotor_pivot"
  rotor.add(rotorPivot)
  const rotorShape = new T.Shape()
  rotorShape.absarc(0, 0, 12.65, 0.12, Math.PI - 0.12, false)
  rotorShape.lineTo(-7.8, 1.5)
  rotorShape.bezierCurveTo(-5.8, 1.45, -5.1, -0.6, -4.55, -1.7)
  rotorShape.bezierCurveTo(-3.35, -4.65, 3.35, -4.65, 4.55, -1.7)
  rotorShape.bezierCurveTo(5.1, -0.6, 5.8, 1.45, 7.8, 1.5)
  rotorShape.lineTo(12.56, 1.5)
  rotorShape.closePath()
  for (const sign of [-1, 1]) {
    const h = new T.Path()
    h.moveTo(sign * 3.75, 4.1)
    h.quadraticCurveTo(sign * 4.1, 5.9, sign * 5.5, 7.0)
    h.quadraticCurveTo(sign * 6.7, 7.65, sign * 7.8, 6.5)
    h.quadraticCurveTo(sign * 8.5, 5.75, sign * 7.95, 4.85)
    h.quadraticCurveTo(sign * 5.9, 4.9, sign * 3.75, 4.1)
    h.closePath()
    rotorShape.holes.push(h)
  }
  // Hamilton's four-point mark is cut through the metal; there is real depth below it.
  const star = new T.Path()
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4 + Math.PI / 2,
      r = i % 2 === 0 ? 1.25 : 0.27
    const x = Math.cos(a) * r,
      y = 6.6 + Math.sin(a) * r
    if (i === 0) star.moveTo(x, y)
    else star.lineTo(x, y)
  }
  star.closePath()
  rotorShape.holes.push(star)
  hole(rotorShape, 0, 0, 1.05)
  const rotorFinish = engravedSatin(25.3, (ctx) => {
    const arcText = (text: string, r: number, span: number, size: number, outline = false, start = 0) => {
      ctx.font = `${size}px Arial`
      for (let i = 0; i < text.length; i++) {
        const angle = start - span / 2 + (i * span) / (text.length - 1)
        ctx.save()
        ctx.rotate(angle)
        if (outline) {
          ctx.lineWidth = 0.025
          ctx.strokeText(text[i]!, 0, -r)
        } else ctx.fillText(text[i]!, 0, -r)
        ctx.restore()
      }
    }
    arcText("HAMILTON", 10.45, 1.7, 0.95, true)
    arcText("TWENTY-FIVE 25 JEWELS", 3.25, 4.35, 0.43)
    arcText("SWISS", 3.25, 0.65, 0.43, false, Math.PI)
  })
  const rotorReverse = engravedSatin(25.3)
  const rotorFace = solid(rotorPivot, rotorShape, 0.55, 0, [rotorFinish, m.polish, rotorReverse], 0.045)
  rotorFace.name = "rotor_engraved_solid"
  frontSurfaceGroups(planarSurfaceUV(rotorFace.geometry, 25.3), 2)
  rotorFace.userData.surfaceArtwork = "UV-bound to cap triangles; cutouts remain empty"

  const weight = new T.Shape()
  weight.absarc(0, 0, 12.65, 0.12, Math.PI - 0.12, false)
  weight.absarc(0, 0, 11.15, Math.PI - 0.12, 0.12, true)
  weight.closePath()
  const weightFinish = engravedSatin(25.3, () => {}, "radial")
  const weightSolid = solid(rotorPivot, weight, 0.85, 0, [weightFinish, m.polish], 0.035)
  weightSolid.name = "rotor_weight"
  frontSurfaceGroups(planarSurfaceUV(weightSolid.geometry, 25.3), 0)
  ring(rotorPivot, 2.0, 1.37, 0.18, 0, 0, 0.39, m.steel)
  ring(rotorPivot, 1.58, 1.1, 0.21, 0, 0, 0.49, m.brass)
  ring(rotorPivot, 1.65, 1.1, 0.12, 0, 0, -0.34, m.steel)
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI) / 5
    add(rotorPivot, new T.SphereGeometry(0.13, 12, 8), m.polish, Math.cos(a) * 1.72, Math.sin(a) * 1.72, 0.47)
  }
  screw(rotorPivot, 0, 0, 0.61, 0.91)
  return { rotorPivot, balanceWheel, bridgePack, wheels }
}
