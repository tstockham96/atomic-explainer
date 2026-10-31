import {it,expect} from 'vitest'
import {mkdtemp,readFile,readdir,rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {runExplode} from '../src/pipeline/run.ts'
import {glbComponentIds} from '../src/evals/inventory.ts'
it('a second product produces a component plan without pretending to generate geometry',async()=>{
 const outDir=await mkdtemp(path.join(tmpdir(),'explode-plan-'))
 try{
  await runExplode({specPath:'evals/cases/iphone-18-pro.json',planOnly:true,outDir})
  expect((await readdir(outDir)).sort()).toEqual(['assembly-requirements.json','construction-plan.json','research.json'])
  const plan=JSON.parse(await readFile(path.join(outDir,'construction-plan.json'),'utf8'))
  expect(plan.components).toHaveLength(11)
  expect(JSON.stringify(plan)).not.toContain('rotor')
 }finally{await rm(outDir,{recursive:true,force:true})}
})
it('planning cannot silently opt into paid model or motion generation',async()=>{
 await expect(runExplode({planOnly:true,three:true,outDir:'unused'})).rejects.toThrow('not both')
 await expect(runExplode({planOnly:true,motion:true,outDir:'unused'})).rejects.toThrow('not both')
})
function glb(doc:object){const json=Buffer.from(JSON.stringify(doc).padEnd(Math.ceil(JSON.stringify(doc).length/4)*4,' ')),header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(20+json.length,8);header.writeUInt32LE(json.length,12);header.writeUInt32LE(0x4e4f534a,16);return Buffer.concat([header,json])}
it('coverage counts visible-scene geometry, not empty named groups or orphan meshes',()=>{
 expect(glbComponentIds(glb({scene:0,scenes:[{nodes:[0,1]}],nodes:[{extras:{componentId:'empty'}},{extras:{componentId:'display'},children:[2]},{mesh:0},{extras:{componentId:'orphan'},mesh:0}],meshes:[{primitives:[{attributes:{POSITION:0}}]}],accessors:[{count:3}]}))).toEqual(['display'])
})
it('coverage rejects corrupt and cyclic assets',()=>{
 expect(()=>glbComponentIds(new Uint8Array([1,2,3]))).toThrow('Invalid GLB')
 expect(()=>glbComponentIds(glb({scenes:[{nodes:[0]}],nodes:[{children:[0]}]}))).toThrow('hierarchy')
})
