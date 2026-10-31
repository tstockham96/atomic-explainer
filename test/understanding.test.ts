import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { explodeSpecSchema } from '../src/spec/schema.ts'
import { normalizeSpec } from '../src/spec/normalize.ts'
import { buildReconstructionPlan, groundUnderstanding, understandingIssues } from '../src/pipeline/understanding.ts'
import { reconstruct } from '../src/pipeline/solid3d.ts'
import { exteriorStudy } from './helpers/understanding.ts'
const legacy=explodeSpecSchema.parse(JSON.parse(await readFile('public/chronograph.json','utf8')))

describe('research determines reconstruction',()=>{
 it('preserves legacy display specs but requires a plan before new generation',()=>{
  expect(explodeSpecSchema.safeParse(legacy).success).toBe(true)
  expect(buildReconstructionPlan(legacy).status).toBe('research-required')
 })
 it('requires a plan for every part and valid relationship endpoints',()=>{
  const spec=exteriorStudy(legacy);spec.understanding!.components.pop()
  spec.understanding!.relationships.push({from:'invented',to:legacy.components[0]!.id,relationship:'drives',basis:'inferred',referenceIds:[]})
  expect(understandingIssues(spec).some(issue=>issue.includes('Missing construction plan'))).toBe(true)
  expect(understandingIssues(spec).some(issue=>issue.includes('unknown component'))).toBe(true)
 })
 it('does not treat an invented citation as verified construction evidence',()=>{
  const spec=exteriorStudy(legacy),study=spec.understanding!
  study.references[0]!.url='https://invented.invalid/evidence'
  study.components[0]!.claims[0]!.basis='documented'
  spec.understanding=groundUnderstanding(study,spec.sources)
  expect(spec.understanding.components[0]!.claims[0]!.basis).toBe('unknown')
  expect(buildReconstructionPlan(spec).status).toBe('research-required')
 })
 it('will not buy an exterior when research requires a clean independent layer',async()=>{
  const spec=exteriorStudy(legacy);spec.understanding!.components[0]!.reconstruction.method='model-part'
  const generate=vi.fn();const outDir=await mkdtemp(path.join(tmpdir(),'explode-understanding-'))
  try{
   await expect(reconstruct({spec,sourcePhoto:'does-not-need-to-exist.jpg',outDir,provider:{id:'test',generate}})).rejects.toThrow('component modeling')
   expect(generate).not.toHaveBeenCalled()
   const plan=JSON.parse(await readFile(path.join(outDir,'construction-plan.json'),'utf8'))
   expect(plan.status).toBe('component-work-required')
   expect(plan.requiredComponentWork[0].componentId).toBe(legacy.components[0]!.id)
  }finally{await rm(outDir,{recursive:true,force:true})}
 })
 it('does not silently detach evidence when normalizing component IDs',()=>{
  const spec=exteriorStudy(legacy);spec.components[0]!.id='Invalid ID'
  expect(()=>normalizeSpec(spec)).toThrow('component IDs')
 })
 it('requires an individual pending material review for every researched component',()=>{
  const spec=exteriorStudy(legacy),plan=buildReconstructionPlan(spec)
  expect(plan.requiredMaterialReview.map(p=>p.componentId)).toEqual(spec.understanding!.components.map(p=>p.componentId))
  expect(plan.requiredMaterialReview.every(p=>p.status==='pending'&&p.views.includes('reverse')&&p.views.includes('exported'))).toBe(true)
  for(const entry of plan.requiredMaterialReview){const source=spec.understanding!.components.find(p=>p.componentId===entry.componentId)!;expect(entry.targetBehavior).toBe(source.reconstruction.materialBehavior);expect(entry.unknowns).toEqual(source.unknowns)}
 })
})
