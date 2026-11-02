import * as T from 'three'
import {ease} from './timeline.ts'
import {inspectionDistance,turnAboutCenter} from './inspection.ts'

import {assemblyStorySchema} from '../../spec/assembly-story.ts'
export {assemblyStorySchema} from '../../spec/assembly-story.ts'
export type {AssemblyStory} from '../../spec/assembly-story.ts'
import {assemblySample,assemblyProgress} from './assemblyTimeline.ts'
export {assemblySample,assemblyProgress,ASSEMBLY_START,ASSEMBLY_END} from './assemblyTimeline.ts'

/** Object-independent, scroll-reversible accumulation. Every physical node stays
 * present. Future/context parts travel outside the frame, never change opacity.
 * Input groups share one untransformed parent; home transforms remain immutable. */
export function createAssemblyStory(root:T.Object3D,parts:Record<string,T.Object3D>,input:unknown){
 const story=assemblyStorySchema.parse(input),chapters=story.chapters
 const ids=chapters.flatMap(c=>c.componentIds)
 if(ids.length!==Object.keys(parts).length||ids.some(id=>!parts[id]))throw Error('Assembly story must include every modeled component exactly once')
 root.updateMatrixWorld(true)
 const homes=Object.fromEntries(Object.entries(parts).map(([id,p])=>[id,{position:p.position.clone(),quaternion:p.quaternion.clone(),box:new T.Box3().setFromObject(p,true)}]))
 const whole=new T.Box3();Object.values(homes).forEach(h=>whole.union(h.box))
 const scale=Math.max(whole.getSize(new T.Vector3()).length(),1),parking=scale*6
 const chapterBoxes=chapters.map(c=>{const b=new T.Box3();c.componentIds.forEach(id=>b.union(homes[id]!.box));return b})
 const builtBoxes=chapterBoxes.map((_,i)=>{const b=new T.Box3();chapterBoxes.slice(0,i+1).forEach(box=>b.union(box));return b})
 const pose=(progress:number)=>{
  const s=assemblySample(progress,chapters.length),chapter=chapters[s.index]!,approach=new T.Vector3(...chapter.approach).normalize().multiplyScalar(scale*.48)
  for(const [i,c]of chapters.entries())for(const id of c.componentIds){
   const p=parts[id]!,h=homes[id]!;p.position.copy(h.position);p.quaternion.copy(h.quaternion)
   if(s.complete)continue
   if(i<s.index)p.position.x-=parking*s.focus
   else if(i>s.index)p.position.addScaledVector(new T.Vector3(...c.approach).normalize(),scale*.48).add(new T.Vector3(parking,0,0))
   else p.position.addScaledVector(approach,1-s.join).add(new T.Vector3(parking*(1-s.arrival),0,0))
  }
  const inspectionBox=chapterBoxes[s.index]!.clone().translate(approach),center=inspectionBox.getCenter(new T.Vector3())
  if(!s.complete&&s.local>=.18&&s.local<=.58)for(const id of chapter.componentIds)turnAboutCenter(parts[id]!,s.turn,center)
  if(s.opening)for(const id of ids)parts[id]!.position.lerpVectors(homes[id]!.position,parts[id]!.position,s.reveal)
  root.updateMatrixWorld(true)
  const overviewBox=(s.index?builtBoxes[s.index-1]!:chapterBoxes[0]!).clone()
  if(s.local>=.58)overviewBox.union(chapterBoxes[s.index]!.clone().translate(approach.clone().multiplyScalar(1-s.join)))
  return {...s,chapter,inspectionBox,overviewBox:s.complete?whole.clone():overviewBox,builtIds:chapters.slice(0,s.complete?chapters.length:s.index+(s.join===1?1:0)).flatMap(c=>c.componentIds)}
 }
 return {story,pose,whole,homes,progressFor:(id:string,local=.4)=>{const i=chapters.findIndex(c=>c.id===id||c.componentIds.includes(id));if(i<0)throw Error('Unknown assembly chapter '+id);return assemblyProgress(i,local,chapters.length)},
 camera:(state:ReturnType<typeof pose>,fov:number,aspect:number,coverage:[number,number])=>{
  const inspection=state.inspectionBox.getCenter(new T.Vector3()),overview=state.overviewBox.getCenter(new T.Vector3()),direction=new T.Vector3(...state.chapter.from).normalize(),hero=new T.Vector3(...chapters[state.local<.58?Math.max(0,state.index-1):state.index]!.from).normalize()
  // Use a fixed inspection radius through the turn; spherical interpolation
  // prevents a front-to-back camera chord through the accumulating assembly.
  const from=new T.Spherical().setFromVector3(hero),to=new T.Spherical().setFromVector3(direction),delta=T.MathUtils.euclideanModulo(to.theta-from.theta+Math.PI,Math.PI*2)-Math.PI
  const focus=state.complete?0:state.focus,target=overview.lerp(inspection,focus)
  const distance=T.MathUtils.lerp(inspectionDistance(state.overviewBox,fov,aspect,coverage),inspectionDistance(state.inspectionBox,fov,aspect,coverage),focus)
  const offset=new T.Vector3().setFromSpherical(new T.Spherical(distance,T.MathUtils.lerp(from.phi,to.phi,focus),from.theta+delta*focus))
  if(state.opening){
   const start=new T.Vector3(...story.opening.from).normalize(),a=new T.Spherical().setFromVector3(start),b=new T.Spherical().setFromVector3(direction)
   const theta=T.MathUtils.euclideanModulo(b.theta-a.theta+Math.PI,Math.PI*2)-Math.PI,k=state.reveal
   target.lerpVectors(whole.getCenter(new T.Vector3()),inspection,k)
   offset.setFromSpherical(new T.Spherical(T.MathUtils.lerp(inspectionDistance(whole,fov,aspect,coverage),inspectionDistance(state.inspectionBox,fov,aspect,coverage),k),T.MathUtils.lerp(a.phi,b.phi,k),a.theta+Math.PI*2*ease(state.progress/.035)+theta*k))
  }
  return {target,position:target.clone().add(offset)}
 }
 }
}
