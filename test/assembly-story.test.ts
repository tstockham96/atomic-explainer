import {it,expect} from 'vitest'
import * as T from 'three'
import {assemblySample,createAssemblyStory,assemblyStorySchema} from '../src/viewer/three/assemblyStory.ts'
const script={title:'Build a mechanism',note:'Educational order',closing:{title:'Together',description:'One assembly'},chapters:[{id:'core',componentIds:['core'],title:'Start',description:'A foundation',joined:'Ready'},{id:'pair',componentIds:['left','right'],title:'Support',description:'Matched supports',joined:'Supported'},{id:'cover',componentIds:['cover'],title:'Protect',description:'A cover',joined:'Complete'}]}
function fixture(){const root=new T.Group(),parts:Record<string,T.Object3D>={};for(const [i,id]of ['core','left','right','cover'].entries()){const part=new T.Mesh(new T.BoxGeometry(2,2,1),new T.MeshStandardMaterial());part.position.set(i===1?-2:i===2?2:0,0,i===3?1:0);root.add(part);parts[id]=part}return {root,parts}}
it('builds cumulatively, keeps paired members together and restores exact seats',()=>{
 const {root,parts}=fixture(),story=createAssemblyStory(root,parts,script)
 expect(story.pose(0).builtIds).toEqual([])
 const core=story.pose(story.progressFor('core',.97));expect(core.builtIds).toEqual(['core']);expect(parts.core!.position).toEqual(story.homes.core!.position)
 const pair=story.pose(story.progressFor('pair',.97));expect(pair.builtIds).toEqual(['core','left','right']);expect(parts.left!.position).toEqual(story.homes.left!.position)
 story.pose(1);for(const [id,p]of Object.entries(parts)){expect(p.position).toEqual(story.homes[id]!.position);expect(p.quaternion.toArray()).toEqual(story.homes[id]!.quaternion.toArray());expect(p.visible).toBe(true)}
})
it('reverses every pose without history, fades or discontinuous camera boundaries',()=>{
 const {root,parts}=fixture(),story=createAssemblyStory(root,parts,script),poses:number[][]=[]
 for(let i=0;i<=300;i++){const state=story.pose(i/300);poses.push(Object.values(parts).flatMap(p=>[...p.position.toArray(),...p.quaternion.toArray()]));const shot=story.camera(state,33,1.5,[.52,.7]);expect([...shot.position,...shot.target].every(Number.isFinite)).toBe(true);for(const p of Object.values(parts)){expect(p.visible).toBe(true);expect((p as T.Mesh<T.BufferGeometry,T.MeshStandardMaterial>).material.opacity).toBe(1)}}
 for(let i=300;i>=0;i--){story.pose(i/300);expect(Object.values(parts).flatMap(p=>[...p.position.toArray(),...p.quaternion.toArray()])).toEqual(poses[i])}
 for(const p of [.94/3,.94*2/3,.94]){const a=story.camera(story.pose(p-1e-7),33,1.5,[.52,.7]),b=story.camera(story.pose(p+1e-7),33,1.5,[.52,.7]);expect(a.position.distanceTo(b.position)).toBeLessThan(.001);expect(a.target.distanceTo(b.target)).toBeLessThan(.001)}
})
it('rejects duplicate seating and incomplete physical coverage',()=>{
 const {root,parts}=fixture();expect(()=>createAssemblyStory(root,parts,{...script,chapters:script.chapters.slice(1)})).toThrow('every modeled component')
 expect(assemblyStorySchema.safeParse({...script,chapters:[...script.chapters,script.chapters[0]]}).success).toBe(false)
 expect(assemblySample(1,3).complete).toBe(true)
})
