import * as T from 'three'
import {z} from 'zod'
import {ease} from './timeline.ts'
import {inspectionDistance,turnAboutCenter} from './inspection.ts'

export const assemblyStorySchema=z.object({
 title:z.string().min(1),note:z.string().min(1),closing:z.object({title:z.string(),description:z.string()}),
 chapters:z.array(z.object({id:z.string().min(1),componentIds:z.array(z.string()).min(1),title:z.string().min(1),description:z.string().min(1),joined:z.string().min(1),detail:z.string().optional(),from:z.tuple([z.number(),z.number(),z.number()]).default([.25,.15,1]),approach:z.tuple([z.number(),z.number(),z.number()]).default([0,0,1])})).min(1)
}).superRefine((story,ctx)=>{const ids=new Set<string>(),members=new Set<string>();for(const c of story.chapters){if(ids.has(c.id))ctx.addIssue({code:'custom',message:'Duplicate story chapter'});ids.add(c.id);for(const id of c.componentIds){if(members.has(id))ctx.addIssue({code:'custom',message:'A component can join only once'});members.add(id)}if(Math.hypot(...c.from)<.001||Math.hypot(...c.approach)<.001)ctx.addIssue({code:'custom',message:'Story directions must be nonzero'})}})
export type AssemblyStory=z.infer<typeof assemblyStorySchema>
export const ASSEMBLY_END=.94
export function assemblySample(progress:number,count:number){
 const p=T.MathUtils.clamp(progress,0,1),complete=p>=ASSEMBLY_END,index=complete?count-1:Math.min(count-1,Math.floor(p/ASSEMBLY_END*count)),local=complete?1:p/ASSEMBLY_END*count-index
 const arrival=index===0?1:ease(local/.18),focus=arrival*(1-ease((local-.58)/.18)),join=ease((local-.76)/.16)
 return {index,local,complete,arrival,focus,join,turn:ease((local-.2)/.36)*Math.PI*2}
}

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
  root.updateMatrixWorld(true)
  const overviewBox=(s.index?builtBoxes[s.index-1]!:chapterBoxes[0]!).clone()
  if(s.local>=.58)overviewBox.union(chapterBoxes[s.index]!.clone().translate(approach.clone().multiplyScalar(1-s.join)))
  return {...s,chapter,inspectionBox,overviewBox:s.complete?whole.clone():overviewBox,builtIds:chapters.slice(0,s.complete?chapters.length:s.index+(s.join===1?1:0)).flatMap(c=>c.componentIds)}
 }
 return {story,pose,whole,homes,progressFor:(id:string,local=.4)=>{const i=chapters.findIndex(c=>c.id===id||c.componentIds.includes(id));if(i<0)throw Error('Unknown assembly chapter '+id);return (i+local)/chapters.length*ASSEMBLY_END},
 camera:(state:ReturnType<typeof pose>,fov:number,aspect:number,coverage:[number,number])=>{
  const inspection=state.inspectionBox.getCenter(new T.Vector3()),overview=state.overviewBox.getCenter(new T.Vector3()),direction=new T.Vector3(...state.chapter.from).normalize(),hero=new T.Vector3(...chapters[state.local<.58?Math.max(0,state.index-1):state.index]!.from).normalize()
  // Use a fixed inspection radius through the turn; spherical interpolation
  // prevents a front-to-back camera chord through the accumulating assembly.
  const from=new T.Spherical().setFromVector3(hero),to=new T.Spherical().setFromVector3(direction),delta=T.MathUtils.euclideanModulo(to.theta-from.theta+Math.PI,Math.PI*2)-Math.PI
  const focus=state.complete?0:state.focus,target=overview.lerp(inspection,focus)
  const distance=T.MathUtils.lerp(inspectionDistance(state.overviewBox,fov,aspect,coverage),inspectionDistance(state.inspectionBox,fov,aspect,coverage),focus)
  const offset=new T.Vector3().setFromSpherical(new T.Spherical(distance,T.MathUtils.lerp(from.phi,to.phi,focus),from.theta+delta*focus))
  return {target,position:target.clone().add(offset)}
 }
 }
}
