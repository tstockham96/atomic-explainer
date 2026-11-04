import { createClearGlass } from "./optics.ts"
import * as THREE from "three"
import { WATCH_PART_IDS } from "../../spec/scene3d.ts"
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js"
import { disposeObject, type ExplodableModel, type ExplodablePart } from "./model.ts"

/** An original illustrative field watch; not Hamilton CAD or an H-10 engineering model. */
export function createWatch(): ExplodableModel {
  const root = new THREE.Group()
  root.name = "Illustrative field watch"
  const parts: ExplodablePart[] = []
  const moving: Array<{ mesh: THREE.Object3D; speed: number }> = []
  const steel = new THREE.MeshStandardMaterial({ color: "#c4cbd1", metalness: 1, roughness: 0.24 })
  const polished = new THREE.MeshPhysicalMaterial({
    color: "#dce2e5",
    metalness: 1,
    roughness: 0.13,
    clearcoat: 0.5,
  })
  const brushed = new THREE.MeshStandardMaterial({ color: "#959fa8", metalness: 0.92, roughness: 0.38 })
  const gold = new THREE.MeshStandardMaterial({ color: "#cda55b", metalness: 0.85, roughness: 0.27 })
  const darkSteel = new THREE.MeshStandardMaterial({ color: "#3b424a", metalness: 0.9, roughness: 0.35 })
  const cream = new THREE.MeshStandardMaterial({ color: "#d6c7a3", metalness: 0.15, roughness: 0.48 })
  const jewel = new THREE.MeshPhysicalMaterial({
    color: "#9d1646",
    metalness: 0.2,
    roughness: 0.18,
    clearcoat: 1,
  })
  const glass = createClearGlass(1.76)

  const mesh = (
    geometry: THREE.BufferGeometry,
    material: THREE.Material,
    parent: THREE.Object3D,
    x = 0,
    y = 0,
    z = 0,
  ) => {
    const object = new THREE.Mesh(geometry, material)
    object.position.set(x, y, z)
    parent.add(object)
    return object
  }
  const disc = (r: number, h: number) => {
    const geo = new THREE.CylinderGeometry(r, r, h, 96)
    geo.rotateX(Math.PI / 2)
    return geo
  }
  const ring = (
    outer: number,
    inner: number,
    depth: number,
    material: THREE.Material,
    parent: THREE.Object3D,
    z = 0,
  ) => {
    const shape = new THREE.Shape()
    shape.absarc(0, 0, outer, 0, Math.PI * 2, false)
    const hole = new THREE.Path()
    hole.absarc(0, 0, inner, 0, Math.PI * 2, true)
    shape.holes.push(hole)
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelSize: 0.018,
      bevelThickness: 0.018,
      bevelSegments: 3,
      curveSegments: 96,
      steps: 1,
    })
    geo.translate(0, 0, -depth / 2)
    return mesh(geo, material, parent, 0, 0, z)
  }
  const part = (
    id: string,
    home: [number, number, number],
    opened: [number, number, number],
    distance = 5.7,
  ) => {
    const group = new THREE.Group()
    group.name = id
    group.position.set(...home)
    root.add(group)
    parts.push({
      id,
      group,
      home: group.position.clone(),
      opened: new THREE.Vector3(...opened),
      orientation: group.quaternion.clone(),
      distance,
    })
    return group
  }
  const screw = (parent: THREE.Object3D, x: number, y: number, z: number, radius = 0.052) => {
    mesh(disc(radius, 0.034), polished, parent, x, y, z)
    const slot = mesh(new THREE.BoxGeometry(radius * 1.5, 0.012, 0.005), darkSteel, parent, x, y, z + 0.02)
    slot.rotation.z = x * 3 + y
  }

  const body = part("case", [0, 0, 0], [0, -1.65, 0.05], 5.8)
  ring(1.36, 1.12, 0.38, brushed, body)
  ring(1.39, 1.17, 0.08, polished, body, 0.22)
  ring(1.34, 1.12, 0.06, steel, body, -0.23)
  for (const x of [-0.8, 0.8])
    for (const y of [-1.27, 1.27]) {
      const lug = mesh(new RoundedBoxGeometry(0.24, 0.66, 0.33, 3, 0.065), steel, body, x, y, -0.03)
      lug.rotation.z = -Math.sign(x * y) * 0.1
      screw(body, x, y * 1.15, 0.15, 0.04)
    }

  const crystal = part("crystal", [0, 0, 0.32], [0, 3.8, 0.4], 5.3)
  mesh(disc(1.165, 0.065), glass, crystal)
  ring(1.176, 1.158, 0.035, polished, crystal)

  const dial = part("dial", [0, 0, 0.14], [0, 1.22, 0.12], 5.2)
  mesh(
    disc(1.15, 0.07),
    new THREE.MeshStandardMaterial({ color: "#111a19", roughness: 0.73, metalness: 0.13 }),
    dial,
  )
  // The dial artwork is a material on a three-dimensional disc, never a photo of the object.
  const dialCanvas = document.createElement("canvas")
  dialCanvas.width = dialCanvas.height = 1024
  const ctx = dialCanvas.getContext("2d")!
  ctx.clearRect(0, 0, 1024, 1024)
  ctx.translate(512, 512)
  ctx.fillStyle = "#dbc9a1"
  ctx.strokeStyle = "#d6c49f"
  for (let i = 0; i < 60; i++) {
    ctx.save()
    ctx.rotate((i * Math.PI) / 30)
    ctx.fillRect(i % 5 === 0 ? -4 : -1.5, -475, i % 5 === 0 ? 8 : 3, i % 5 === 0 ? 28 : 14)
    ctx.restore()
  }
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.font = "72px Georgia, serif"
  for (let i = 1; i <= 12; i++) {
    const angle = (i * Math.PI) / 6
    ctx.fillText(String(i), Math.sin(angle) * 375, -Math.cos(angle) * 375)
  }
  ctx.font = "24px sans-serif"
  ctx.fillText("H A M I L T O N", 0, -165)
  ctx.font = "16px sans-serif"
  ctx.fillText("K H A K I   F I E L D", 0, 170)
  ctx.fillText("A U T O M A T I C", 0, 202)
  const dialMap = new THREE.CanvasTexture(dialCanvas)
  dialMap.colorSpace = THREE.SRGBColorSpace
  mesh(
    new THREE.CircleGeometry(1.14, 96),
    new THREE.MeshStandardMaterial({ map: dialMap, transparent: true, roughness: 0.7, depthWrite: false }),
    dial,
    0,
    0,
    0.038,
  )
  ring(1.125, 1.116, 0.012, gold, dial, 0.04)

  const hands = part("hands", [0, 0, 0.23], [0.15, 2.5, 0.35], 4.6)
  const hand = (length: number, width: number, angle: number, z: number) => {
    const shape = new THREE.Shape()
    shape.moveTo(-width * 0.3, -0.18)
    shape.lineTo(-width * 0.42, length * 0.28)
    shape.lineTo(-width, length * 0.5)
    shape.lineTo(-width * 0.48, length * 0.76)
    shape.lineTo(0, length)
    shape.lineTo(width * 0.48, length * 0.76)
    shape.lineTo(width, length * 0.5)
    shape.lineTo(width * 0.42, length * 0.28)
    shape.lineTo(width * 0.3, -0.18)
    shape.closePath()
    const group = new THREE.Group()
    hands.add(group)
    group.rotation.z = angle
    group.position.z = z
    mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.012,
        bevelEnabled: true,
        bevelSize: 0.009,
        bevelThickness: 0.007,
        bevelSegments: 2,
        steps: 1,
      }),
      polished,
      group,
    )
    const inset = mesh(new THREE.ShapeGeometry(shape), cream, group, 0, 0, 0.025)
    inset.scale.set(0.64, 0.88, 1)
    mesh(new THREE.BoxGeometry(width * 1.1, 0.022, 0.01), polished, group, 0, length * 0.53, 0.029)
  }
  hand(0.69, 0.07, Math.PI / 3, 0)
  hand(0.96, 0.052, -Math.PI / 3, 0.04)
  const seconds = new THREE.Group()
  hands.add(seconds)
  seconds.position.z = 0.1
  mesh(new THREE.BoxGeometry(0.013, 1.16, 0.012), steel, seconds, 0, 0.38)
  mesh(new THREE.TorusGeometry(0.075, 0.009, 8, 24), polished, seconds, 0, -0.22)
  mesh(disc(0.068, 0.045), gold, hands, 0, 0, 0.105)
  moving.push({ mesh: seconds, speed: -Math.PI / 30 })

  const movement = part("movement", [0, 0, -0.08], [0, -0.2, 0.35], 5.25)
  mesh(disc(1.1, 0.18), gold, movement)
  ring(1.11, 1.04, 0.12, steel, movement, 0.1)
  const gear = (x: number, y: number, radius: number, teeth: number, z: number, speed: number) => {
    const shape = new THREE.Shape()
    for (let i = 0; i < teeth * 4; i++) {
      const angle = (i * Math.PI * 2) / (teeth * 4)
      const r = i % 4 === 1 || i % 4 === 2 ? radius : radius * 0.87
      const px = Math.cos(angle) * r,
        py = Math.sin(angle) * r
      if (i === 0) shape.moveTo(px, py)
      else shape.lineTo(px, py)
    }
    shape.closePath()
    const hole = new THREE.Path()
    hole.absarc(0, 0, radius * 0.56, 0, Math.PI * 2, true)
    shape.holes.push(hole)
    const wheel = new THREE.Group()
    wheel.position.set(x, y, z)
    movement.add(wheel)
    mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.045,
        bevelEnabled: true,
        bevelSize: 0.004,
        bevelThickness: 0.004,
        bevelSegments: 1,
        steps: 1,
        curveSegments: 20,
      }),
      gold,
      wheel,
    )
    for (let i = 0; i < 5; i++) {
      const spoke = mesh(new THREE.BoxGeometry(radius * 1.16, 0.024, 0.035), gold, wheel, 0, 0, 0.02)
      spoke.rotation.z = (i * Math.PI) / 5
    }
    mesh(disc(radius * 0.13, 0.065), polished, wheel, 0, 0, 0.045)
    mesh(disc(radius * 0.065, 0.068), jewel, wheel, 0, 0, 0.05)
    moving.push({ mesh: wheel, speed })
  }
  gear(-0.48, 0.42, 0.4, 36, 0.13, 0.1)
  gear(0.09, 0.32, 0.22, 26, 0.16, -0.18)
  gear(0.41, 0.03, 0.29, 32, 0.12, 0.14)
  gear(-0.1, -0.25, 0.3, 30, 0.15, -0.12)
  gear(-0.65, -0.32, 0.23, 24, 0.18, 0.22)
  gear(0.36, -0.61, 0.27, 28, 0.16, -0.2)
  const bridge = new THREE.Shape()
  bridge.moveTo(-0.88, 0.12)
  bridge.quadraticCurveTo(-0.28, 0.22, 0.43, 0.84)
  bridge.quadraticCurveTo(0.79, 0.78, 0.91, 0.46)
  bridge.lineTo(0.68, 0.31)
  bridge.quadraticCurveTo(0.26, 0.53, -0.22, -0.04)
  bridge.lineTo(-0.78, -0.12)
  bridge.closePath()
  mesh(
    new THREE.ExtrudeGeometry(bridge, {
      depth: 0.065,
      bevelEnabled: true,
      bevelSize: 0.02,
      bevelThickness: 0.014,
      bevelSegments: 2,
    }),
    brushed,
    movement,
    0,
    0,
    0.24,
  )
  for (let i = 0; i < 14; i++) {
    const angle = (i * Math.PI * 2) / 14
    const x = Math.cos(angle) * 0.94,
      y = Math.sin(angle) * 0.94
    if (i % 2) screw(movement, x, y, 0.23)
    else {
      mesh(disc(0.07, 0.025), gold, movement, x, y, 0.23)
      mesh(disc(0.037, 0.035), jewel, movement, x, y, 0.25)
    }
  }
  const rotor = new THREE.Group()
  movement.add(rotor)
  rotor.position.z = -0.16
  const rotorShape = new THREE.Shape()
  rotorShape.absarc(0, 0, 0.99, 0, Math.PI, false)
  rotorShape.lineTo(0.99, 0)
  mesh(
    new THREE.ExtrudeGeometry(rotorShape, {
      depth: 0.045,
      bevelEnabled: true,
      bevelSize: 0.015,
      bevelThickness: 0.015,
      bevelSegments: 2,
    }),
    brushed,
    rotor,
  )
  moving.push({ mesh: rotor, speed: 0.05 })

  const crown = part("crown", [1.53, 0, 0], [2.3, -1.3, 0.45], 3.1)
  const crownBody = mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.27, 64), steel, crown)
  crownBody.rotation.z = Math.PI / 2
  for (let i = 0; i < 32; i++) {
    const a = (i * Math.PI * 2) / 32
    const ridge = mesh(
      new THREE.BoxGeometry(0.22, 0.024, 0.025),
      polished,
      crown,
      0,
      Math.cos(a) * 0.199,
      Math.sin(a) * 0.199,
    )
    ridge.rotation.x = a
  }
  const end = mesh(disc(0.18, 0.02), polished, crown, 0.15)
  end.rotation.y = Math.PI / 2
  mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.32, 16).rotateZ(Math.PI / 2), steel, crown, -0.24)

  const back = part("caseback", [0, 0, -0.3], [0, -3.15, 0.2], 5.3)
  ring(1.28, 0.95, 0.08, brushed, back)
  mesh(disc(0.95, 0.045), glass, back)
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4
    screw(back, Math.cos(a) * 1.115, Math.sin(a) * 1.115, 0.06, 0.047)
  }

  const leatherCanvas = document.createElement("canvas")
  leatherCanvas.width = leatherCanvas.height = 256
  const leatherContext = leatherCanvas.getContext("2d")!
  const noise = leatherContext.createImageData(256, 256)
  let seed = 81293
  for (let i = 0; i < noise.data.length; i += 4) {
    seed = (seed * 1664525 + 1013904223) >>> 0
    const value = 105 + (seed % 60)
    noise.data[i] = noise.data[i + 1] = noise.data[i + 2] = value
    noise.data[i + 3] = 255
  }
  leatherContext.putImageData(noise, 0, 0)
  const grain = new THREE.CanvasTexture(leatherCanvas)
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping
  grain.repeat.set(2, 5)
  const leather = new THREE.MeshStandardMaterial({
    color: "#292824",
    roughness: 0.83,
    bumpMap: grain,
    bumpScale: 0.018,
  })
  const stitchMaterial = new THREE.MeshStandardMaterial({ color: "#b8a98d", roughness: 1 })
  const strap = part("strap", [0, 0, 0], [-2.65, -1.2, -0.15], 9)
  const stitches = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.008, 0.043, 2, 4), stitchMaterial, 112)
  strap.add(stitches)
  const stitchTransform = new THREE.Matrix4()
  let stitchIndex = 0
  for (const sign of [-1, 1]) {
    const shape = new THREE.Shape()
    shape.moveTo(-0.625, 1.48)
    shape.lineTo(0.625, 1.48)
    for (let i = 1; i <= 32; i++) shape.lineTo(0.625 - (i / 32) * 0.085, 1.48 + (i / 32) * 2.17)
    shape.quadraticCurveTo(0.54, 3.83, 0.35, 3.83)
    shape.lineTo(-0.35, 3.83)
    shape.quadraticCurveTo(-0.54, 3.83, -0.54, 3.65)
    for (let i = 31; i >= 0; i--) shape.lineTo(-0.625 + (i / 32) * 0.085, 1.48 + (i / 32) * 2.17)
    shape.closePath()
    if (sign < 0)
      for (let i = 0; i < 5; i++) {
        const hole = new THREE.Path()
        hole.absarc(0, 2.45 + i * 0.24, 0.037, 0, Math.PI * 2, true)
        shape.holes.push(hole)
      }
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: 0.12,
      bevelEnabled: true,
      bevelSize: 0.035,
      bevelThickness: 0.02,
      bevelSegments: 3,
      steps: 1,
      curveSegments: 16,
    })
    // Subdivide the length before bending so the band has a continuous curved silhouette.
    const positions = geometry.getAttribute("position")
    for (let i = 0; i < positions.count; i++) {
      const y = positions.getY(i)
      const u = Math.max(0, Math.min(1, (y - 1.52) / 2.25))
      positions.setY(i, y * sign)
      positions.setZ(i, positions.getZ(i) - 0.19 - Math.sin(u * Math.PI * 0.65) * 0.56)
    }
    if (sign < 0) {
      // Mirroring one axis reverses winding; restore outward-facing triangles.
      const index = geometry.getIndex()
      if (index)
        for (let i = 0; i < index.count; i += 3) {
          const a = index.getX(i)
          index.setX(i, index.getX(i + 2))
          index.setX(i + 2, a)
        }
      else
        for (let i = 0; i < positions.count; i += 3) {
          for (const attributeName of ["position", "normal", "uv"]) {
            const attr = geometry.getAttribute(attributeName) as THREE.BufferAttribute
            for (let item = 0; item < attr.itemSize; item++) {
              const a = attr.array[i * attr.itemSize + item]!
              attr.array[i * attr.itemSize + item] = attr.array[(i + 2) * attr.itemSize + item]!
              attr.array[(i + 2) * attr.itemSize + item] = a
            }
          }
        }
    }
    geometry.computeVertexNormals()
    mesh(geometry, leather, strap)
    for (let i = 0; i < 28; i++) {
      const u = i / 27
      const y = sign * (1.52 + u * 2.25)
      const z = -0.06 - Math.sin(u * Math.PI * 0.65) * 0.56
      const width = 1.25 - u * 0.17
      for (const x of [-width / 2 + 0.09, width / 2 - 0.09]) {
        stitchTransform.makeTranslation(x, y, z)
        stitches.setMatrixAt(stitchIndex++, stitchTransform)
      }
    }
  }
  const buckle = part("buckle", [0, -3.89, -0.65], [2.25, -3.0, 0.4], 4)
  for (const x of [-0.53, 0.53]) mesh(new RoundedBoxGeometry(0.12, 0.56, 0.12, 2, 0.035), polished, buckle, x)
  for (const y of [-0.25, 0.25])
    mesh(new RoundedBoxGeometry(1.06, 0.12, 0.12, 2, 0.035), polished, buckle, 0, y)
  mesh(new RoundedBoxGeometry(0.075, 0.5, 0.09, 2, 0.015), steel, buckle, 0, 0, 0.08)

  const order: readonly string[] = WATCH_PART_IDS
  parts.sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id))

  return {
    root,
    parts,
    animate: (time) =>
      moving.forEach(({ mesh: object, speed }) => {
        object.rotation.z = time * speed
      }),
    dispose: () => disposeObject(root),
  }
}
