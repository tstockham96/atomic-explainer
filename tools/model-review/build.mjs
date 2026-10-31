#!/usr/bin/env node
import { build } from 'esbuild';
import { mkdir, copyFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const [input,output]=process.argv.slice(2);
if(!input||!output)throw Error('Usage: node tools/model-review/build.mjs <review-manifest.json> <output-directory>');
const manifest=JSON.parse(await readFile(input,'utf8'));
await mkdir(output,{recursive:true});
for(const name of [manifest.model,manifest.reference,'parts.png']){
 if(typeof name!=='string'||path.isAbsolute(name)||name.split(/[\\/]/).includes('..'))throw Error('Review assets must be relative to the manifest');
 const target=path.join(output,name);await mkdir(path.dirname(target),{recursive:true});
 await copyFile(path.resolve(path.dirname(input),name),target);
}
await copyFile(input,path.join(output,'review.json'));
await copyFile(path.join(here,'index.html'),path.join(output,'index.html'));
await build({entryPoints:[path.join(here,'viewer.ts')],bundle:true,format:'esm',outfile:path.join(output,'review.js')});
console.log('Review built. Serve the output directory over local HTTP.');
