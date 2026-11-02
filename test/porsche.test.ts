import {describe,it,expect} from 'vitest'
import {readFileSync} from 'node:fs'
import * as T from 'three'
import {buildEngine} from '../tools/porsche-study/model.ts'
import {explodeSpecSchema} from '../src/spec/schema.ts'
import {assemblyRequirementsSchema} from '../src/spec/requirements.ts'
import {glbComponentIds} from '../src/evals/inventory.ts'
import {auditCompleteness} from '../src/pipeline/completeness.ts'
import {prepareModel} from '../src/viewer/three/loadModel.ts'
import {poseModel,cameraShot,corners,STORY_FOV} from '../src/viewer/three/choreography.ts'
import {modelStops,stopBounds} from '../src/viewer/three/model.ts'
import {THREE_TIMING} from '../src/viewer/three/timeline.ts'
const base='examples/porsche-911-engine/'
const spec=explodeSpecSchema.parse(JSON.parse(readFileSync(base+'research.json','utf8')))
const required=assemblyRequirementsSchema.parse(JSON.parse(readFileSync(base+'requirements.json','utf8')))
describe('Porsche engine assembly',()=>{
 it('exports the independent internal inventory as actual geometry',()=>{
  const bytes=readFileSync(base+'models/engine.glb')
  const ids=glbComponentIds(bytes)
  const report=auditCompleteness(required,spec,ids)
  expect(report.status).toBe('coverage-complete')
  expect(report.ready).toBe(false) // coverage must never certify fidelity
  expect(ids.length).toBe(29)
  for(const id of ['pistons','connecting-rods','crankshaft','valvetrain','timing-chains','oil-pump'])expect(ids).toContain(id)
  expect(bytes.length).toBeLessThan(25*1024*1024)
 })
 it('has open cylinder bores, not solid textured cylinders',()=>{
  const root=buildEngine();root.updateMatrixWorld(true)
  const bank=root.getObjectByName('cylinders-left')!
  const ray=new T.Raycaster(new T.Vector3(-400,0,-150),new T.Vector3(1,0,0))
  expect(ray.intersectObject(bank,true)).toHaveLength(0)
  ray.ray.origin.y=45
  expect(ray.intersectObject(bank,true).length).toBeGreaterThan(0)
 })
 it('closes each combustion chamber and keeps case walls aligned with the shaft',()=>{
  const root=buildEngine();root.updateMatrixWorld(true)
  const head=root.getObjectByName('heads-left')!
  const ray=new T.Raycaster(new T.Vector3(-400,0,-138),new T.Vector3(1,0,0))
  expect(ray.intersectObject(head,true).length).toBeGreaterThan(0)
  for(const id of ['crankcase-left','crankcase-right']){
   const size=new T.Box3().setFromObject(root.getObjectByName(id)!).getSize(new T.Vector3())
   expect(size.z).toBeGreaterThan(370)
   expect(size.y).toBeLessThan(190)
   const side=id==='crankcase-left'?-1:1
   for(const z of [-120+side*30,side*30,120+side*30]){
    const bore=new T.Raycaster(new T.Vector3(side*400,0,z),new T.Vector3(-side,0,0),0,330)
    expect(bore.intersectObject(root.getObjectByName(id)!,true),id+' bore '+z).toHaveLength(0)
   }
  }
 })
 it('fits every engine part through its complete inspection turn and seats it at the end',()=>{
  const model=prepareModel(spec,{scene:buildEngine(),animations:[]})
  try {
   for(const aspect of [1440/900,390/844])for(let i=0;i<modelStops(model).length;i++)for(const local of [.28,.39,.5,.61,.72]){
    const p=THREE_TIMING.inspect+(i+local)*(THREE_TIMING.reassemble-THREE_TIMING.inspect)/modelStops(model).length
    poseModel(model,p);const shot=cameraShot(model,p,aspect)
    const camera=new T.PerspectiveCamera(STORY_FOV,aspect,.05,300);camera.position.copy(shot.position);camera.lookAt(shot.target);camera.updateMatrixWorld()
    const points=corners(stopBounds(model,i)).map(p=>p.project(camera))
    expect(points.every(p=>Math.abs(p.x)<1&&Math.abs(p.y)<1),modelStops(model)[i]!.id).toBe(true)
   }
   poseModel(model,1)
   model.parts.forEach(p=>expect(p.group.position.distanceTo(p.home)).toBeLessThan(1e-9))
  } finally {model.dispose()}
 })
})
