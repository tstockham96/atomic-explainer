// Local-only authored reconstruction. Source geometry has separate rights.
import { build } from 'esbuild';
import { chromium } from '@playwright/test';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { renderSite } from '../../src/pipeline/render-site.ts';
import { explodeSpecSchema } from '../../src/spec/schema.ts';
const base=path.resolve('examples/iphone-18-pro'),out=path.resolve(process.argv[2]??'dist-site/iphone-study'),template=path.resolve(process.argv[3]??'dist-site');
await readFile(path.join(base,'assets.local/apple-reference.glb')); // fail before launching when source is absent
const result=await build({entryPoints:['tools/iphone-study/model.ts'],bundle:true,format:'esm',write:false});
const server=createServer(async(req,res)=>{try{
 const name=new URL(req.url,'http://localhost').pathname;
 if(name==='/index.html'){res.setHeader('Content-Type','text/html');res.end('<script type="module" src="/model.js"></script>')}
 else if(name==='/model.js'){res.setHeader('Content-Type','text/javascript');res.end(result.outputFiles[0].contents)}
 else if(name==='/apple-reference.glb'){res.setHeader('Content-Type','model/gltf-binary');res.end(await readFile(path.join(base,'assets.local/apple-reference.glb')))}
 else if(name==='/exterior-study.json'){res.setHeader('Content-Type','application/json');res.end(await readFile(path.join(base,'exterior-study.json')))}
 else {res.statusCode=404;res.end('Not found')}
 }catch{res.statusCode=500;res.end('Asset unavailable')}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
let browser;
try{
 browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||undefined});
 const page=await browser.newPage({acceptDownloads:true}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`http://127.0.0.1:${server.address().port}/index.html`);
 await page.waitForFunction(()=>window.ready,null,{timeout:90000});
 const [download]=await Promise.all([page.waitForEvent('download',{timeout:180000}),page.evaluate(()=>window.exportModel())]);
 await download.saveAs(path.join(base,'assets.local/internal-study.glb'));
 if(errors.length)throw Error(errors.join('\n'));
}finally{await browser?.close();await new Promise(resolve=>server.close(resolve))}
const spec=explodeSpecSchema.parse(JSON.parse(await readFile(path.join(base,'internal-study.json'),'utf8')));
await renderSite(spec,out,{templateDir:template,assetRoot:base,requirementsPath:path.join(base,'requirements.json')});
console.log(`Built researched internal assembly: ${out}. Inspect fidelity before approval.`);
