import {describe, it, expect, vi, afterEach} from 'vitest'
import {mkdtemp, readFile, writeFile, mkdir, rm} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import {createTripoProvider, type AssetMeshProvider} from '../src/pipeline/three/tripo.ts'
import {assetPlanIssues, inspectAsset, prepareAsset, prepareAssets} from '../src/pipeline/assets.ts'
import {assetPlanSchema} from '../src/spec/assets.ts'
import {explodeSpecSchema} from '../src/spec/schema.ts'
import {exteriorStudy} from './helpers/understanding.ts'

const original=await readFile('public/models/chronograph/watch.glb')
const dirs:string[]=[]
async function temp(){const dir=await mkdtemp(path.join(tmpdir(),'explode-assets-'));dirs.push(dir);return dir}
afterEach(async()=>{await Promise.all(dirs.splice(0).map(d=>rm(d,{recursive:true,force:true})))})
const ok=(data:unknown)=>new Response(JSON.stringify({code:0,data}))
const image=new Uint8Array([137,80,78,71])
function mockApi(){const payloads:{url:string;body:Record<string,unknown>}[]=[];let uploads=0;const request=vi.fn<typeof fetch>(async(input,init)=>{
  const url=String(input)
  if(url.endsWith('/files'))return ok({file_token:`view-${++uploads}`})
  if(init?.method==='POST'){payloads.push({url,body:JSON.parse(init.body as string)});return ok({task_id:'generated'})}
  if(url.includes('/tasks/'))return ok({status:'success',output:{model_url:'https://cdn.tripo3d.ai/model.glb'}})
  expect(init?.headers).toBeUndefined();return new Response(original)
});return {request,payloads}}

describe('researched Tripo routes',()=>{
  it('sends all reference views to the documented route, resumes once, and refuses changed research',async()=>{
    const dir=await temp(), {request,payloads}=mockApi(), provider=createTripoProvider({apiKey:'secret',quality:'fidelity',fetch:request})
    const input={mode:'multiview' as const,researchHash:'research-v1',views:[{view:'front' as const,bytes:image,mime:'image/png'},{view:'back' as const,bytes:new Uint8Array([1,2,3]),mime:'image/png'}]}
    await provider.generateAsset(input,dir,()=>{});await provider.generateAsset(input,dir,()=>{})
    expect(payloads).toHaveLength(1)
    expect(payloads[0]!.url).toContain('/generation/multiview-to-model')
    expect(payloads[0]!.body.inputs).toEqual([{front:'view-1'},{back:'view-2'}])
    expect(payloads[0]!.body).not.toHaveProperty('prompt')
    expect(payloads[0]!.body).not.toHaveProperty('orientation')
    const calls=request.mock.calls.length
    await expect(provider.generateAsset({...input,researchHash:'changed-observation'},dir,()=>{})).rejects.toThrow('different photo or quality')
    await expect(provider.generateAsset({...input,views:[input.views[0]!,{...input.views[1]!,bytes:new Uint8Array([9])}]},dir,()=>{})).rejects.toThrow('different photo or quality')
    expect(request).toHaveBeenCalledTimes(calls)
    expect(await readFile(path.join(dir,'tripo-request.json'),'utf8')).not.toContain('secret')
  })
  it('sends the explicit construction prompt to text-to-model without buying segmentation',async()=>{
    const {request,payloads}=mockApi(), provider=createTripoProvider({apiKey:'secret',fetch:request})
    await provider.generateAsset({mode:'text',prompt:'Thin machined annular retaining ring with a central opening and satin metal finish.',negativePrompt:'No filled center. No surrounding assembly.',researchHash:'ring-research'},await temp(),()=>{})
    expect(payloads).toHaveLength(1);expect(payloads[0]!.url).toContain('/text-to-model')
    expect(payloads[0]!.body.prompt).toContain('central opening')
    expect(request.mock.calls.some(([url])=>String(url).endsWith('/files'))).toBe(false)
  })
  it('rejects missing front views and ambiguous paid outcomes without another purchase',async()=>{
    const {request}=mockApi(), provider=createTripoProvider({apiKey:'secret',fetch:request})
    await expect(provider.generateAsset({mode:'multiview',researchHash:'r',views:[{view:'left',bytes:image,mime:'image/png'},{view:'back',bytes:image,mime:'image/png'}]},await temp(),()=>{})).rejects.toThrow('front')
    expect(request).not.toHaveBeenCalled()
    const lost=vi.fn<typeof fetch>(async()=>{throw Error('connection lost')}),dir=await temp(),p=createTripoProvider({apiKey:'secret',fetch:lost}),input={mode:'text' as const,prompt:'A researched ring.',researchHash:'r'}
    await expect(p.generateAsset(input,dir,()=>{})).rejects.toThrow('connection lost')
    await expect(p.generateAsset(input,dir,()=>{})).rejects.toThrow('unknown outcome')
    expect(lost).toHaveBeenCalledTimes(1)
  })
})

