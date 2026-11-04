import { test, expect, type Page } from "@playwright/test"

type Review = {
  ready: boolean
  ids: string[]
  inspect: (id: string, local?: number) => void
  snapshot: () => {
    progress: number
    time: number
    drawCount: number
    selected: string | null
    allVisible: boolean
    bounds: { left: number; right: number; top: number; bottom: number } | null
  }
}
declare global {
  interface Window {
    __atomicExplainerReview: Review
  }
}
async function load(page: Page) {
  const errors: string[] = []
  page.on("pageerror", (e) => errors.push(e.message))
  await page.goto("/murph-study/index.html?eval=1&story=explode")
  await page.waitForFunction(() => window.__atomicExplainerReview?.ready, {}, { timeout: 90_000 })
  expect(errors).toEqual([])
}
for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
  { width: 360, height: 640 },
]) {
  test(`all exported components fit without caption collisions at ${viewport.width}×${viewport.height}`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize(viewport)
    await load(page)
    const ids = await page.evaluate(() => window.__atomicExplainerReview.ids)
    expect(ids).toHaveLength(17)
    expect(await page.locator("#component-menu option").count()).toBe(18)
    expect(await page.locator("#component-explanations article").count()).toBe(18)
    for (const id of ids) {
      // Front, oblique and reverse: one view cannot establish a usable inspection.
      for (const turn of [0.2, 0.37, 0.5]) {
        await page.evaluate(({ id, turn }) => window.__atomicExplainerReview.inspect(id, turn), { id, turn })
        const state = await page.evaluate(() => ({
          snapshot: window.__atomicExplainerReview.snapshot(),
          caption: document.querySelector("#chapter")!.getBoundingClientRect().toJSON(),
          controls: document.querySelector(".controls")!.getBoundingClientRect().toJSON(),
          overflow: document.documentElement.scrollWidth > innerWidth,
        }))
        expect(state.snapshot.allVisible, id).toBe(true)
        expect(state.overflow, id).toBe(false)
        const b = state.snapshot.bounds!
        expect(b, id).not.toBeNull()
        expect(b.left, id).toBeGreaterThanOrEqual(0)
        expect(b.right, id).toBeLessThanOrEqual(viewport.width)
        expect(b.top, id).toBeGreaterThanOrEqual(75)
        expect(b.bottom, id).toBeLessThanOrEqual(state.controls.top)
        expect(state.caption.bottom, id).toBeLessThanOrEqual(state.controls.top - 8)
        if (viewport.width < 700) expect(b.bottom, id).toBeLessThanOrEqual(state.caption.top - 8)
        else expect(b.left, id).toBeGreaterThanOrEqual(state.caption.right + 8)
      }
    }
    await page.evaluate(() => window.__atomicExplainerReview.inspect("rotor", 0.2))
    await page.screenshot({ path: testInfo.outputPath("rotor.png") })
  })
}
test("reduced motion keeps every component and keyboard navigation available", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await load(page)
  // Wait for the pending final redraw rather than assuming a 100 ms frame.
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  )
  const before = await page.evaluate(() => window.__atomicExplainerReview.snapshot())
  await page.waitForTimeout(300)
  const after = await page.evaluate(() => window.__atomicExplainerReview.snapshot())
  expect(after.time).toBe(before.time)
  expect(after.drawCount).toBe(before.drawCount)
  await page.locator("#component-menu").selectOption("rear-window")
  await expect(page.locator("#title")).toContainText("rear")
  await page.locator("#next-part").focus()
  await page.keyboard.press("Enter")
  await expect(page.locator("#title")).toContainText("rotor")
  await page.locator(".skip-link").focus()
  await page.keyboard.press("Enter")
  await expect(page.locator("#component-guide")).toBeFocused()
  expect(await page.locator("#component-explanations article").count()).toBe(18)
})
test("pause stops ambient movement and all buttons have usable touch targets", async ({ page }) => {
  await load(page)
  await page.locator("#motion").click()
  await expect(page.locator("#motion")).toHaveAttribute("aria-pressed", "true")
  // Wait for the pending final redraw rather than assuming a 100 ms frame.
  await page.evaluate(
    () => new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))),
  )
  const before = await page.evaluate(() => window.__atomicExplainerReview.snapshot())
  await page.waitForTimeout(300)
  const after = await page.evaluate(() => window.__atomicExplainerReview.snapshot())
  expect(after.time).toBe(before.time)
  expect(after.drawCount).toBe(before.drawCount)
  for (const button of await page.locator(".controls button").all())
    expect((await button.boundingBox())!.height).toBeGreaterThanOrEqual(44)
})
test("missing geometry leaves readable learning content and a clear error", async ({ page }) => {
  await page.route("**/murph-researched.glb", (route) => route.abort())
  await page.goto("/murph-study/index.html")
  await expect(page.locator("#error")).toBeVisible({ timeout: 90_000 })
  await expect(page.locator("#error")).toContainText("component explanations")
  expect(await page.locator("#component-explanations article").count()).toBe(18)
})
test("upload promises a research plan, with no unattended model-generation claim", async ({ page }) => {
  await page.goto("/create")
  await expect(page.getByRole("button", { name: "Research this object" })).toBeVisible()
  await expect(page.locator(".create-disclosure")).toContainText("not a finished 3D model")
  const config = await (await page.request.get("/api/config")).json()
  expect(config.capability).toBe("research-plan")
  expect(config.missing).toEqual(["OPENAI_API_KEY"])
})
test("ordinary forward and backward scrolling preserves the live scene", async ({ page }) => {
  await load(page)
  await page.mouse.wheel(0, 900)
  await expect
    .poll(() => page.evaluate(() => window.__atomicExplainerReview.snapshot().progress))
    .toBeGreaterThan(0.01)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(500)
  // Wait for the rendered forward pose, not just the DOM scroll position.
  // Software GPUs can still be catching up when the wheel has already stopped.
  await expect
    .poll(() => page.evaluate(() => window.__atomicExplainerReview.snapshot().progress))
    .toBeGreaterThan(0.035)
  const forward = await page.evaluate(() => window.__atomicExplainerReview.snapshot())
  expect(forward.allVisible).toBe(true)
  await page.mouse.wheel(0, -600)
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(500)
  await expect
    .poll(() => page.evaluate(() => window.__atomicExplainerReview.snapshot().progress))
    .toBeLessThan(forward.progress)
  expect(await page.evaluate(() => window.__atomicExplainerReview.snapshot().allVisible)).toBe(true)
})
