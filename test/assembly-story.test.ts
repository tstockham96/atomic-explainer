import {it,expect} from 'vitest'
import * as T from 'three'
import {assemblySample,assemblyProgress,ASSEMBLY_START,createAssemblyStory,assemblyStorySchema} from '../src/viewer/three/assemblyStory.ts'
const script={title:'Build a mechanism',note:'Educational order',closing:{title:'Together',description:'One assembly'},chapters:[{id:'core',componentIds:['core'],title:'Start',description:'A foundation',joined:'Ready'},{id:'pair',componentIds:['left','right'],title:'Support',description:'Matched supports',joined:'Supported'},{id:'cover',componentIds:['cover'],title:'Protect',description:'A cover',joined:'Complete'}]}
function fixture(){const root=new T.Group(),parts:Record<string,T.Object3D>={};for(const [i,id]of ['core','left','right','cover'].entries()){const part=new T.Mesh(new T.BoxGeometry(2,2,1),new T.MeshStandardMaterial());part.position.set(i===1?-2:i===2?2:0,0,i===3?1:0);root.add(part);parts[id]=part}return {root,parts}}
it('builds cumulatively, keeps paired members together and restores exact seats',()=>{
 const {root,parts}=fixture(),story=createAssemblyStory(root,parts,script)
 expect(story.pose(0).opening).toBe(true)
 for(const [id,p]of Object.entries(parts))expect(p.position).toEqual(story.homes[id]!.position)
 expect(story.pose(ASSEMBLY_START).opening).toBe(false)
 const core=story.pose(story.progressFor('core',.97));expect(core.builtIds).toEqual(['core']);expect(parts.core!.position).toEqual(story.homes.core!.position)
 const pair=story.pose(story.progressFor('pair',.97));expect(pair.builtIds).toEqual(['core','left','right']);expect(parts.left!.position).toEqual(story.homes.left!.position)
 story.pose(1);for(const [id,p]of Object.entries(parts)){expect(p.position).toEqual(story.homes[id]!.position);expect(p.quaternion.toArray()).toEqual(story.homes[id]!.quaternion.toArray());expect(p.visible).toBe(true)}
})
it('reverses every pose without history, fades or discontinuous camera boundaries',()=>{
 const {root,parts}=fixture(),story=createAssemblyStory(root,parts,script),poses:number[][]=[]
 for(let i=0;i<=300;i++){const state=story.pose(i/300);poses.push(Object.values(parts).flatMap(p=>[...p.position.toArray(),...p.quaternion.toArray()]));const shot=story.camera(state,33,1.5,[.52,.7]);expect([...shot.position,...shot.target].every(Number.isFinite)).toBe(true);for(const p of Object.values(parts)){expect(p.visible).toBe(true);expect((p as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>).material.opacity).toBe(1)}}
 for(let i=300;i>=0;i--){story.pose(i/300);expect(Object.values(parts).flatMap(p=>[...p.position.toArray(),...p.quaternion.toArray()])).toEqual(poses[i])}
 for(const p of [ASSEMBLY_START,assemblyProgress(1,0,3),assemblyProgress(2,0,3),.94]){const a=story.camera(story.pose(p-1e-7),33,1.5,[.52,.7]),b=story.camera(story.pose(p+1e-7),33,1.5,[.52,.7]);expect(a.position.distanceTo(b.position)).toBeLessThan(.001);expect(a.target.distanceTo(b.target)).toBeLessThan(.001)}
})
it('rejects duplicate seating and incomplete physical coverage',()=>{
 const {root,parts}=fixture();expect(()=>createAssemblyStory(root,parts,{...script,chapters:script.chapters.slice(1)})).toThrow('every modeled component')
 expect(assemblyStorySchema.safeParse({...script,chapters:[...script.chapters,script.chapters[0]]}).success).toBe(false)
 expect(assemblySample(1,3).complete).toBe(true)
})

it('keeps the whole object at the opening and clears context continuously toward the core',()=>{
 const {root,parts}=fixture(),story=createAssemblyStory(root,parts,script)
 for(const progress of [0,.01,.035]){story.pose(progress);for(const[id,p]of Object.entries(parts))expect(p.position).toEqual(story.homes[id]!.position)}
 let last=0
 for(let i=0;i<=100;i++){story.pose(.035+i/100*(ASSEMBLY_START-.035));const distance=parts.cover!.position.distanceTo(story.homes.cover!.position);expect(distance).toBeGreaterThanOrEqual(last);last=distance}
 const first=story.pose(story.progressFor('core',.2));expect(first.index).toBe(0);expect(first.focus).toBe(1)
 story.pose(0);for(const[id,p]of Object.entries(parts))expect(p.position).toEqual(story.homes[id]!.position)
})

it('shows a complete assembled revolution before revealing the core',()=>{
 const {root,parts}=fixture(),story=createAssemblyStory(root,parts,script)
 const front=story.camera(story.pose(0),33,1.5,[.52,.7]),rear=story.camera(story.pose(.0175),33,1.5,[.52,.7]),back=story.camera(story.pose(.035),33,1.5,[.52,.7])
 expect(front.position.distanceTo(back.position)).toBeLessThan(1e-8)
 expect(front.position.z-front.target.z).toBeGreaterThan(0);expect(rear.position.z-rear.target.z).toBeLessThan(0)
 for(const[id,p]of Object.entries(parts))expect(p.position).toEqual(story.homes[id]!.position)
})
