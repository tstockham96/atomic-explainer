import {it,expect} from 'vitest'
import * as T from 'three'
import {readFileSync} from 'node:fs'
import {surfaceFinish,finishUV,prepareFinishUVs} from '../src/authoring/finishes.ts'
import {removeUnmappedOcclusion} from '../src/authoring/import-materials.ts'
import {auditMaterials} from '../src/evals/materials.ts'

it('maps equal physical distances equally across sizes, including backs and bevels',()=>{
 for(const size of [2,200]){
  const source=new T.BoxGeometry(size,size,size),geo=finishUV(source,4),p=geo.getAttribute('position'),uv=geo.getAttribute('uv')
  for(let i=0;i<p.count;i+=3){
   const a=new T.Vector3().fromBufferAttribute(p,i),b=new T.Vector3().fromBufferAttribute(p,i+1)
   expect(Math.hypot(uv.getX(i)-uv.getX(i+1),uv.getY(i)-uv.getY(i+1))*4).toBeCloseTo(a.distanceTo(b),4)
   const area=(uv.getX(i+1)-uv.getX(i))*(uv.getY(i+2)-uv.getY(i))-(uv.getY(i+1)-uv.getY(i))*(uv.getX(i+2)-uv.getX(i))
   expect(Math.abs(area)).toBeGreaterThan(0)
  }
 }
})
it('preserves source maps and UVs while preparing opted-in authored surfaces',()=>{
 const root=new T.Group(),source=new T.Mesh(new T.BoxGeometry(),new T.MeshStandardMaterial({map:new T.Texture()})),original=source.geometry.getAttribute('uv')
 const authored=new T.Mesh(new T.BoxGeometry(10,10,10),surfaceFinish('pcb'));root.add(source,authored);prepareFinishUVs(root)
 expect(source.geometry.getAttribute('uv')).toBe(original)
 expect((source.material as T.MeshStandardMaterial).map).not.toBeNull()
 expect(authored.material.metalness).toBe(0)
 expect(authored.material.normalMap!.colorSpace).toBe(T.NoColorSpace)
})
it('keeps portable finish textures and declared scale in the actual engine export',()=>{
 const report=auditMaterials(readFileSync('examples/porsche-911-engine/models/engine.glb'))
 expect(report.issues).toEqual([]);expect(report.components).toHaveLength(29)
 for(const material of report.materials){expect(material.finish).not.toBeNull();expect(material.normalMap).toBe(true);expect(material.roughnessMap).toBe(true)}
 expect(report.ready).toBe(false)
})
it('detects a declared finish whose normal texture was dropped after export',()=>{
 const b=readFileSync('examples/porsche-911-engine/models/engine.glb'),doc=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString())
 delete doc.materials[0].normalTexture
 const json=Buffer.from(JSON.stringify(doc)),length=Math.ceil(json.length/4)*4,output=Buffer.alloc(20+length,32)
 b.copy(output,0,0,20);output.writeUInt32LE(output.length,8);output.writeUInt32LE(length,12);json.copy(output,20)
 expect(auditMaterials(output).issues.some(i=>i.includes('lost normal'))).toBe(true)
})

it('removes only an invalid source occlusion binding without inventing UVs',()=>{
 const root=new T.Group(),map=new T.Texture(),aoMap=new T.Texture();aoMap.channel=1
 const material=new T.MeshStandardMaterial({map,aoMap}),valid=new T.Mesh(new T.BoxGeometry(),material),invalid=new T.Mesh(new T.BoxGeometry(),material)
 valid.geometry.setAttribute('uv1',valid.geometry.getAttribute('uv').clone());root.add(valid,invalid)
 expect(removeUnmappedOcclusion(root)).toHaveLength(1)
 expect(valid.material).toBe(material);expect(valid.material.aoMap).toBe(aoMap)
 expect(invalid.material.map).toBe(map);expect(invalid.material.aoMap).toBeNull();expect(invalid.geometry.hasAttribute('uv1')).toBe(false)
 expect(invalid.material.userData.materialRepair.visualStatus).toBe('pending')
})
it('does not pull curved-edge normals into planar cap faces',()=>{
 const geometry=new T.ExtrudeGeometry(new T.Shape().moveTo(0,0).lineTo(10,0).lineTo(10,10).lineTo(0,10).closePath(),{depth:2,bevelEnabled:true,bevelSize:.2,bevelThickness:.2,bevelSegments:2})
 const before=geometry.getAttribute('normal'),mesh=new T.Mesh(geometry,surfaceFinish('cast'));prepareFinishUVs(mesh)
 const after=mesh.geometry.getAttribute('normal')
 for(let i=0;i<before.count;i++)if(Math.abs(before.getZ(i))>.99999)expect(after.getZ(i)).toBe(before.getZ(i))
})

it('exports textured metal on every Murph mechanism group, without legacy bump extensions',()=>{
 const report=auditMaterials(readFileSync('public/models/murph/murph.glb'))
 expect(report.issues).toEqual([])
 for(const id of ['movement','rotor','mainspring','barrel','wheel-train','winding-train','escapement','balance']){
  const component=report.components.find(c=>c.componentId===id)!
  const finishes=component.materialIndices.map(i=>report.materials[i]!).filter(m=>m.finish)
  expect(finishes.length,id).toBeGreaterThan(0)
  for(const finish of finishes){expect(finish.normalMap,id).toBe(true);expect(finish.roughnessMap,id).toBe(true);expect(finish.metalness,id).toBe(1)}
 }
 expect(report.ready).toBe(false) // Texture presence never grants a visual pass.
})
