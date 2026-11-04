import * as T from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { RGBELoader } from "three/addons/loaders/RGBELoader.js"
import { disposeObject } from "./model.ts"

/** A complete Blender-authored room, with Cycles-baked indirect illumination.
 * Runtime lights affect the moving anatomy, never relight the baked furniture.
 * Source, fixtures and reflection probe share the same coordinate system. */
export async function createWorkdesk(renderer: T.WebGLRenderer, span: number, millimetersPerUnit?: number) {
  const root = new T.Group()
  root.name = "workdesk"
  const scale = millimetersPerUnit ? 1 / millimetersPerUnit : span / 78
  const floor = (-span * 0.58) / scale
  root.scale.setScalar(scale)
  root.position.z = (floor + 52) * scale
  const url = (file: string) => new URL(`presentation/atelier/${file}`, document.baseURI).href
  const loaded = await Promise.allSettled([
    new GLTFLoader().loadAsync(url("workshop.glb")),
    new RGBELoader().loadAsync(url("workshop-probe.hdr")),
  ])
  const [modelResult, probeResult] = loaded
  if (modelResult.status === "rejected" || probeResult.status === "rejected") {
    if (modelResult.status === "fulfilled") disposeObject(modelResult.value.scene)
    if (probeResult.status === "fulfilled") probeResult.value.dispose()
    throw new Error("Could not load the workshop scene", {
      cause:
        modelResult.status === "rejected"
          ? modelResult.reason
          : probeResult.status === "rejected"
            ? probeResult.reason
            : undefined,
    })
  }
  const model = modelResult.value.scene,
    probe = probeResult.value
  model.scale.setScalar(100)
  model.rotation.x = Math.PI / 2
  root.add(model)
  const originals = new Set<T.Material>(),
    baked = new Map<T.Material, T.MeshBasicMaterial>()
  model.traverse((node) => {
    if (!(node instanceof T.Mesh)) return
    node.castShadow = false
    node.receiveShadow = false
    const convert = (source: T.Material) => {
      let material = baked.get(source)
      if (!material) {
        const surface = source as T.MeshStandardMaterial
        const map = surface.map ?? surface.emissiveMap
        if (!map) throw new Error(`Workshop surface ${source.name} has no baked lighting map`)
        map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy())
        material = new T.MeshBasicMaterial({ map, toneMapped: false, name: source.name })
        baked.set(source, material)
        originals.add(source)
      }
      return material
    }
    node.material = Array.isArray(node.material) ? node.material.map(convert) : convert(node.material)
  })
  originals.forEach((material) => material.dispose())
  // Probe was captured at the inspection origin, in the very same authored room.
  probe.mapping = T.EquirectangularReflectionMapping
  const pmrem = new T.PMREMGenerator(renderer),
    environment = pmrem.fromEquirectangular(probe)
  probe.dispose()
  pmrem.dispose()
  const overhead = new T.SpotLight("#ffd6a1", 260000 * scale * scale, 850 * scale, 0.95, 0.85, 2)
  overhead.name = "bench_key"
  overhead.position.set(-45, -20, 294)
  overhead.target.position.set(0, -15, -52)
  overhead.castShadow = true
  overhead.shadow.mapSize.set(2048, 2048)
  overhead.shadow.camera.near = 30 * scale
  overhead.shadow.camera.far = 650 * scale
  overhead.shadow.bias = -0.00008
  overhead.shadow.normalBias = 0.15 * scale
  overhead.shadow.radius = 4
  overhead.shadow.intensity = 0.45
  root.add(overhead, overhead.target)
  const windowLight = new T.PointLight("#8daeff", 22000 * scale * scale, 700 * scale, 2)
  windowLight.position.set(-300, 195, 170)
  root.add(windowLight)
  // Only the moving object adds a runtime shadow. Static furniture shadows are
  // already baked, so printed mat lines cannot self-shadow or develop acne.
  const shadow = new T.Mesh(
    new T.PlaneGeometry(278, 188),
    new T.ShadowMaterial({ opacity: 0.28, depthWrite: false }),
  )
  shadow.name = "moving_object_contact_shadow"
  shadow.position.set(0, -27, -49.86)
  shadow.receiveShadow = true
  shadow.renderOrder = 1
  root.add(shadow)
  root.userData.staticScenery = true
  root.userData.workshopAssets = ["atelier/workshop.glb", "atelier/workshop-probe.hdr"]
  root.userData.workshopLighting = "cycles-baked-room-with-live-object"
  return {
    root,
    environment,
    overhead,
    floorZ: floor * scale,
    scale,
    gridSpacing: 10 * scale,
    // Panorama center faces +Y, with +Z up; Three's equirect center is +X, +Y up.
    environmentRotation: new T.Euler().setFromRotationMatrix(
      new T.Matrix4().makeBasis(new T.Vector3(0, 1, 0), new T.Vector3(0, 0, 1), new T.Vector3(1, 0, 0)),
    ),
    dispose: () => {
      windowLight.dispose()
      overhead.dispose()
      environment.dispose()
    },
  }
}
