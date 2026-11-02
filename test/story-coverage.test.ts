import {it,expect} from 'vitest'
import {readFileSync} from 'node:fs'
import {auditStory} from '../src/evals/story.ts'
import {auditMaterials} from '../src/evals/materials.ts'
const common={title:'Build',note:'Educational',closing:{title:'Together',description:'Whole'}}
const step=(id:string,componentIds=[id])=>({id,componentIds,title:id,description:'A lesson',joined:'Connected'})
it('rejects the old failure mode of bundling a complete subsystem instead of teaching its parts',()=>{
 const report=auditStory({...common,chapters:[step('system',['spring','gears','regulator'])]},['spring','gears','regulator'])
 expect(report.issues).toHaveLength(3)
 expect(report.status).toBe('issues-found')
})
it('allows true pairs and system milestones without treating a milestone as new geometry',()=>{
 const report=auditStory({...common,chapters:[step('spring'),step('pair',['left','right']),{...step('system',['spring','left','right']),kind:'milestone'}]},['spring','left','right'],[{componentIds:['left','right']}])
 expect(report.issues).toEqual([]);expect(report.components).toHaveLength(3);expect(report.milestones).toHaveLength(1);expect(report.ready).toBe(false)
})
it('keeps an individual lesson for every exported Murph component before the movement milestone',()=>{
 const inventory=auditMaterials(readFileSync('public/models/murph/murph.glb')),story=JSON.parse(readFileSync('docs/research/murph-assembly-story.json','utf8'))
 const report=auditStory(story,inventory.components.map(c=>c.componentId))
 expect(report.issues).toEqual([]);expect(report.components).toHaveLength(17)
 expect(report.components.every(c=>c.coverage==='individual')).toBe(true)
 expect(report.milestones[0]!.componentIds).toContain('mainspring')
 expect(story.chapters[0].id).toBe('mainspring')
})
