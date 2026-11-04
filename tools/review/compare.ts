/** Side-by-side fidelity sheet: the real viewer's opening shot and fixed front/side/back/
 * oblique renders of the built site, next to every inspected reference photograph.
 *
 *   npm run review:compare -- --site dist-site/my-object --plan examples/my-object/asset-plan.json
 *
 * Writes <site>/review/fidelity-sheet.{html,png} and opens the PNG. It produces evidence
 * for a person or agent to judge; it does not pass or fail visual quality by itself. */
import { chromium } from "@playwright/test"
import { readFile, mkdir, writeFile, copyFile } from "node:fs/promises"
import path from "node:path"
import { parseArgs } from "node:util"
import { assetPlanSchema, referenceCoverage } from "../../src/spec/assets.ts"
import { openInBrowser, openSite, shouldAutoOpen } from "../../src/pipeline/open-site.ts"

const { values } = parseArgs({
  options: {
    site: { type: "string" },
    plan: { type: "string" },
    open: { type: "boolean", default: true },
  },
  allowNegative: true,
})
if (!values.site)
  throw Error("Usage: npm run review:compare -- --site <built site> [--plan <asset-plan.json>]")
const site = path.resolve(values.site)
const out = path.join(site, "review")
await mkdir(out, { recursive: true })

const plan = values.plan ? assetPlanSchema.parse(JSON.parse(await readFile(values.plan, "utf8"))) : undefined
const coverage = plan ? referenceCoverage(plan) : undefined
const references: Array<{ file: string; caption: string }> = []
for (const [index, o] of (plan?.observations ?? []).entries()) {
  const source = path.resolve(path.dirname(values.plan!), o.imagePath)
  const file = `ref-${index}${path.extname(source) || ".png"}`
  try {
    await copyFile(source, path.join(out, file))
    references.push({ file, caption: `${o.view} · ${o.componentId} · ${o.origin}` })
  } catch {
    references.push({ file: "", caption: `${o.view} · ${o.componentId} — missing file ${o.imagePath}` })
  }
}

const server = await openSite(site, { open: false, idleMinutes: 5 })
// Playwright's bundled Chromium, else the installed Chrome (see npm run setup).
const browser = await chromium
  .launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined })
  .catch(() => chromium.launch({ channel: "chrome" }))
