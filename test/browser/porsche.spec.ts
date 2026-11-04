import { test, expect } from "@playwright/test"
import { readFileSync, existsSync } from "node:fs"
test.describe.configure({ mode: "parallel" })
const studies = [
  { id: "porsche", path: "examples/porsche-911-engine/research.json", count: 29, anatomy: 26 },
  // Source geometry stays local. Opt in to test the real imported assembly,
  // never silently substitute the construction fixture for a fidelity example.
  ...(process.env.ATOMIC_EXPLAINER_LOCAL_STORIES
    ? [{ id: "iphone", path: "examples/iphone-18-pro/internal-study.json", count: 28, anatomy: 28 }]
    : []),
]
for (const study of studies)
  for (const viewport of [
    { width: 1440, height: 900 },
    { width: 390, height: 844 },
  ]) {
    test(`${study.id} whole/core/build story retains every lesson at ${viewport.width}`, async ({
      page,
    }, info) => {
      test.slow()
      if (study.id === "iphone")
        expect(existsSync("examples/iphone-18-pro/assets.local/internal-study.glb")).toBe(true)
      const spec = JSON.parse(readFileSync(study.path, "utf8")),
        story = spec.scene3d.assemblyStory
      const errors: string[] = []
      page.on("pageerror", (e) => errors.push(e.message))
      await page.setViewportSize(viewport)
      await page.goto(
        `${process.env.ATOMIC_EXPLAINER_LOCAL_STORIES ? "http://127.0.0.1:4319" : ""}/${study.id}-study/index.html?eval=1`,
      )
      await page.waitForFunction(() => Boolean(window.__atomicExplainerAssemblyReview), null, {
        timeout: 60_000,
      })
      const snapshot = () => page.evaluate(() => window.__atomicExplainerAssemblyReview!.snapshot())
      await page.waitForTimeout(1400)
      const start = await snapshot()
      expect(start.unobscuredParts.length, "opening anatomy must not be hidden by scenery").toBeGreaterThan(0)
      expect(start.partPositions).toEqual(start.homePositions)
      expect(start.selected).toBe(null)
      await page.screenshot({ path: info.outputPath("assembled.png") })
      await page.getByRole("button", { name: "Discover how it’s made" }).click()
      await expect.poll(async () => (await snapshot()).selected).toBe(story.chapters[0].id)
      let built = 0
      for (const chapter of story.chapters) {
        for (const local of [0.23, 0.42, 0.55]) {
          await page.evaluate(({ id, local }) => window.__atomicExplainerAssemblyReview!.inspect(id, local), {
            id: chapter.id,
            local,
          })
          await page.waitForFunction(() => window.__atomicExplainerAssemblyReview!.settled())
          const state = await snapshot(),
            caption = await page.locator(".mesh-caption:visible").boundingBox()
          expect(state.selected).toBe(chapter.id)
          expect(state.allVisible).toBe(true)
          expect(state.selectedParts).toEqual(chapter.componentIds)
          expect(state.bounds!.left, chapter.id).toBeGreaterThanOrEqual(0)
          expect(state.bounds!.right, chapter.id).toBeLessThanOrEqual(viewport.width)
          expect(state.bounds!.top, chapter.id).toBeGreaterThan(90)
          if (viewport.width < 700) expect(state.bounds!.bottom, chapter.id).toBeLessThan(caption!.y - 8)
          else expect(state.bounds!.right, chapter.id).toBeLessThan(caption!.x - 8)
          // At least one selected surface must be unobstructed by workshop scenery.
          expect(
            state.unobscuredParts.some((id) => chapter.componentIds.includes(id)),
            chapter.id + " scenery clearance",
          ).toBe(true)
          if (
            local === 0.42 &&
            (chapter.kind === "milestone" ||
              ["crankshaft", "crankcase", "pistons", "processor", "battery", "display"].includes(chapter.id))
          )
            await page.screenshot({ path: info.outputPath(chapter.id + ".png") })
        }
        await page.evaluate((id) => window.__atomicExplainerAssemblyReview!.inspect(id, 0.97), chapter.id)
        await page.waitForFunction(() => window.__atomicExplainerAssemblyReview!.settled())
        const joined = await snapshot()
        built += chapter.kind === "milestone" ? 0 : chapter.componentIds.length
        expect(joined.builtIds).toHaveLength(built)
        for (const id of joined.builtIds)
          expect(joined.partPositions[id], id).toEqual(joined.homePositions[id])
      }
      expect(built).toBe(study.count)
      expect(await page.getByLabel("Explore a component").locator("option").count()).toBe(
        story.chapters.length + 2,
      )
      await expect(page.locator("#parts .part-grid > li")).toHaveCount(study.anatomy)
      if (study.id === "porsche") {
        await expect(
          page.locator("#parts h3").filter({ hasText: /Left crankcase|Right crankcase/ }),
        ).toHaveCount(0)
        await expect(page.locator("#parts h3").filter({ hasText: "Crankcase halves" })).toHaveCount(1)
      }
      await page.getByLabel("Explore a component").selectOption("complete")
      await expect.poll(async () => (await snapshot()).separation).toBe(0)
      const end = await snapshot()
      expect(end.partPositions).toEqual(end.homePositions)
      expect(end.builtIds).toHaveLength(study.count)
      await expect(page.getByRole("heading", { name: story.closing.title, exact: true })).toBeVisible()
      await page.waitForTimeout(1400)
      await page.screenshot({ path: info.outputPath("reassembled.png") })
      await page.getByLabel("Explore a component").selectOption("chapter:" + story.chapters[1].id)
      await expect.poll(async () => (await snapshot()).selected).toBe(story.chapters[1].id)
      expect((await snapshot()).builtIds).toHaveLength(1)
      await page.mouse.wheel(0, -400)
      const p = (await snapshot()).progress
      await expect.poll(async () => (await snapshot()).progress).toBeLessThan(p)
      await page.getByLabel("Explore a component").selectOption("assembly")
      await expect.poll(async () => (await snapshot()).progress).toBe(0)
      expect((await snapshot()).partPositions).toEqual(start.homePositions)
      expect(errors).toEqual([])
    })
  }
