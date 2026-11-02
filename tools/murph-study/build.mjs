import {build} from 'esbuild';
import {mkdir,copyFile,writeFile,readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const here=path.dirname(fileURLToPath(import.meta.url));
const args=process.argv.slice(2),packaged=args[0]==='--packaged';
const [dial,strap,hdr,out]=packaged?['packaged','packaged',path.join(here,'../../public/models/murph/studio-small-09.hdr'),args[1]??'dist-site/murph-study']:args;
if(!dial||!strap||!hdr||!out)throw Error('Usage: node tools/murph-study/build.mjs <clean-dial.png> <strap-source.glb> <studio.hdr> <output-directory>');
await mkdir(out,{recursive:true});
if(packaged){await copyFile(path.join(here,'../../public/models/murph/murph.glb'),path.join(out,'murph-researched.glb'))}else{await copyFile(dial,path.join(out,'dial-clean.png'));await copyFile(strap,path.join(out,'strap-source.glb'));}
await writeFile(path.join(out,'model-source.json'),JSON.stringify(packaged?{kind:'gltf',url:'murph-researched.glb'}:{kind:'authoring'}));
if(packaged)await copyFile(path.join(here,'../../public/models/murph/ATTRIBUTION.md'),path.join(out,'ATTRIBUTION.md'));
for(const pkg of ['outfit','fraunces'])await copyFile(path.join(here,'../../node_modules/@fontsource',pkg,'LICENSE'),path.join(out,`${pkg}-LICENSE.txt`));
for(const [pkg,name]of [['outfit','outfit-latin-400-normal.woff2'],['fraunces','fraunces-latin-400-normal.woff2']])await copyFile(path.join(here,'../../node_modules/@fontsource',pkg,'files',name),path.join(out,name));
await copyFile(hdr,path.join(out,'studio-small-09.hdr'));
await copyFile(path.join(here,'../../docs/research/murph-study.json'),path.join(out,'study.json'));
await copyFile(path.join(here,'index.html'),path.join(out,'index.html'));
await build({entryPoints:[path.join(here,'viewer.ts')],bundle:true,format:'esm',outfile:path.join(out,'study.js')});
// Audit the shipped GLB, not the authoring scene; keep structural and visual verdicts separate.
if(packaged){
 const {tsImport}=await import('tsx/esm/api');
 const {auditMaterials}=await tsImport('../../src/evals/materials.ts',import.meta.url);
 await writeFile(path.join(out,'material-review.json'),JSON.stringify(auditMaterials(await readFile(path.join(out,'murph-researched.glb'))),null,2));
}
console.log('Research-led Murph study built.');
