import { unobscuredSubjects } from "./visibility.ts"
import { deskShot, deskWide, deskContext } from "./deskCamera.ts"
import { createPresentation, presentationSetting, type PresentationSetting } from "./presentation.ts"
import { anatomyStops } from "../../spec/scene3d.ts"
import { createAssemblyStory } from "./assemblyStory.ts"
import { disposeObject, modelStops, stopBounds } from "./model.ts"
import { sampleScene, THREE_TIMING, ease } from "./timeline.ts"
import { configureRenderBudget } from "./renderBudget.ts"
import { isTransmitting, createOpticalBackdrop, sharpenTransmission } from "./optics.ts"
import * as THREE from "three"
import {
  createStudioEnvironment,
  createGlassEnvironment,
  createNeutralEnvironment,
  createProductEnvironment,
} from "./studio.ts"
import { cameraShot, poseModel, frameBox, STORY_FOV, corners } from "./choreography.ts"
import type { ExplainerSpec } from "../../spec/schema.ts"
import { loadModel } from "./loadModel.ts"

export type Atmosphere = "daylight" | "midnight"
export interface SceneHandle {
  setProgress: (value: number) => void
  setAtmosphere: (value: Atmosphere) => void
  setPresentation: (value: PresentationSetting) => void
  setPaused: (value: boolean) => void
  snapshot: () => {
    builtIds: string[]
    chapterKind: string | null
    homePositions: Record<string, number[]>
    unobscuredParts: string[]
    setting: PresentationSetting
    selected: string | null
    selectedParts: string[]
    allVisible: boolean
    bounds: { left: number; right: number; top: number; bottom: number } | null
    progress: number
    separation: number
    partPositions: Record<string, number[]>
  }
  isSettled: () => boolean
  capture: () => string
  dispose: () => void
}

export interface PartLabel {
  id: string
  x: number
  y: number
  visible: boolean
}

