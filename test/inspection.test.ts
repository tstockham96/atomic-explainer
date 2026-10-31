import { describe,it,expect } from 'vitest'
import * as T from 'three'
import { createInspectionTour,turnAboutCenter } from '../src/viewer/three/inspection.ts'
import { planarSurfaceUV,frontSurfaceGroups } from '../src/authoring/surface.ts'
import { buildMurphHands } from '../src/authoring/hands.ts'
import { crystalRise,murphFront } from '../src/authoring/crystal.ts'

describe('reusable component inspection',()=>{
 it('finishes a full turn at full clearance, then resumes the reversible assembly timeline',()=>{
  const tour=createInspectionTour([{id:'lens',at:.3},{id:'bracket',at:.3},{id:'motor',at:.7}])
  let last=0
  for(let i=0;i<=3000;i++){
   const s=tour.sample(i/3000);expect(s.base).toBeGreaterThanOrEqual(last-1e-12);last=s.base
   if(s.turn>.00001&&s.turn<Math.PI*2-.00001)expect(s.focus).toBe(1)
  }
  for(const id of ['lens','bracket','motor']){
   const front=tour.sample(tour.progressFor(id,.24)),back=tour.sample(tour.progressFor(id,.5)),end=tour.sample(tour.progressFor(id,.76))
   expect(front.turn).toBeCloseTo(0);expect(back.turn).toBeCloseTo(Math.PI);expect(end.turn).toBeCloseTo(2*Math.PI)
   expect(front.base).toBe(end.base)
  }
  expect(tour.sample(0).base).toBe(0);expect(tour.sample(1).base).toBe(1)
 })
 it('turns an offset component about its centre without changing its assembly pivot',()=>{
  const group=new T.Group(),mesh=new T.Mesh(new T.BoxGeometry(2,4,1));mesh.position.set(7,2,-3);group.add(mesh);group.position.set(2,1,5)
  const box=new T.Box3().setFromObject(group),center=box.getCenter(new T.Vector3()),start=group.position.clone()
  turnAboutCenter(group,Math.PI,center)
  expect(new T.Box3().setFromObject(group).getCenter(new T.Vector3()).distanceTo(center)).toBeLessThan(1e-10)
  turnAboutCenter(group,Math.PI,center)
  expect(group.position.distanceTo(start)).toBeLessThan(1e-10)
  mesh.geometry.dispose()
 })
})

describe('component surfaces',()=>{
 it('binds markings to solid front triangles without bridging holes or decorating the reverse',()=>{
  const shape=new T.Shape();shape.absarc(0,0,4,0,Math.PI*2,false)
  const hole=new T.Path();hole.absarc(0,0,1,0,Math.PI*2,true);shape.holes.push(hole)
  const geometry=frontSurfaceGroups(planarSurfaceUV(new T.ExtrudeGeometry(shape,{depth:.4,bevelEnabled:false}),8),2)
  const mesh=new T.Mesh(geometry,[new T.MeshStandardMaterial(),new T.MeshStandardMaterial(),new T.MeshStandardMaterial()]);mesh.updateMatrixWorld(true)
  const hit=(x:number,z:number,d:number)=>new T.Raycaster(new T.Vector3(x,0,z),new T.Vector3(0,0,d)).intersectObject(mesh)
  expect(hit(0,5,-1)).toHaveLength(0)
  expect(hit(2,5,-1)[0]!.face!.materialIndex).toBe(0)
  expect(hit(2,-5,1)[0]!.face!.materialIndex).toBe(2)
  const wall=new T.Raycaster(new T.Vector3(0,0,.2),new T.Vector3(1,0,0)).intersectObject(mesh)
  expect(wall[0]!.face!.materialIndex).toBe(1)
  for(const v of geometry.getAttribute('uv').array)expect(v).toBeGreaterThanOrEqual(0)
  geometry.dispose();mesh.material.forEach(m=>m.dispose())
 })
 it('keeps actual hand vertices below the curved crystal and above the dial',()=>{
  const group=new T.Group(),material=new T.MeshStandardMaterial()
  const hands=buildMurphHands(group,material,material,material,material)
  group.position.z=murphFront.handsZ;group.updateMatrixWorld(true)
  let gap=Infinity
  group.traverse(node=>{if(node instanceof T.Mesh){const positions=node.geometry.getAttribute('position');for(let i=0;i<positions.count;i++){
   const v=new T.Vector3().fromBufferAttribute(positions,i).applyMatrix4(node.matrixWorld)
   gap=Math.min(gap,murphFront.seatZ+crystalRise(Math.hypot(v.x,v.y),murphFront.profile)-v.z)
   expect(v.z).toBeGreaterThan(murphFront.dialZ+.23)
  }node.geometry.dispose()}})
  expect(gap).toBeGreaterThan(.1)
  expect(hands.hour.getObjectByName('hour_left_petal')).toBeDefined()
  expect(hands.minute.getObjectByName('minute_long_cell')).toBeDefined()
  material.dispose()
 })
})
