import { test, expect } from "@playwright/test"

for (const width of [1440, 390]) {
  test(`sourced model inspection preserves a navigable front and reverse at ${width}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width, height: 900 })
    const errors: string[] = []
    page.on("pageerror", (e) => errors.push(e.message))
    await page.goto("/iphone-source-review/index.html")
    await expect(page.getByRole("heading", { name: "iPhone 18 Pro." })).toBeVisible()
    await page.getByLabel("3D model").setInputFiles("public/models/chronograph/watch.glb")
    await page.waitForFunction(() => window.__assetReviewReady, null, { timeout: 60_000 })
    await expect(page.locator("[role=status]")).toBeEmpty()
    await page.getByRole("button", { name: "Front", exact: true }).click()
    const front = await page.locator("canvas").screenshot()
    await page.getByRole("button", { name: "Back", exact: true }).click()
    const back = await page.locator("canvas").screenshot()
    expect(front.equals(back)).toBe(false)
    await page.getByRole("button", { name: "Side", exact: true }).click()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: info.outputPath("asset-review.png"), fullPage: true })
    expect(errors).toEqual([])
  })
}
