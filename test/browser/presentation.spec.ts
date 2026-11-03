import {test,expect} from '@playwright/test'
for(const width of [1440,390])test(`settings preserve component poses, glass and navigation at ${width}`,async({page},info)=>{
 await page.setViewportSize({width,height:width===1440?900:844})
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().includes('/presentation/')&&!r.ok())errors.push(`Asset ${r.status()}: ${r.url()}`)})
 await page.goto('/murph-study/index.html?eval=1')
 await page.waitForFunction(()=>Boolean((window as any).__explodeReview?.ready),null,{timeout:90000})
 const snap=()=>page.evaluate(()=>(window as any).__explodeReview.snapshot())
 await page.evaluate(()=>(window as any).__explodeReview.seek(0));const initial=await snap();expect(initial.setting).toBe('workbench');expect(initial.unobscuredParts.length,'opening subject must not be behind scenery').toBeGreaterThan(0);expect(initial.workshopAssets).toEqual(['atelier/workshop.glb','atelier/workshop-probe.hdr']);await expect(page.getByLabel('Scene setting').locator('option')).toHaveCount(2)
 expect(initial.cameraDirection[0]).toBeCloseTo(0,8);expect(initial.cameraDirection[1]).toBeLessThan(-.98);expect(initial.cameraDirection[2]).toBeGreaterThan(0);expect(initial.cameraDirection[2]).toBeLessThan(.2);expect(initial.gridSpacing).toBe(10);expect(initial.partPositions).toEqual(initial.homePositions)
 await page.evaluate(()=>(window as any).__explodeReview.inspect('movement-system',.35));const before=await snap()
 for(const setting of ['workbench','plain']){
  await page.getByLabel('Scene setting').selectOption(setting)
  const state=await snap();expect(state.setting).toBe(setting);expect(state.selected).toBe('movement-system');expect(state.partPositions).toEqual(before.partPositions);expect(state.allVisible).toBe(true);expect(state.optics).toEqual(initial.optics)
  const menu=await page.getByLabel('Scene setting').boundingBox(),header=await page.locator('header').boundingBox()
  expect(menu!.x+menu!.width).toBeLessThanOrEqual(width);expect(menu!.x).toBeGreaterThan(header!.x+header!.width)
  if(setting!=='plain')await page.screenshot({path:info.outputPath(`${setting}-movement.png`)})
 }
 await page.getByLabel('Scene setting').selectOption('workbench')
 for(const id of ['crystal','rear-window']){
  await page.evaluate(id=>(window as any).__explodeReview.inspect(id,.3),id)
  const state=await snap();state.cameraDirection.forEach((v:number,i:number)=>expect(v).toBeCloseTo(initial.cameraDirection[i],8));expect(state.deskMatrix).toEqual(initial.deskMatrix);expect(state.optics).toEqual(initial.optics);expect(state.optics.every((m:any)=>m.opacity===1&&m.transmission===1)).toBe(true);expect(state.allVisible).toBe(true)
  await page.screenshot({path:info.outputPath(`${id}.png`)})
 }
 await page.evaluate(()=>(window as any).__explodeReview.seek(1));expect((await snap()).partPositions).toEqual(initial.homePositions)
 await page.getByLabel('Scene setting').selectOption('plain');await page.getByLabel('Go to component').selectOption('mainspring');expect((await snap()).selected).toBe('mainspring')
 expect(errors).toEqual([])
})
test('the same world-space settings work on a second object',async({page},info)=>{
 await page.goto('/construction-fixtures/assembly-story/index.html?eval=1');await page.waitForFunction(()=>Boolean(window.__explodeAssemblyReview),null,{timeout:60000})
 await page.getByLabel('Explore a component').selectOption('chapter:powered-core')
 await expect.poll(()=>page.evaluate(()=>window.__explodeAssemblyReview!.snapshot().selected)).toBe('powered-core')
 for(const setting of ['workbench','plain']){
  await page.getByLabel('Scene setting').selectOption(setting);await expect.poll(()=>page.evaluate(()=>window.__explodeAssemblyReview!.snapshot().setting)).toBe(setting)
  const state=await page.evaluate(()=>window.__explodeAssemblyReview!.snapshot());expect(state.selectedParts).toEqual(['logic-board','battery']);expect(state.allVisible).toBe(true)
 }
 await page.getByLabel('Scene setting').selectOption('workbench');await page.waitForTimeout(1000);await page.screenshot({path:info.outputPath('generic-workbench.png')})
})

test('workshop handoffs keep a physical part in view and Original survives reload',async({page},info)=>{
 test.slow() // 144 rendered handoff positions plus two complete scene reloads.
 await page.goto('/murph-study/index.html?eval=1');await page.waitForFunction(()=>Boolean((window as any).__explodeReview?.ready),null,{timeout:90000})
 const chapters=await page.locator('#component-menu option').evaluateAll(options=>options.map(o=>(o as HTMLOptionElement).value).filter(id=>id&&id!=='opening'))
 for(const [index,id] of chapters.entries()){
  for(const local of [.02,.07,.13,.18,.78,.86,.94,.999]){
   await page.evaluate(({id,local})=>(window as any).__explodeReview.inspect(id,local),{id,local})
   const state=await page.evaluate(()=>(window as any).__explodeReview.snapshot())
   expect(state.partsInView.length,`${id} at ${local}`).toBeGreaterThan(0)
   expect(state.lighting.source).toBe('bench_key');expect(state.lighting.castsShadow).toBe(true)
  }
  if(index===2||id==='movement-system')await page.screenshot({path:info.outputPath(`${id}-handoff.png`)})
 }
 await page.getByLabel('Scene setting').selectOption('plain');await page.reload();await page.waitForFunction(()=>Boolean((window as any).__explodeReview?.ready),null,{timeout:90000})
 await expect(page.getByLabel('Scene setting')).toHaveValue('plain')
 await page.getByLabel('Scene setting').selectOption('workbench');await page.reload();await page.waitForFunction(()=>Boolean((window as any).__explodeReview?.ready),null,{timeout:90000})
 await expect(page.getByLabel('Scene setting')).toHaveValue('workbench')
})
