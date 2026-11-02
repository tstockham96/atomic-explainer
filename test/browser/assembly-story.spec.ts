import {test,expect} from '@playwright/test'
const chapterIds=['movement','rotor','dial','hands','case','crown','seals','caseback','rear-window','crystal','strap']
// Kept separate from the historical explode-mode visual benchmark.
for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:360,height:640}]){
 test(`how-it-is-made accumulates the watch at ${viewport.width}`,async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.setViewportSize(viewport)
  await page.goto('/murph-study/index.html?eval=1');await page.waitForFunction(()=>Boolean((window as any).__explodeReview?.seek),null,{timeout:90000})
  const snapshot=()=>page.evaluate(()=>(window as any).__explodeReview.snapshot())
  expect((await snapshot()).mode).toBe('assembly');expect((await snapshot()).selected).toBe('movement');expect((await snapshot()).builtIds).toEqual([])
  expect(await page.locator('#component-menu option').count()).toBe(12)
  await page.screenshot({path:info.outputPath('opening.png')})
  let previousCount=0
  for(const id of chapterIds){
   for(const local of [.2,.38,.55]){
    await page.evaluate(({id,local})=>(window as any).__explodeReview.inspect(id,local),{id,local})
    const state=await snapshot(),caption=await page.locator('#chapter').boundingBox(),controls=await page.locator('.controls').boundingBox()
    expect(state.allVisible).toBe(true);expect(state.selected).toBe(id);const b=state.bounds
    expect(b.left,id).toBeGreaterThanOrEqual(0);expect(b.right,id).toBeLessThanOrEqual(viewport.width)
    expect(b.top,id).toBeGreaterThanOrEqual(75)
    if(viewport.width<700)expect(b.bottom,id).toBeLessThanOrEqual(caption!.y-8)
    else expect(b.left,id).toBeGreaterThanOrEqual(caption!.x+caption!.width+8)
    expect(caption!.y+caption!.height).toBeLessThan(controls!.y-8)
   }
   await page.evaluate(id=>(window as any).__explodeReview.inspect(id,.97),id)
   const joined=await snapshot();expect(joined.builtIds.length).toBeGreaterThan(previousCount);previousCount=joined.builtIds.length
   for(const built of joined.builtIds)expect(joined.partPositions[built],built).toEqual(joined.homePositions[built])
   if(['rotor','hands','crystal'].includes(id))await page.screenshot({path:info.outputPath(id+'-joined.png')})
  }
  await page.evaluate(()=>(window as any).__explodeReview.seek(1));const end=await snapshot()
  expect(end.builtIds).toHaveLength(16);expect(end.partPositions).toEqual(end.homePositions)
  await expect(page.locator('#title')).toHaveText('A movement becomes a watch.')
  await page.screenshot({path:info.outputPath('complete.png')})
  await page.evaluate(()=>(window as any).__explodeReview.inspect('hands',.97));expect((await snapshot()).builtIds).toHaveLength(9)
  await page.evaluate(()=>(window as any).__explodeReview.seek(0));expect((await snapshot()).builtIds).toEqual([])
  expect(errors).toEqual([])
 })
}
test('reduced motion keeps the same progressive chapters available',async({page})=>{
 await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/murph-study/index.html?eval=1');await page.waitForFunction(()=>Boolean((window as any).__explodeReview?.seek),null,{timeout:90000})
 await page.locator('#component-menu').selectOption('crystal');await expect(page.locator('#title')).toHaveText('Protect the face without hiding it.')
 await page.locator('#component-menu').selectOption('');await expect(page.locator('#title')).toHaveText('A movement becomes a watch.')
 const a=await page.evaluate(()=>(window as any).__explodeReview.snapshot());await page.waitForTimeout(250);const b=await page.evaluate(()=>(window as any).__explodeReview.snapshot());expect(b.drawCount).toBe(a.drawCount)
})
test('public selection and reverse scrolling traverse the progressive build',async({page})=>{
 await page.goto('/murph-study/index.html?eval=1');await page.waitForFunction(()=>Boolean((window as any).__explodeReview?.seek),null,{timeout:90000})
 await page.locator('#component-menu').selectOption('hands')
 await expect.poll(()=>page.evaluate(()=>(window as any).__explodeReview.snapshot().selected)).toBe('hands')
 const before=await page.evaluate(()=>(window as any).__explodeReview.snapshot().progress)
 await page.mouse.wheel(0,-600)
 await expect.poll(()=>page.evaluate(()=>(window as any).__explodeReview.snapshot().progress)).toBeLessThan(before)
 await page.locator('#component-menu').selectOption('')
 await expect.poll(()=>page.evaluate(()=>(window as any).__explodeReview.snapshot().builtIds.length)).toBe(16)
 const end=await page.evaluate(()=>(window as any).__explodeReview.snapshot());expect(end.partPositions).toEqual(end.homePositions)
 await page.locator('#component-menu').selectOption('rotor')
 await expect.poll(()=>page.evaluate(()=>(window as any).__explodeReview.snapshot().builtIds.length)).toBe(6)
 expect(await page.evaluate(()=>(window as any).__explodeReview.snapshot().allVisible)).toBe(true)
})