export async function createObjectScene(
  host: HTMLElement,
  spec: ExplainerSpec,
  onError: (message: string) => void,
  onFrame?: (labels: PartLabel[]) => void,
  onImages?: (images: Record<string, string>) => void,
): Promise<SceneHandle> {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
    // Wide workbench shots put the camera ~50 units from a 7-unit object with a 0.05
    // near plane. A linear depth buffer then cannot separate layers a few hundredths of
    // a millimetre apart (dial over its blank, link over link) and they z-fight.
    logarithmicDepthBuffer: true,
  })
  configureRenderBudget(renderer)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.05
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(STORY_FOV, 1, 0.05, 300)
  camera.position.set(0, 0.25, 16)
  const neutral = spec.scene3d?.kind === "gltf" && spec.scene3d.lighting === "neutral"
  const product = spec.scene3d?.kind === "gltf" && spec.scene3d.lighting === "product"
  const environment = product
    ? createProductEnvironment(renderer)
    : neutral
      ? createNeutralEnvironment(renderer)
      : createStudioEnvironment(renderer)
  scene.environment = environment.texture
  scene.environmentIntensity = 0.9
  scene.background = new THREE.Color("#e9eeeb")
  const backdrop = createOpticalBackdrop(scene.background)
  scene.add(backdrop)
  const render = () => renderer.render(scene, camera)
  // `?debug=1` exposes the live scene so agents can inspect real renders.
  if (new URLSearchParams(location.search).has("debug"))
    Object.assign(window, { __atomicExplainerDebug: { THREE, renderer, scene, camera, render } })
  const sky = new THREE.HemisphereLight(0xeaf4ff, 0x9c8c78, 2.0)
  const key = new THREE.DirectionalLight(0xfff2db, 3.2)
  key.position.set(-4, 7, 6)
  const rim = new THREE.DirectionalLight(0xc3dfff, 2.4)
  rim.position.set(5, 1, -4)
  const fill = new THREE.DirectionalLight(0xffffff, 0.8)
  fill.position.set(-6, -3, 2)
  if (!neutral && !product) scene.add(sky, key, rim, fill)

  let model
  try {
    model = await loadModel(spec)
  } catch (error) {
    environment.dispose()
    backdrop.geometry.dispose()
    backdrop.material.dispose()
    renderer.dispose()
    throw error
  }
  scene.add(model.root)
  const story =
    spec.scene3d?.kind === "gltf" && spec.scene3d.assemblyStory
      ? createAssemblyStory(
          model.root,
          Object.fromEntries(model.parts.map((p) => [p.id, p.group])),
          spec.scene3d.assemblyStory,
        )
      : undefined
  let lastAssemblyState = story?.pose(0)
  const storyShot = (state: ReturnType<NonNullable<typeof story>["pose"]>) => {
    const narrow = camera.aspect < 0.85,
      whole = state.opening ? 1 - state.reveal : ease((state.progress - 0.92) / 0.02)
    const shot = story!.camera(
      state,
      STORY_FOV,
      camera.aspect,
      narrow
        ? [0.76, 0.35]
        : [THREE.MathUtils.lerp(0.49, 0.8, whole), THREE.MathUtils.lerp(0.68, 0.47, whole)],
    )
    // Reserve the lower caption area on phones, right column on desktop.
    const direction = shot.position.clone().sub(shot.target),
      right = new THREE.Vector3().crossVectors(camera.up, direction).normalize(),
      up = new THREE.Vector3().crossVectors(direction, right).normalize(),
      d = direction.length() * Math.tan(THREE.MathUtils.degToRad(STORY_FOV / 2))
    const shift = narrow
      ? up.multiplyScalar(-d * 0.32)
      : right.multiplyScalar(d * camera.aspect * 0.4 * (1 - whole)).add(up.multiplyScalar(-d * 0.16 * whole))
    shot.position.add(shift)
    shot.target.add(shift)
    return shot
  }
  const glassEnvironment = createGlassEnvironment(renderer)
  // Preserve material appearance during the story; isolation is physical movement.
  const originalMaterials = new Set<THREE.Material>()
  model.parts.forEach((part) => {
    const copies = new Map<THREE.Material, THREE.Material>()
    part.group.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return
      const copy = (material: THREE.Material) => {
        originalMaterials.add(material)
        if (!copies.has(material)) {
          const cloned = material.clone()
          if (isTransmitting(cloned)) {
            sharpenTransmission(cloned)
            cloned.envMap = glassEnvironment.texture
            cloned.envMapIntensity = 0.7
          }
          if (part.doubleSided) cloned.side = THREE.DoubleSide
          copies.set(material, cloned)
        }
        return copies.get(material)!
      }
      node.material = Array.isArray(node.material) ? node.material.map(copy) : copy(node.material)
    })
  })
  const stillUsed = new Set<THREE.Material>()
  model.root.traverse((node) => {
    if (node instanceof THREE.Mesh)
      (Array.isArray(node.material) ? node.material : [node.material]).forEach((material) =>
        stillUsed.add(material),
      )
  })
  originalMaterials.forEach((material) => {
    if (!stillUsed.has(material)) material.dispose()
  })

  let presentation: Awaited<ReturnType<typeof createPresentation>>
  try {
    presentation = await createPresentation(scene, renderer, model.root)
  } catch (error) {
    disposeObject(model.root)
    glassEnvironment.dispose()
    environment.dispose()
    backdrop.geometry.dispose()
    backdrop.material.dispose()
    renderer.dispose()
    throw error
  }
  presentation.set(presentationSetting(new URLSearchParams(location.search).get("setting")))
  backdrop.visible = presentation.setting === "plain"

  host.appendChild(renderer.domElement)
  renderer.domElement.setAttribute(
    "aria-label",
    `${spec.item.name}: an interactive three-dimensional object. Scroll to explore or drag to rotate.`,
  )
  renderer.domElement.setAttribute("role", "img")

  let progress = 0,
    displayed = 0,
    atmosphere: Atmosphere = "daylight",
    night = 0
  let dirty = true,
    paused = false,
    visible = true,
    time = 0,
    lastTime = 0,
    disposed = false
  let pointerX = 0,
    pointerY = 0,
    dragX = 0,
    dragY = 0,
    dragging = false,
    previousX = 0,
    previousY = 0
  const look = new THREE.Vector3()

  const resize = () => {
    dirty = true
    const width = host.clientWidth,
      height = host.clientHeight
    renderer.setSize(width, height)
    camera.aspect = width / Math.max(1, height)
    camera.updateProjectionMatrix()
  }
  const observer = new ResizeObserver(resize)
  observer.observe(host)
  resize()

  const move = (event: PointerEvent) => {
    dirty = true
    if (event.pointerType !== "mouse") return
    const rect = host.getBoundingClientRect()
    pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2
    pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    if (dragging) {
      dragX += (event.clientX - previousX) * 0.005
      dragY = THREE.MathUtils.clamp(dragY + (event.clientY - previousY) * 0.003, -0.7, 0.7)
      previousX = event.clientX
      previousY = event.clientY
    }
  }
  const down = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return
    dragging = true
    previousX = event.clientX
    previousY = event.clientY
    renderer.domElement.setPointerCapture(event.pointerId)
    renderer.domElement.style.cursor = "grabbing"
  }
  const up = () => {
    dragging = false
    renderer.domElement.style.cursor = "grab"
  }
  const leave = () => {
    dirty = true
    pointerX = 0
    pointerY = 0
  }
  const lost = (event: Event) => {
    event.preventDefault()
    renderer.setAnimationLoop(null)
    onError("The 3D graphics context was interrupted. Reload the preview to restore it.")
  }
  renderer.domElement.style.cursor = "grab"
  renderer.domElement.style.touchAction = "pan-y"
  renderer.domElement.addEventListener("pointermove", move)
  renderer.domElement.addEventListener("pointerdown", down)
  renderer.domElement.addEventListener("pointerup", up)
  renderer.domElement.addEventListener("pointercancel", up)
  renderer.domElement.addEventListener("pointerleave", leave)
  renderer.domElement.addEventListener("webglcontextlost", lost)

  const frame = (milliseconds: number) => {
    if (disposed || !visible || document.hidden) {
      lastTime = milliseconds
      return
    }
    const elapsed = Math.max(0, (milliseconds - lastTime) / 1000) || 1 / 60
    const delta = Math.min(elapsed, 0.05)
    lastTime = milliseconds
    if (paused && !dirty) return
    if (!paused) time += delta
    // Scroll/camera response follows wall time, even when software rendering
    // takes more than 50 ms per frame. Only ambient animation is time-capped.
    const damp = 1 - Math.exp(-elapsed * 9)
    displayed = THREE.MathUtils.lerp(displayed, progress, damp)
    if (Math.abs(displayed - progress) < 0.00001) displayed = progress
    night = THREE.MathUtils.lerp(
      night,
      presentation.setting === "plain" && atmosphere === "midnight" ? 1 : 0,
      damp,
    )
    backdrop.material.color.set("#e9eeeb").lerp(new THREE.Color("#182c32"), night)
    sky.intensity = THREE.MathUtils.lerp(2.0, 0.5, night)
    key.intensity = THREE.MathUtils.lerp(3.2, 4.1, night)
    rim.intensity = THREE.MathUtils.lerp(2.4, 4.8, night)
    scene.environmentIntensity = THREE.MathUtils.lerp(neutral ? 1 : 0.9, 0.65, night)
    renderer.toneMappingExposure = THREE.MathUtils.lerp(1.05, 0.9, night)
    presentation.updateLighting()
    if (!dragging) {
      dragX = THREE.MathUtils.lerp(dragX, 0, delta * 0.6)
      dragY = THREE.MathUtils.lerp(dragY, 0, delta * 0.6)
    }
    if (story) {
      model.root.rotation.set(0, 0, 0)
      model.root.position.set(0, 0, 0)
    }
    const assemblyState = story?.pose(displayed)
    lastAssemblyState = assemblyState
    const sample = assemblyState
      ? {
          separation: assemblyState.opening ? assemblyState.reveal : assemblyState.complete ? 0 : 1,
          focus: assemblyState.focus,
        }
      : poseModel(model, displayed)
    model.root.rotation.y += pointerX * 0.015 + dragX
    model.root.rotation.x += pointerY * 0.01 + dragY
    model.animate(time)
    model.root.updateMatrixWorld(true)
    let shot = assemblyState ? storyShot(assemblyState) : cameraShot(model, displayed, camera.aspect)
    if (presentation.setting === "workbench")
      shot = deskShot(
        model.root,
        shot,
        (assemblyState
          ? deskWide(assemblyState.opening, assemblyState.reveal, displayed)
          : 1 - sample.focus) * deskContext(host.clientWidth, host.clientHeight),
      )
    look.lerp(shot.target, damp)
    camera.position.lerp(shot.position, damp)
    camera.lookAt(look)
    camera.updateMatrixWorld()
    const showLabels = !story && sample.separation > 0.995 && sample.focus < 0.015
    if (onFrame && !story)
      onFrame(
        modelStops(model).map((stop, index) => {
          const box = stopBounds(model, index)
          const projected = box.getCenter(new THREE.Vector3()).project(camera)
          return {
            id: stop.id,
            x: ((projected.x + 1) * host.clientWidth) / 2,
            y: ((1 - projected.y) * host.clientHeight) / 2,
            visible: showLabels && Math.abs(projected.x) < 0.95 && Math.abs(projected.y) < 0.85,
          }
        }),
      )
    dirty =
      Math.abs(displayed - progress) > 0.00001 ||
      Math.abs(night - (presentation.setting === "plain" && atmosphere === "midnight" ? 1 : 0)) > 0.0001 ||
      Math.abs(dragX) + Math.abs(dragY) > 0.0001 ||
      camera.position.distanceTo(shot.position) > 0.0001 ||
      look.distanceTo(shot.target) > 0.0001
    render()
  }
  if (onImages) {
    const requestedSetting = presentation.setting
    presentation.set("plain")
    backdrop.visible = true
    const images: Record<string, string> = {}
    renderer.setSize(480, 480, false)
    camera.aspect = 1
    camera.updateProjectionMatrix()
    poseModel(model, 0)
    const visibleNodes = model.parts.map((part) => part.group.visible)
    for (const [index, stop] of (story ? anatomyStops(spec) : modelStops(model)).entries()) {
      const members = model.parts.filter((p) => stop.componentIds.includes(p.id)),
        part = members[0]!
      if (story) {
        model.root.rotation.set(0, 0, 0)
        story.pose(0)
      } else
        poseModel(
          model,
          THREE_TIMING.inspect +
            ((index + 0.5) * (THREE_TIMING.reassemble - THREE_TIMING.inspect)) / modelStops(model).length,
        )
      model.parts.forEach((other) => {
        other.group.visible = members.includes(other)
      })
      const shot = frameBox(
        members.reduce((b, p) => b.union(new THREE.Box3().setFromObject(p.group)), new THREE.Box3()),
        new THREE.Vector3(...(part.shot?.from ?? [0.45, 0.3, 1])).normalize(),
        1,
        [0.8, 0.8],
      )
      camera.position.copy(shot.position)
      camera.lookAt(shot.target)
      render()
      images[stop.id] = renderer.domElement.toDataURL("image/png")
    }
    model.parts.forEach((part, index) => {
      part.group.visible = visibleNodes[index]!
    })
    resize()
    onImages(images)
    presentation.set(requestedSetting)
    backdrop.visible = requestedSetting === "plain"
  }
  model.root.rotation.set(0, 0, 0)
  if (!story) poseModel(model, progress)
  const initialShot = story ? storyShot(story.pose(progress)) : cameraShot(model, progress, camera.aspect)
  camera.position.copy(initialShot.position)
  look.copy(initialShot.target)
  camera.lookAt(look)
  const visibility = new IntersectionObserver((entries) => {
    visible = entries.some((entry) => entry.isIntersecting)
    renderer.setAnimationLoop(visible ? frame : null)
  })
  visibility.observe(host)
  renderer.setAnimationLoop(frame)

  return {
    setProgress: (value) => {
      dirty = true
      progress = Math.max(0, Math.min(1, value))
    },
    setPresentation: (value) => {
      presentation.set(value)
      backdrop.visible = value === "plain"
      dirty = true
    },
    setAtmosphere: (value) => {
      dirty = true
      atmosphere = value
    },
    setPaused: (value) => {
      dirty = true
      paused = value
    },
    snapshot: () => {
      const state = lastAssemblyState,
        sample = sampleScene(displayed, modelStops(model).length),
        index = state ? (state.opening || state.complete ? -1 : state.index) : sample.index,
        selected = modelStops(model)[index]
      model.root.updateMatrixWorld(true)
      const points = corners(
        selected ? stopBounds(model, index) : new THREE.Box3().setFromObject(model.root),
      ).map((p) => p.project(camera))
      return {
        builtIds: state?.builtIds ?? [],
        chapterKind: state && !state.opening && !state.complete ? (state.chapter.kind ?? "component") : null,
        homePositions: Object.fromEntries(model.parts.map((p) => [p.id, p.home.toArray()])),
        unobscuredParts: unobscuredSubjects(
          camera,
          Object.fromEntries(model.parts.map((p) => [p.id, p.group])),
          presentation.group,
        ),
        setting: presentation.setting,
        selected: selected?.id ?? null,
        selectedParts: selected?.componentIds ?? [],
        progress: displayed,
        separation: state ? (state.opening ? state.reveal : state.complete ? 0 : 1) : sample.separation,
        partPositions: Object.fromEntries(model.parts.map((p) => [p.id, p.group.position.toArray()])),
        allVisible: model.parts.every((p) => p.group.visible),
        bounds: {
          left: Math.min(...points.map((p) => ((p.x + 1) * host.clientWidth) / 2)),
          right: Math.max(...points.map((p) => ((p.x + 1) * host.clientWidth) / 2)),
          top: Math.min(...points.map((p) => ((1 - p.y) * host.clientHeight) / 2)),
          bottom: Math.max(...points.map((p) => ((1 - p.y) * host.clientHeight) / 2)),
        },
      }
    },
    isSettled: () => !dirty,
    capture: () => {
      render()
      return renderer.domElement.toDataURL("image/png")
    },
    dispose: () => {
      disposed = true
      renderer.setAnimationLoop(null)
      observer.disconnect()
      visibility.disconnect()
      renderer.domElement.removeEventListener("pointermove", move)
      renderer.domElement.removeEventListener("pointerdown", down)
      renderer.domElement.removeEventListener("pointerup", up)
      renderer.domElement.removeEventListener("pointercancel", up)
      renderer.domElement.removeEventListener("pointerleave", leave)
      renderer.domElement.removeEventListener("webglcontextlost", lost)
      presentation.dispose()
      model.dispose()
      glassEnvironment.dispose()
      backdrop.geometry.dispose()
      backdrop.material.dispose()
      environment.dispose()
      renderer.dispose()
      renderer.domElement.remove()
    },
  }
}