async function fixture(){
  const dir=await temp(),spec=exteriorStudy(explodeSpecSchema.parse(JSON.parse(await readFile('public/chronograph.json','utf8')))),componentId=spec.components[0]!.id
  const ref=spec.understanding!.components[0]!.reconstruction.referenceIds[0]!
  const plan=assetPlanSchema.parse({version:1,identity:spec.understanding!.identityScope,searches:[{query:'Exact product CAD model',searchedAt:'2026-10-30T00:00:00Z',outcome:'Inspected test asset.'}],candidates:[{id:'source',url:'https://example.com/model',exactVariant:true,coverage:'component',license:{name:'Test source',url:'https://example.com/license',redistribution:'unknown'},decision:'selected',reason:'Inspected local geometry.'}],observations:[{id:'front',referenceId:ref,componentId,view:'front',imagePath:'photo.png',notes:'Test observation only.',origin:'photograph'}],tasks:[{componentId,observationIds:['front'],strategy:{kind:'source',candidateId:'source',modelPath:'source.glb'}}]})
  await writeFile(path.join(dir,'spec.json'),JSON.stringify(spec));await writeFile(path.join(dir,'plan.json'),JSON.stringify(plan));await writeFile(path.join(dir,'source.glb'),original);await writeFile(path.join(dir,'photo.png'),image)
  const templateDir=path.join(dir,'template');await mkdir(path.join(templateDir,'assets'),{recursive:true});await writeFile(path.join(templateDir,'asset-review.html'),'<script>window.__ASSET_REVIEW__ = /*__ASSET_REVIEW_CONFIG__*/null;</script>')
  return {dir,spec,plan,componentId, input:{specPath:path.join(dir,'spec.json'),planPath:path.join(dir,'plan.json'),componentId,outDir:path.join(dir,'out'),templateDir}}
}
describe('asset evidence and source handoff',()=>{
  it('preserves source geometry byte-for-byte and does not promote it to a quality pass',async()=>{
    const {input}=await fixture(),provider={id:'never',generate:vi.fn(),generateAsset:vi.fn()} as AssetMeshProvider
    const result=await prepareAsset({...input,provider})
    expect(provider.generateAsset).not.toHaveBeenCalled();expect(result.status).toBe('needs-visual-review');expect(result.redistribution).toBe('unknown')
    expect(Buffer.compare(await readFile(path.join(input.outDir,'model.glb')),original)).toBe(0)
    expect(result.views.every(v=>v.verdict==='pending')).toBe(true)
    expect(await readFile(path.join(input.outDir,'index.html'),'utf8')).toContain('model.glb')
  })
  it('requires real inspected evidence, correct variant and component references',async()=>{
    const {spec,plan,componentId}=await fixture()
    plan.observations[0]!.origin='generated';plan.candidates[0]!.exactVariant=false;plan.observations[0]!.referenceId='unretrieved'
    const issues=assetPlanIssues(spec,plan,componentId).join(' ')
    expect(issues).toContain('only evidence');expect(issues).toContain('exact-variant');expect(issues).toContain('construction references')
  })
  it('detects changed source geometry and missing inspection images before a provider call',async()=>{
    const {input,dir}=await fixture();await prepareAsset(input)
    await writeFile(path.join(dir,'source.glb'),Buffer.concat([original,Buffer.from([1])]))
    await expect(prepareAsset(input)).rejects.toThrow('different research')
    await rm(path.join(dir,'photo.png'))
    const generateAsset=vi.fn();await expect(prepareAsset({...input,provider:{id:'never',generate:vi.fn(),generateAsset}})).rejects.toThrow()
    expect(generateAsset).not.toHaveBeenCalled()
  })
  it('flags billboard listings instead of equating downloadability with product geometry',()=>{
    const j=Buffer.from(JSON.stringify({asset:{version:'2.0'},meshes:[{primitives:[{attributes:{POSITION:0},indices:1}]}],accessors:[{count:8},{count:12}]})),padded=Buffer.alloc(Math.ceil(j.length/4)*4,32);j.copy(padded)
    const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(20+padded.length,8);header.writeUInt32LE(padded.length,12);header.writeUInt32LE(0x4e4f534a,16)
    expect(inspectAsset(Buffer.concat([header,padded])).warnings[0]).toContain('billboard')
  })
})

it('batch execution retains missing component tasks after a successful exterior import',async()=>{
 const {input,spec,componentId}=await fixture()
 const report=await prepareAssets(input)
 expect(report.status).toBe('incomplete')
 expect(report.results).toHaveLength(spec.components.length)
 expect(report.results.find(r=>r.componentId===componentId)?.stage).toBe('visual-review-and-fit')
 expect(report.results.some(r=>r.stage==='research-and-plan')).toBe(true)
 const progress=JSON.parse(await readFile(report.progress,'utf8'))
 expect(progress.ready).toBe(false)
 expect(progress.requiredComponentIds).toEqual(spec.components.map(c=>c.id))
})

it('batch queue preserves original requirements absent from an asset-specific spec',async()=>{
 const {input,dir}=await fixture()
 const requirementsPath=path.join(dir,'requirements.json')
 await writeFile(requirementsPath,JSON.stringify({version:1,identity:'Original object',objective:'Explain the internals',components:[{id:'missing-battery',name:'Battery',system:'Power',purpose:'Store energy',sourceUrls:['https://example.com/manual']}]}))
 const result=await prepareAssets({...input,requirementsPath})
 expect(result.results).toEqual([{componentId:'missing-battery',stage:'research-and-plan',detail:'Required component has no asset task.'}])
})
