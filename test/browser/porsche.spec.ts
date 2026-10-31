import {test,expect} from '@playwright/test'
for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
 test(`Porsche internal tour closes into a whole engine at ${viewport.width}`,async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize(viewport)
  await page.goto('/porsche-study/index.html?eval=1')
  await page.waitForFunction(()=>Boolean(window.__explodeAssemblyReview),null,{timeout:60_000})
  await page.waitForTimeout(1400)
  const home=await page.evaluate(()=>window.__explodeAssemblyReview!.snapshot().partPositions)
  await page.screenshot({path:info.outputPath('assembled.png')})
  await page.getByRole('button',{name:'Explode the object'}).click()
  await expect.poll(()=>page.evaluate(()=>window.__explodeAssemblyReview!.snapshot().separation)).toBeGreaterThan(.995)
  await page.waitForTimeout(1400);await page.screenshot({path:info.outputPath('exploded.png')})
  for(const id of ['pistons','crankshaft','valvetrain','timing-chains']){
   await page.getByLabel('Explore a component').selectOption(id)
   await expect.poll(()=>page.evaluate(()=>window.__explodeAssemblyReview!.snapshot().selected)).toBe(id)
   await page.waitForTimeout(1400)
   const state=await page.evaluate(()=>window.__explodeAssemblyReview!.snapshot())
   expect(state.allVisible).toBe(true)
   expect(state.bounds!.left).toBeGreaterThanOrEqual(0);expect(state.bounds!.right).toBeLessThanOrEqual(viewport.width)
   expect(state.bounds!.top).toBeGreaterThan(95);expect(state.bounds!.bottom).toBeLessThan(viewport.height-65)
   await page.screenshot({path:info.outputPath(`${id}.png`)})
  }
  // Exercise native scroll to the end; no endpoint override in the review hook.
  await page.evaluate(()=>{const spacer=document.querySelector('.pin')!.parentElement!.parentElement!;window.scrollTo(0,spacer.getBoundingClientRect().top+scrollY+.995*(spacer.offsetHeight-innerHeight))})
  await expect.poll(()=>page.evaluate(()=>window.__explodeAssemblyReview!.snapshot().progress)).toBeGreaterThan(.98)
  await expect.poll(()=>page.evaluate(()=>window.__explodeAssemblyReview!.snapshot().separation)).toBe(0)
  await expect(page.getByRole('heading',{name:'Together again.'})).toBeVisible()
  const end=await page.evaluate(()=>window.__explodeAssemblyReview!.snapshot())
  expect(end.partPositions).toEqual(home);expect(end.allVisible).toBe(true)
  await page.waitForTimeout(1400);await page.screenshot({path:info.outputPath('reassembled.png')})
  await page.evaluate(()=>window.scrollTo(0,0))
  await expect.poll(()=>page.evaluate(()=>window.__explodeAssemblyReview!.snapshot().progress)).toBeLessThan(.001)
  expect(errors).toEqual([])
 })
}
