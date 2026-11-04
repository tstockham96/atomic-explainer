import * as T from "three"

/** Bind planar artwork to the actual cap triangles. Cutouts cannot carry ink,
 * unlike an alpha plane suspended over an entire part's bounding rectangle. */
export function planarSurfaceUV(geometry: T.BufferGeometry, width: number, height = width) {
  const position = geometry.getAttribute("position"),
    uv = new Float32Array(position.count * 2)
  for (let i = 0; i < position.count; i++) {
    uv[i * 2] = position.getX(i) / width + 0.5
    uv[i * 2 + 1] = position.getY(i) / height + 0.5
  }
  geometry.setAttribute("uv", new T.BufferAttribute(uv, 2))
  return geometry
}

/** Decorate only the +Z cap; leave backs, cutout walls and bevels bare metal. */
export function frontSurfaceGroups(geometry: T.BufferGeometry, backMaterial = 1) {
  const normals = geometry.getAttribute("normal"),
    count = geometry.index?.count ?? normals.count
  const index = (i: number) => geometry.index?.getX(i) ?? i
  geometry.clearGroups()
  let start = 0,
    last = -1
  for (let i = 0; i < count; i += 3) {
    const material = [0, 1, 2].every((j) => normals.getZ(index(i + j)) > 0.999)
      ? 0
      : [0, 1, 2].every((j) => normals.getZ(index(i + j)) < -0.999)
        ? backMaterial
        : 1
    if (material !== last) {
      if (i > start) geometry.addGroup(start, i - start, last)
      start = i
      last = material
    }
  }
  if (count > start) geometry.addGroup(start, count - start, last)
  return geometry
}

/** Photo-observed finish, not a claim about substrate alloy or plating.
 * Grain spacing and relief use mm. Normal/roughness maps survive glTF export;
 * photographic highlights never enter the color map. */
export function engravedSatin(
  width: number,
  draw: (ctx: CanvasRenderingContext2D) => void = () => {},
  grain: "linear" | "radial" = "linear",
  options: {
    reliefMm?: number
    roughness?: number
    variation?: number
    color?: string
    evidence?: string
  } = {},
) {
  const make = () => {
    const c = document.createElement("canvas")
    c.width = c.height = 2048
    return c
  }
  const color = make(),
    relief = make(),
    normal = make(),
    roughness = make(),
    direction = make()
  const c = color.getContext("2d")!,
    b = relief.getContext("2d")!,
    n = normal.getContext("2d")!,
    r = roughness.getContext("2d")!,
    a = direction.getContext("2d")!
  c.fillStyle = options.color ?? "#c3c4bd"
  c.fillRect(0, 0, 2048, 2048)
  b.fillStyle = "#808080"
  b.fillRect(0, 0, 2048, 2048)
  let seed = 19
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
  const height = b.createImageData(2048, 2048),
    rough = r.createImageData(2048, 2048),
    axis = a.createImageData(2048, 2048)
  // Correlated lines at several scales remain legible in a close inspection
  // without turning the surface into coarse isolated geometric ridges.
  const line = new Float32Array(8192)
  for (let i = 0; i < line.length; i++) line[i] = random()
  const sample = (t: number) => {
    const p = ((t % 8192) + 8192) % 8192,
      i = Math.floor(p),
      f = p - i
    return line[i]! * (1 - f) + line[(i + 1) % 8192]! * f
  }
  for (let y = 0; y < 2048; y++)
    for (let x = 0; x < 2048; x++) {
      const px = ((x + 0.5 - 1024) * width) / 2048,
        py = ((1024 - y - 0.5) * width) / 2048,
        theta = Math.atan2(py, px)
      const across = grain === "linear" ? px : theta * 12
      const along = grain === "linear" ? py : Math.hypot(px, py)
      const g =
        0.8 * sample(across / 0.032 + Math.sin(along * 0.7) * 0.12) +
        0.14 * sample(across / 0.085) +
        0.06 * sample(across / 0.014)
      const i = (y * 2048 + x) * 4,
        h = 102 + g * 52
      height.data.set([h, h, h, 255], i)
      const roughValue =
        (options.roughness ?? (grain === "linear" ? 0.35 : 0.29)) + g * (options.variation ?? 0.14)
      rough.data.set([255, roughValue * 255, 255, 255], i)
      const angle = grain === "linear" ? Math.PI / 2 : theta
      axis.data.set([(Math.cos(angle) * 0.5 + 0.5) * 255, (Math.sin(angle) * 0.5 + 0.5) * 255, 255, 255], i)
    }
  b.putImageData(height, 0, 0)
  r.putImageData(rough, 0, 0)
  a.putImageData(axis, 0, 0)
  for (const [ctx, ink] of [
    [c, "#555b55"],
    [b, "#181818"],
  ] as const) {
    ctx.translate(1024, 1024)
    ctx.scale(2048 / width, 2048 / width)
    ctx.fillStyle = ctx.strokeStyle = ink
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    draw(ctx)
  }
  const heights = b.getImageData(0, 0, 2048, 2048).data,
    normals = n.createImageData(2048, 2048),
    spacing = width / 2048
  const at = (x: number, y: number) =>
    heights[(Math.max(0, Math.min(2047, y)) * 2048 + Math.max(0, Math.min(2047, x))) * 4]! / 255
  for (let y = 0; y < 2048; y++)
    for (let x = 0; x < 2048; x++) {
      const dx = (-(at(x + 1, y) - at(x - 1, y)) * (options.reliefMm ?? 0.022)) / (2 * spacing),
        dy = ((at(x, y + 1) - at(x, y - 1)) * (options.reliefMm ?? 0.022)) / (2 * spacing),
        length = Math.hypot(dx, dy, 1)
      normals.data.set(
        [
          ((dx / length) * 0.5 + 0.5) * 255,
          ((dy / length) * 0.5 + 0.5) * 255,
          ((1 / length) * 0.5 + 0.5) * 255,
          255,
        ],
        (y * 2048 + x) * 4,
      )
    }
  n.putImageData(normals, 0, 0)
  const texture = (canvas: HTMLCanvasElement) => {
    const t = new T.CanvasTexture(canvas)
    t.anisotropy = 8
    return t
  }
  const map = new T.CanvasTexture(color)
  map.colorSpace = T.SRGBColorSpace
  map.anisotropy = 8
  const material = new T.MeshPhysicalMaterial({
    map,
    normalMap: texture(normal),
    roughnessMap: texture(roughness),
    metalness: 1,
    roughness: 1,
    anisotropy: 0.4,
    anisotropyMap: texture(direction),
    color: "#ffffff",
  })
  material.name = `Observed brushed metal — ${grain}`
  material.userData.finishEvidence = {
    basis: "observed",
    grain,
    substrate: "unverified",
    plating: "unverified",
    reliefScaleMm: options.reliefMm ?? 0.022,
  }
  material.userData.surfaceFinish = {
    version: 1,
    kind: "brushed",
    tileMm: width,
    reliefMm: options.reliefMm ?? 0.022,
    grain,
    basis: "observed",
    evidence:
      options.evidence ??
      "Murph rear macros: directional satin appearance; exact substrate and plating unverified",
    uvUnits: "millimetres",
  }
  return material
}
