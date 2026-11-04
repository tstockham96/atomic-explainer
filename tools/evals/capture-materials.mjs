/** Usage: PLAYWRIGHT_CHANNEL=chrome node tools/evals/capture-materials.mjs
 * <preview URL> <exported site directory> <output directory>
 * Captures are evidence to inspect, not an automated visual-quality verdict. */
import { chromium } from "@playwright/test"
import { readFile, writeFile, mkdir } from "node:fs/promises"
import { createHash } from "node:crypto"
import path from "node:path"
const [url, site, output] = process.argv.slice(2)
if (!url || !site || !output) throw Error("Supply preview URL, exported site directory and output directory")
const spec = JSON.parse(await readFile(path.join(site, "spec.json"), "utf8"))
const materials = JSON.parse(await readFile(path.join(site, "material-review.json"), "utf8"))
const hash = createHash("sha256")
  .update(await readFile(path.join(site, spec.scene3d.url)))
  .digest("hex")
if (hash !== materials.modelSha256) throw Error("Material report does not match exported model")
await mkdir(output, { recursive: true })
const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || undefined })
const errors = [],
  rows = []
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 850 } })
  page.on("pageerror", (e) => errors.push(e.message))
  const target = new URL(url)
  target.searchParams.set("eval", "1")
  target.searchParams.set("materialReview", hash.slice(0, 12))
  await page.goto(target.href)
  await page.waitForFunction(() => window.__atomicExplainerAssemblyReview, null, { timeout: 90000 })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(output, "assembled.png") })
  const declared = spec.scene3d.inspectionGroups ?? [],
    seen = new Set()
  const stops = spec.scene3d.parts.flatMap((p) => {
    const g = declared.find((g) => g.componentIds.includes(p.componentId)),
      part = g ?? spec.components.find((c) => c.id === p.componentId)
    if (seen.has(part.id)) return []
    seen.add(part.id)
    return [part]
  })
  for (const part of stops) {
    const shots = []
    for (const [view, local] of [
      ["front", 0.28],
      ["reverse", 0.5],
      ["oblique", 0.61],
    ]) {
      await page.evaluate(({ id, local }) => window.__atomicExplainerAssemblyReview.inspect(id, local), {
        id: part.id,
        local,
      })
      await page.waitForTimeout(1500)
      const state = await page.evaluate(() => window.__atomicExplainerAssemblyReview.snapshot())
      if (!state.allVisible || state.selected !== part.id || !state.bounds)
        throw Error("Inspection failed: " + part.id)
      const b = state.bounds,
        x = Math.max(0, b.left - 10),
        y = Math.max(0, b.top - 10),
        file = part.id + "-" + view + ".png"
      await page.screenshot({
        path: path.join(output, file),
        clip: {
          x,
          y,
          width: Math.min(1200 - x, b.right - b.left + 20),
          height: Math.min(850 - y, b.bottom - b.top + 20),
        },
      })
      shots.push({ view, file, data: (await readFile(path.join(output, file))).toString("base64") })
    }
    rows.push({ id: part.id, name: part.name, shots })
    console.log("Captured", part.id)
  }
  // Alternate lighting is sampled on one representative component, explicitly
  // distinguished from the three-angle daylight capture of every component.
  await page.getByRole("button", { name: "Midnight", exact: true }).click()
  await page.waitForTimeout(1500)
  await page.screenshot({ path: path.join(output, "midnight-sample.png") })
  for (let i = 0; i < rows.length; i += 4) {
    const batch = rows.slice(i, i + 4)
    await page.setViewportSize({ width: 1350, height: batch.length * 240 })
    const escape = (s) => s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    await page.setContent(
      `<body style="margin:0;background:#e9eeeb;font:16px sans-serif">${batch.map((r) => `<div style="display:grid;grid-template-columns:180px repeat(3,1fr);height:240px;align-items:center;border-bottom:1px solid #aaa"><b>${escape(r.name)}</b>${r.shots.map((s) => `<div style="text-align:center"><img style="width:380px;height:210px;object-fit:contain" src="data:image/png;base64,${s.data}"><small>${s.view}</small></div>`).join("")}</div>`).join("")}</body>`,
    )
    await page.screenshot({ path: path.join(output, `sheet-${i / 4 + 1}.png`) })
  }
  await writeFile(
    path.join(output, "capture.json"),
    JSON.stringify(
      {
        modelSha256: hash,
        date: new Date().toISOString(),
        ready: false,
        errors,
        views: rows.length * 3,
        components: rows.map((r) => ({
          id: r.id,
          views: r.shots.map(({ data, ...shot }) => shot),
          visualVerdict: "pending",
        })),
        alternateLighting: {
          component: rows.at(-1).id,
          file: "midnight-sample.png",
          scope: "One sampled component; not an all-component alternate-lighting review",
        },
      },
      null,
      2,
    ) + "\n",
  )
  if (errors.length) throw Error(errors.join("\n"))
} finally {
  await browser.close()
}
