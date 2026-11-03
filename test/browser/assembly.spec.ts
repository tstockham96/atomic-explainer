import { test, expect } from '@playwright/test'

for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
  test(`construction fixture parts fit at ${viewport.width}`, async ({ page }, info) => {
    await page.setViewportSize(viewport)
    await page.goto('/create')
    await page.getByRole('link', { name: /iPhone internal study/ }).click()
    await expect(page).toHaveURL(/iphone-study/)
    await expect(page.getByRole('heading', { name: 'iPhone 18 Pro.' })).toBeVisible()
    await page.goto('/construction-fixtures/phone/index.html?eval=1')
    const errors: string[] = []; page.on('pageerror', e => errors.push(e.message))
    await page.waitForFunction(() => Boolean(window.__explodeAssemblyReview), null, { timeout: 60_000 })
    await expect(page.locator('.mesh-bottom')).toContainText('Assembly prototype')
    await page.waitForFunction(()=>window.__explodeAssemblyReview!.settled())
    const hero = await page.evaluate(() => ({ model: window.__explodeAssemblyReview!.snapshot().bounds!, title: document.querySelector('.mesh-title')!.getBoundingClientRect().toJSON() }))
    expect(hero.model.bottom).toBeLessThan(hero.title.top - 8)
    expect(hero.model.top).toBeGreaterThan(100)
    await page.screenshot({ path: info.outputPath('assembled.png') })
    const home = await page.evaluate(() => window.__explodeAssemblyReview!.snapshot().partPositions)
    await page.getByRole('button', { name: 'Explode the object' }).click()
    await expect.poll(() => page.evaluate(() => window.__explodeAssemblyReview!.snapshot().separation)).toBeGreaterThan(.995)
    const opened = await page.evaluate(() => window.__explodeAssemblyReview!.snapshot())
    expect(opened.allVisible).toBe(true)
    const keys = Object.keys(home)
    const distance = (a: number[], b: number[]) => Math.hypot(...a.map((v, i) => v - b[i]!))
    expect(keys.some((id, i) => keys.slice(i + 1).some(other => Math.abs(distance(home[id]!, home[other]!) - distance(opened.partPositions[id]!, opened.partPositions[other]!)) > 1))).toBe(true)
    // Native scroll must reverse the actual geometry, without an evaluation hook.
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect.poll(() => page.evaluate(() => window.__explodeAssemblyReview!.snapshot().separation)).toBe(0)
    expect(await page.evaluate(() => window.__explodeAssemblyReview!.snapshot().partPositions)).toEqual(home)

    for (const id of ['front-glass', 'battery', 'logic-board', 'enclosure']) {
      for (const local of [.3, .5, .7]) {
        await page.evaluate(({ id, local }) => window.__explodeAssemblyReview!.inspect(id, local), { id, local })
        await expect.poll(() => page.evaluate(() => window.__explodeAssemblyReview!.snapshot().selected)).toBe(id)
        await page.waitForFunction(()=>window.__explodeAssemblyReview!.settled())
        const actual = await page.evaluate(() => {
          const caption = [...document.querySelectorAll('.mesh-caption')].find(n => getComputedStyle(n).visibility === 'visible')!
          return { state: window.__explodeAssemblyReview!.snapshot(), caption: caption.getBoundingClientRect().toJSON(), overflow: document.documentElement.scrollWidth > innerWidth }
        })
        expect(actual.state.allVisible).toBe(true); expect(actual.overflow).toBe(false)
        const b = actual.state.bounds!
        expect(b.left).toBeGreaterThanOrEqual(0); expect(b.right).toBeLessThanOrEqual(viewport.width)
        expect(b.top).toBeGreaterThanOrEqual(100); expect(b.bottom).toBeLessThanOrEqual(viewport.height - 70)
        if (viewport.width < 700) expect(b.bottom).toBeLessThan(actual.caption.top - 8)
        else expect(b.right).toBeLessThan(actual.caption.left - 8)
      }
    }
    await page.getByLabel('Explore a component').selectOption('rear-cameras')
    await expect.poll(() => page.evaluate(() => window.__explodeAssemblyReview!.snapshot().selected)).toBe('rear-cameras')
    await expect(page.locator('.mesh-caption').filter({ hasText: 'Light becomes data' })).toBeVisible()
    await page.screenshot({ path: info.outputPath('camera.png') })
    expect(errors).toEqual([])
  })
}

test('agent project import creates a real preview without research credentials', async ({ page }) => {
  await page.goto('/create')
  await page.getByLabel('Assembly project').setInputFiles('dist-eval/construction-fixtures/phone/assembly-project.json')
  await expect(page.getByRole('link', { name: 'Open the 3D draft' })).toBeVisible({ timeout: 30_000 })
  await page.getByRole('link', { name: 'Open the 3D draft' }).click()
  await expect(page).toHaveURL(/\/jobs\/.+\/index.html/)
  await expect(page.locator('.mesh-title:not(.mesh-closing)')).toContainText('Scroll to rotate, explode and explore', { timeout: 60_000 })
  await expect(page.locator('.mesh-bottom')).toContainText('Assembly prototype')
})
