import {it,expect} from 'vitest'
import {readFileSync} from 'node:fs'
import * as T from 'three'
import {explodeSpecSchema} from '../src/spec/schema.ts'
import {inspectionStops,storyComponents,scenePartIds} from '../src/spec/scene3d.ts'
import {prepareModel} from '../src/viewer/three/loadModel.ts'
import {modelStops,stopParts} from '../src/viewer/three/model.ts'
import {poseModel} from '../src/viewer/three/choreography.ts'
import {THREE_TIMING} from '../src/viewer/three/timeline.ts'
import {componentLesson} from '../src/viewer/three/learning.ts'
const spec=explodeSpecSchema.parse(JSON.parse(readFileSync('examples/porsche-911-engine/research.json','utf8')))
// Keep exercising the legacy explode adapter; the real assembly story is
// covered separately by story-coverage, porsche and browser regressions.
if(spec.scene3d?.kind==='gltf')delete spec.scene3d.assemblyStory
it('presents true pairs once without deleting the physical inventory',()=>{
 expect(scenePartIds(spec)).toHaveLength(29)
 expect(inspectionStops(spec)).toHaveLength(26)
 const stories=storyComponents(spec)
 expect(stories).toHaveLength(26)
 expect(stories.some(c=>c.id==='crankcase-left')).toBe(false)
 expect(stories.find(c=>c.id==='crankcase')!.name).toBe('Crankcase halves')
 expect(stories.find(c=>c.id==='crankcase')!.howItsMade).toContain('two mating castings')
})
it('retains both members research and uncertainty in a shared lesson',()=>{
 const lesson=componentLesson(spec,'cylinder-heads')!
 expect(lesson.overview).toContain('Both banks')
 expect(lesson.connections.some(c=>c.includes('Exhaust system'))).toBe(true)
 expect(lesson.connections.some(c=>c.includes('Six pistons'))).toBe(true)
 expect(lesson.uncertainties).toHaveLength(2)
 expect(lesson.references.some(r=>r.id==='parts')).toBe(true)
})
it('keeps both members in focus and returns every physical piece to its own seat',()=>{
 const scene=new T.Group()
 for(const [i,id]of scenePartIds(spec).entries()){
  const node=new T.Mesh(new T.BoxGeometry(.5,.5,.5),new T.MeshStandardMaterial());node.name=id;node.position.set(i%3,Math.floor(i/3),0);scene.add(node)
 }
 const model=prepareModel(spec,{scene,animations:[]})
 try{
  const index=modelStops(model).findIndex(s=>s.id==='crankcase'),p=THREE_TIMING.inspect+(index+.5)*(THREE_TIMING.reassemble-THREE_TIMING.inspect)/modelStops(model).length
  poseModel(model,p)
  const pair=stopParts(model,index);expect(pair.map(p=>p.id)).toEqual(['crankcase-left','crankcase-right'])
  for(const part of pair)expect(part.group.position.distanceTo(part.opened)).toBeLessThan(1e-9)
  const other=model.parts.find(p=>p.id==='fan')!;expect(other.group.position.y).toBeLessThan(other.opened.y-10)
  const heads=modelStops(model).findIndex(s=>s.id==='cylinder-heads'),headProgress=THREE_TIMING.inspect+(heads+.5)*(THREE_TIMING.reassemble-THREE_TIMING.inspect)/modelStops(model).length
  poseModel(model,headProgress)
  const packed=stopParts(model,heads)
  expect(packed[0]!.group.position.distanceTo(packed[1]!.group.position)).toBeLessThan(packed[0]!.opened.distanceTo(packed[1]!.opened))
  const forward=packed.map(p=>p.group.position.toArray())
  poseModel(model,1);poseModel(model,headProgress)
  expect(packed.map(p=>p.group.position.toArray())).toEqual(forward)
  for(const progress of [1,0]){poseModel(model,progress);for(const part of model.parts){expect(part.group.position.distanceTo(part.home)).toBeLessThan(1e-9);expect(part.group.visible).toBe(true)}}
 }finally{model.dispose()}
})
it('rejects overlapping or nonexistent group members and ID collisions',()=>{
 if(spec.scene3d?.kind!=='gltf')throw Error('fixture')
 for(const patch of [{id:'crankcase-left'},{componentIds:['crankcase-left','missing']},{componentIds:['crankcase-left','crankcase-left']}]){
  const bad=structuredClone(spec);if(bad.scene3d?.kind!=='gltf')throw Error('fixture');Object.assign(bad.scene3d.inspectionGroups![2]!,patch)
  expect(explodeSpecSchema.safeParse(bad).success).toBe(false)
 }
})