const renders: Array<{ file: string; caption: string }> = []
const errors: string[] = []
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } })
  page.on("pageerror", (e) => errors.push(e.message))
  // tsx keeps function names with a __name helper that does not exist in the page.
  await page.addInitScript({ content: "window.__name = (f) => f" })
  const ready = async (query: string) => {
    await page.goto(`${server.url}?${query}`)
    await page.waitForFunction(
      () => {
        const w = window as unknown as {
          __atomicExplainerDebug?: unknown
          __atomicExplainerAssemblyReview?: { settled: () => boolean }
        }
        return w.__atomicExplainerDebug && w.__atomicExplainerAssemblyReview?.settled()
      },
      null,
      { timeout: 180_000 },
    )
    await page.waitForTimeout(1500)
  }

  await ready("debug=1&eval=1")
  await page.screenshot({ path: path.join(out, "opening.png") })
  renders.push({ file: "opening.png", caption: "Opening shot as a visitor first sees it" })

  await ready("debug=1&eval=1&setting=plain")
  const shots = await page.evaluate(() => {
    type Debug = {
      THREE: typeof import("three")
      renderer: import("three").WebGLRenderer
      scene: import("three").Scene
      camera: import("three").PerspectiveCamera
      render: () => void
    }
    const { THREE, renderer, scene, camera, render } = (
      window as unknown as { __atomicExplainerDebug: Debug }
    ).__atomicExplainerDebug
    const box = new THREE.Box3()
    scene.traverse((node) => {
      if (!(node as import("three").Mesh).isMesh || !node.visible) return
      for (let a: import("three").Object3D | null = node; a; a = a.parent)
        if (a.userData.componentId) return void box.expandByObject(node)
    })
    const center = box.getCenter(new THREE.Vector3()),
      radius = box.getBoundingSphere(new THREE.Sphere()).radius
    const front = camera.position.clone().sub(center).normalize(),
      up = camera.up.clone().normalize()
    const distance = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) / 0.9
    const saved = { position: camera.position.clone(), quaternion: camera.quaternion.clone() }
    const view = (azimuth: number, elevation: number) => {
      const d = front.clone().applyAxisAngle(up, THREE.MathUtils.degToRad(azimuth))
      const side = new THREE.Vector3().crossVectors(up, d).normalize()
      d.applyAxisAngle(side, -THREE.MathUtils.degToRad(elevation))
      camera.position.copy(center).addScaledVector(d, distance)
      camera.lookAt(center)
      camera.updateMatrixWorld()
      render()
      return renderer.domElement.toDataURL("image/png")
    }
    const result = {
      front: view(0, 0),
      oblique: view(35, 25),
      side: view(90, 0),
      back: view(180, 0),
    }
    camera.position.copy(saved.position)
    camera.quaternion.copy(saved.quaternion)
    return result
  })
  for (const [name, url] of Object.entries(shots)) {
    await writeFile(path.join(out, `${name}.png`), Buffer.from(url.split(",")[1]!, "base64"))
    renders.push({ file: `${name}.png`, caption: `${name} — assembled, plain setting` })
  }

  const escape = (text: string) => text.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)
  const figure = ({ file, caption }: { file: string; caption: string }) =>
    `<figure>${file ? `<img src="${file}"${file.startsWith("ref-") || file === "opening.png" ? "" : ' class="cover"'}>` : `<div class="missing"></div>`}<figcaption>${escape(caption)}</figcaption></figure>`
  const html = `<!doctype html><meta charset="utf-8"><title>Fidelity sheet</title>
<style>body{margin:0;padding:24px;background:#151515;color:#eee;font:14px/1.4 system-ui,sans-serif}
h1{font-size:20px;margin:0 0 4px}h2{font-size:15px;margin:24px 0 8px;color:#aaa;font-weight:500}
.grid{display:flex;flex-wrap:wrap;gap:12px}figure{margin:0;width:400px}img{width:400px;height:400px;object-fit:contain;background:#000;display:block}img.cover{object-fit:cover}
.missing{width:400px;height:400px;background:repeating-linear-gradient(45deg,#311,#311 10px,#200 10px,#200 20px)}
figcaption{font-size:12px;color:#bbb;margin-top:4px}.issues{background:#4a1414;padding:10px 14px;border-radius:6px;margin:12px 0}
.ok{background:#14361f;padding:10px 14px;border-radius:6px;margin:12px 0}</style>
<h1>Fidelity sheet · ${escape(path.basename(site))}</h1>
<p>Judge the renders against the photographs: silhouette and proportions, every visible part present and complete, material and finish, printed detail. Tests passing does not answer this.</p>
${
  coverage
    ? coverage.ok
      ? `<div class="ok">Reference coverage: ${coverage.photographs} inspected photographs; views ${coverage.views.join(", ")}.</div>`
      : `<div class="issues"><strong>Research is too thin to model from:</strong><ul>${coverage.issues.map((i) => `<li>${escape(i)}</li>`).join("")}</ul></div>`
    : `<div class="issues">No asset plan given, so no inspected references to compare against.</div>`
}
${errors.length ? `<div class="issues"><strong>Page errors:</strong> ${escape(errors.join(" · "))}</div>` : ""}
<h2>Inspected references (${references.length})</h2><div class="grid">${references.map(figure).join("")}</div>
<h2>Built model in the real viewer</h2><div class="grid">${renders.map(figure).join("")}</div>`
  await writeFile(path.join(out, "fidelity-sheet.html"), html)
  const sheet = await browser.newPage({ viewport: { width: 1736, height: 900 } })
  await sheet.goto(new URL("review/fidelity-sheet.html", server.url).href)
  await sheet.waitForLoadState("load")
  await sheet.screenshot({ path: path.join(out, "fidelity-sheet.png"), fullPage: true })
} finally {
  await browser.close()
  if (server.pid) process.kill(server.pid)
}
const png = path.join(out, "fidelity-sheet.png")
console.log(
  JSON.stringify(
    { sheet: png, html: path.join(out, "fidelity-sheet.html"), coverage, pageErrors: errors },
    null,
    2,
  ),
)
if (values.open && shouldAutoOpen()) await openInBrowser(png)
