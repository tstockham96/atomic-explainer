import {experienceFingerprint} from './fingerprint.mjs';
// Record the real packaged study. No provider calls, and no quality scores are
// inferred from successful renders. Use a running local studio, not a web URL.
import {chromium} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base=process.env.EXPLODE_EVAL_URL??'http://127.0.0.1:4319';
if(!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base))throw Error('Use a local studio URL');
const out='evals/reports/current';await mkdir(out,{recursive:true});
const keep=new Set(['motion-check','inspection-check','component-material-inventory','glass-transmission-check','component-review-20','component-review-37','component-review-50']);
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||undefined});
try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('http://127.0.0.1:4320/capture',async route=>{
  if(route.request().method()==='POST'){
   const data=route.request().postDataJSON();
   if(keep.has(data.name))await writeFile(`${out}/${data.name}.${data.image?'png':'json'}`,data.image?Buffer.from(data.image.split(',')[1],'base64'):JSON.stringify(data,null,2)+'\n');
  }
  await route.fulfill({status:200,headers:{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Content-Type'},body:'ok'});
 });
 await page.goto(`${base}/murph-study/index.html?eval=1&story=explode&capture=1&turns=1&motion=1&optics=1&no-export=1`);
 await page.waitForFunction(()=>window.__explodeReview?.ready,{},{timeout:120000});
 if(errors.length)throw Error(errors.join('\n'));
 await page.locator('#motion').click();
 await page.screenshot({path:`${out}/desktop.png`});
 for(const id of ['crystal','hands','rotor','rear-window']){
  await page.evaluate(id=>window.__explodeReview.inspect(id,.2),id);
  await page.screenshot({path:`${out}/${id}.png`});
 }
 await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await page.evaluate(()=>window.__explodeReview.inspect('rotor',.2));
 await page.screenshot({path:`${out}/mobile.png`});
 const resources=await page.evaluate(()=>performance.getEntriesByType('resource').filter(r=>/murph-researched.glb|study.js|studio-small-09.hdr/.test(r.name)).map(r=>({file:new URL(r.name).pathname,durationMs:r.duration,bytes:r.decodedBodySize})));
 const hash=async file=>createHash('sha256').update(await readFile(file)).digest('hex');
 await writeFile(`${out}/capture.json`,JSON.stringify({recordedAt:new Date().toISOString(),experienceSha256:await experienceFingerprint(),assetSha256:await hash('public/models/murph/murph.glb'),viewerSha256:await hash('tools/murph-study/viewer.ts'),htmlSha256:await hash('tools/murph-study/index.html'),resources,note:'Local headless Chrome measurements; not field performance, mobile GPU measurements, or independent visual approval.'},null,2)+'\n');
 console.log(`Recorded actual packaged-asset views and checks in ${out}`);
}finally{await browser.close()}
