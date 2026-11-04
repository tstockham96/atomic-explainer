import * as THREE from "three"
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js"
import { OrbitControls } from "three/addons/controls/OrbitControls.js"
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js"
import "@fontsource/outfit/400.css"
import "@fontsource/outfit/500.css"
import "@fontsource/fraunces/400.css"
import "./style.css"

type ReviewConfig = {
  title: string
  description: string
  model?: string
  source?: { label: string; url: string }
  limitations: string[]
}
declare global {
  interface Window {
    __ASSET_REVIEW__?: ReviewConfig
    __assetReviewReady?: boolean
  }
}
const config = window.__ASSET_REVIEW__ ?? {
  title: "Inspect the actual object.",
  description:
    "Open a model to inspect its geometry, surface finishes and reverse side before building an explainer.",
  limitations: [
    "This inspection does not establish internal construction or a right to redistribute the asset.",
  ],
}
const app = document.querySelector<HTMLDivElement>("#app")!
app.innerHTML = `<main><header><a href="/create">EXPLODE</a><span>ASSET STUDY</span></header><section class="intro"><p class="eyebrow">RESEARCH BEFORE RECONSTRUCTION</p><h1></h1><p class="description"></p><div class="source"></div><details><summary>What this model establishes</summary><ul></ul></details></section><div class="stage" aria-label="Interactive 3D asset"><p class="status" role="status">Loading model…</p></div><footer><span>Drag to turn · scroll to look closer</span><div class="controls"><button data-view="front">Front</button><button data-view="back">Back</button><button data-view="side">Side</button><button id="open">Open a GLB</button><input id="file" type="file" accept=".glb" hidden aria-label="3D model"></div></footer></main>`
app.querySelector("h1")!.textContent = config.title
app.querySelector(".description")!.textContent = config.description
const list = app.querySelector("ul")!
for (const text of config.limitations) {
  const li = document.createElement("li")
  li.textContent = text
  list.append(li)
}
if (config.source && /^https?:\/\//.test(config.source.url)) {
  const a = document.createElement("a")
  a.textContent = config.source.label + " ↗"
  a.href = config.source.url
  a.target = "_blank"
  a.rel = "noopener noreferrer"
  app.querySelector(".source")!.append(a)
}
const stage = app.querySelector<HTMLDivElement>(".stage")!,
  status = app.querySelector<HTMLParagraphElement>(".status")!
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping
stage.prepend(renderer.domElement)
const scene = new THREE.Scene(),
  camera = new THREE.PerspectiveCamera(32, 1, 0.01, 100)
const room = new RoomEnvironment(),
  pmrem = new THREE.PMREMGenerator(renderer),
  environment = pmrem.fromScene(room, 0.04)
scene.environment = environment.texture
room.dispose()
pmrem.dispose()
const holder = new THREE.Group()
scene.add(holder)
const controls = new OrbitControls(camera, renderer.domElement)
controls.enablePan = false
controls.minDistance = 4.5
controls.maxDistance = 15
const draw = () => renderer.render(scene, camera)
controls.addEventListener("change", draw)
function resize() {
  const { width, height } = stage.getBoundingClientRect()
  renderer.setSize(width, height)
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  draw()
}
new ResizeObserver(resize).observe(stage)
function view(name: string) {
  const distance = Math.max(
    8,
    (4 / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))) * Math.max(1, 0.56 / camera.aspect) * 1.12,
  )
  holder.rotation.y = name === "back" ? Math.PI : name === "side" ? Math.PI / 2 : 0
  camera.position.set(distance * 0.23, 0.2, distance)
  controls.target.set(0, 0, 0)
  controls.update()
  draw()
}
let current: THREE.Object3D | undefined
async function load(url: string) {
  status.textContent = "Loading model…"
  window.__assetReviewReady = false
  try {
    const { scene: model } = await new GLTFLoader().loadAsync(url)
    const box = new THREE.Box3().setFromObject(model),
      size = box.getSize(new THREE.Vector3())
    if (box.isEmpty() || !Number.isFinite(size.length())) throw Error("The model has no visible geometry.")
    // A wrapper preserves authored node matrices and all material maps.
    const normalized = new THREE.Group()
    normalized.add(model)
    normalized.scale.setScalar(4 / Math.max(size.x, size.y, size.z))
    normalized.updateMatrixWorld(true)
    normalized.position.sub(new THREE.Box3().setFromObject(normalized).getCenter(new THREE.Vector3()))
    if (current) {
      holder.remove(current)
      current.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          o.geometry.dispose()
          for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
            for (const v of Object.values(m)) if (v instanceof THREE.Texture) v.dispose()
            m.dispose()
          }
        }
      })
    }
    holder.add(normalized)
    current = normalized
    resize()
    view("back")
    status.textContent = ""
    window.__assetReviewReady = true
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : "Could not load the model."
  }
}
for (const button of app.querySelectorAll<HTMLButtonElement>("[data-view]"))
  button.onclick = () => view(button.dataset.view!)
const file = app.querySelector<HTMLInputElement>("#file")!
app.querySelector<HTMLButtonElement>("#open")!.onclick = () => file.click()
file.onchange = async () => {
  const input = file.files?.[0]
  if (!input) return
  if (input.size > 150 * 1024 * 1024) {
    status.textContent = "Choose a model under 150 MB."
    return
  }
  const url = URL.createObjectURL(input)
  await load(url)
  URL.revokeObjectURL(url)
}
if (config.model) void load(config.model)
else status.textContent = "Open a sourced GLB to begin inspection."
