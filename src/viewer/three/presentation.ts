import * as T from "three"
import { DESK_DIRECTION } from "./deskCamera.ts"
import { createWorkdesk } from "./workdesk.ts"
import { isTransmitting } from "./optics.ts"
import { createGlassEnvironment } from "./studio.ts"
import { disposeObject } from "./model.ts"

export type PresentationSetting = "workbench" | "plain"
export function presentationSetting(value: string | null): PresentationSetting {
  return value === "plain" ? "plain" : "workbench"
}

/** Shared scenery and lighting; component-local anatomy and surface properties
 * remain authored. Dim fill lets the visible bench fixture supply the key light. */
export async function createPresentation(
  scene: T.Scene,
  renderer: T.WebGLRenderer,
  object: T.Object3D,
  options: { millimetersPerUnit?: number } = {},
) {
  object.updateMatrixWorld(true)
  const size = new T.Box3().setFromObject(object).getSize(new T.Vector3()),
    span = Math.max(size.x, size.y, size.z),
    unit = options.millimetersPerUnit
  if (!Number.isFinite(span) || span <= 0) throw Error("Presentation requires nonempty finite object bounds")
  if (unit !== undefined && (!Number.isFinite(unit) || unit <= 0))
    throw Error("Presentation scale must be positive millimeters per unit")
  const fillLights = new Map<T.Light, number>()
  scene.traverse((o) => {
    if (o instanceof T.Light) fillLights.set(o, o.intensity)
  })
  const originalEnvironment = scene.environment,
    originalIntensity = scene.environmentIntensity,
    originalRotation = scene.environmentRotation.clone()
  const originalShadows = renderer.shadowMap.enabled,
    originalShadowType = renderer.shadowMap.type
  const workdesk = await createWorkdesk(renderer, span, unit),
    group = workdesk.root
  scene.add(group)
  const glassEnvironment = createGlassEnvironment(renderer, "#2d3437", 4.5)
  const casts = new Map<T.Mesh, boolean>(),
    opticalRotations = new Map<
      T.MeshPhysicalMaterial,
      { rotation: T.Euler; map: T.Texture | null; intensity: number }
    >()
  object.traverse((node) => {
    if (node instanceof T.Mesh) {
      casts.set(node, node.castShadow)
      for (const m of Array.isArray(node.material) ? node.material : [node.material])
        if (isTransmitting(m))
          opticalRotations.set(m, {
            rotation: m.envMapRotation.clone(),
            map: m.envMap,
            intensity: m.envMapIntensity,
          })
    }
  })
  const seatedRotation = new T.Quaternion().setFromRotationMatrix(
    new T.Matrix4().lookAt(DESK_DIRECTION, new T.Vector3(), new T.Vector3(0, 1, 0)),
  )
  let setting: PresentationSetting = "plain"
  function updateLighting() {
    if (setting !== "workbench") return
    fillLights.forEach((intensity, light) => {
      light.intensity = intensity * 0.24
    })
    scene.environment = workdesk.environment.texture
    scene.environmentIntensity = 1.6
    scene.environmentRotation.copy(workdesk.environmentRotation)
  }
  function set(next: PresentationSetting) {
    setting = next
    group.visible = next === "workbench"
    renderer.shadowMap.enabled = group.visible || originalShadows
    renderer.shadowMap.type = group.visible ? T.PCFShadowMap : originalShadowType
    casts.forEach((original, m) => {
      m.castShadow = group.visible
        ? !(Array.isArray(m.material) ? m.material : [m.material]).some(isTransmitting)
        : original
    })
    opticalRotations.forEach((home, m) => {
      m.envMapRotation.copy(home.rotation)
      m.envMap = group.visible ? glassEnvironment.texture : home.map
      m.envMapIntensity = group.visible ? 1 : home.intensity
      if (group.visible)
        m.envMapRotation.setFromQuaternion(
          seatedRotation.clone().multiply(new T.Quaternion().setFromEuler(home.rotation)),
        )
    })
    fillLights.forEach((intensity, light) => {
      light.intensity = intensity
    })
    scene.environment = originalEnvironment
    scene.environmentIntensity = originalIntensity
    scene.environmentRotation.copy(originalRotation)
    updateLighting()
  }
  set("plain")
  return {
    set,
    updateLighting,
    get setting() {
      return setting
    },
    group,
    desk: group,
    gridSpacing: workdesk.gridSpacing,
    millimetersPerUnit: unit,
    get lighting() {
      return {
        source: workdesk.overhead.name,
        castsShadow: workdesk.overhead.castShadow,
        fillFactor: setting === "workbench" ? 0.24 : 1,
      }
    },
    dispose() {
      set("plain")
      glassEnvironment.dispose()
      workdesk.dispose()
      group.removeFromParent()
      disposeObject(group)
    },
  }
}
