import { z } from 'zod'
import type { ExplainerSpec } from '../spec/schema.ts'
import { understandingIssues } from '../pipeline/understanding.ts'
import { RUBRIC } from './rubric.ts'

export const reviewSchema=z.object({
  version:z.literal(1),
  objectName:z.string().min(1),
  mode:z.enum(['authored','live-generation','fixture','research-only']),
  reviewer:z.string().min(1),
  independence:z.enum(['self-review','independent']),
  specSha256:z.string().regex(/^[a-f0-9]{64}$/),
  assetSha256:z.string().regex(/^[a-f0-9]{64}$/).optional(),
  experienceSha256:z.string().regex(/^[a-f0-9]{64}$/).optional(),
  components:z.array(z.object({
    componentId:z.string(),geometry:z.enum(['reference-matched','approximate','missing']),
    material:z.enum(['matched','approximate','unreviewed']),
    views:z.array(z.enum(['assembled','front','oblique','reverse','exported'])),
    referenceIds:z.array(z.string()),evidenceFiles:z.array(z.string()),notes:z.string().min(1),
  })),
  ratings:z.record(z.string(),z.object({score:z.number().int().min(0).max(4),reason:z.string().min(12),evidenceFiles:z.array(z.string()).min(1)})),
  learningChecks:z.array(z.object({goalIndex:z.number().int().nonnegative(),level:z.enum(['beginner','intermediate','advanced']),question:z.string().min(12),expectedAnswer:z.string().min(12),componentIds:z.array(z.string()).min(1),referenceIds:z.array(z.string()).min(1),learnerResult:z.enum(['not-tested','passed','failed'])})),
  limitations:z.array(z.string()),
})
export type Review=z.infer<typeof reviewSchema>
export type Gate={id:string;status:'pass'|'fail'|'unmeasured';detail:string}
export interface Measurements {
  specSha256:string
  assetBytes?:number
  assetSha256?:string
  experienceSha256?:string
  /** Derived from an actual GLB or browser scene, never proposed spec mappings. */
  renderedComponentIds?:string[]
  missingEvidenceFiles?:string[]
  motion?:{samples:number;allPartsVisible:boolean;materialsUnchanged:boolean;contextIntrusions:number}
  optics?:{samples:number;minimumContrastRetention:number}
}

export function evaluate(spec:ExplainerSpec,review:Review,measurements:Measurements){
  const gates:Gate[]=[],ids=new Set(spec.components.map(p=>p.id)),refs=new Set(spec.understanding?.references.map(r=>r.id)??[])
  const add=(id:string,status:Gate['status'],detail:string)=>gates.push({id,status,detail})
  const issues=understandingIssues(spec)
  add('research-structure',issues.length?'fail':'pass',issues.join(' ')||'Component plans and citation links are structurally valid; source entailment still requires review.')
  add('review-freshness',review.specSha256===measurements.specSha256&&review.objectName===spec.item.name?'pass':'fail','Review must match this exact spec hash and object.')
  add('asset-freshness',!measurements.assetSha256||!review.assetSha256?'unmeasured':measurements.assetSha256===review.assetSha256?'pass':'fail','Visual review must match the exact rendered asset, not only its spec.')
  add('experience-freshness',!measurements.experienceSha256||!review.experienceSha256?'unmeasured':measurements.experienceSha256===review.experienceSha256?'pass':'fail','Design review must match the exact viewer and layout source.')
  const missing=measurements.renderedComponentIds?spec.components.filter(c=>!measurements.renderedComponentIds!.includes(c.id)).map(c=>c.id):[]
  add('rendered-coverage',!measurements.renderedComponentIds?'unmeasured':missing.length?'fail':'pass',measurements.renderedComponentIds?(missing.length?`Missing actual geometry: ${missing.join(', ')}.`:'Every researched component has an actual scene node.'):'No rendered model supplied. A construction plan does not count as generated geometry.')
  const duplicates=review.components.filter((p,i,a)=>a.findIndex(x=>x.componentId===p.componentId)!==i).map(p=>p.componentId)
  const invalid=review.components.filter(p=>!ids.has(p.componentId)||p.referenceIds.some(r=>!refs.has(r)))
  const unchecked=spec.components.filter(c=>!review.components.some(p=>p.componentId===c.id)).map(c=>c.id)
  add('component-review-coverage',duplicates.length||invalid.length||unchecked.length?'fail':'pass',`Missing reviews: ${unchecked.join(', ')||'none'}; duplicate/unknown reviews: ${duplicates.length+invalid.length}.`)
  const incomplete=review.components.filter(p=>p.geometry==='missing'||p.views.length<5||new Set(p.views).size<5||!p.evidenceFiles.length||!p.referenceIds.length)
  add('complete-surface-review',incomplete.length||!review.components.length?'fail':'pass',incomplete.length?`Incomplete views/evidence: ${incomplete.map(p=>p.componentId).join(', ')}.`:'Every reviewed component has assembled/front/oblique/reverse/export evidence.')
  const approximate=review.components.filter(p=>p.geometry!=='reference-matched'||p.material!=='matched')
  add('reference-fidelity',approximate.length||!review.components.length?'fail':'pass',approximate.length?`Still approximate or unreviewed: ${approximate.map(p=>p.componentId).join(', ')}.`:'Reviewer reports geometry and materials matched to references; this remains a human judgment.')
  add('artifact-evidence',measurements.missingEvidenceFiles===undefined?'unmeasured':measurements.missingEvidenceFiles.length?'fail':'pass',measurements.missingEvidenceFiles?.length?`Missing evidence files: ${measurements.missingEvidenceFiles.join(', ')}.`:'Artifact existence is checked separately from the reviewer’s visual judgment.')
  const goals=spec.understanding?.learningGoals??[]
  const invalidChecks=review.learningChecks.some(q=>q.goalIndex>=goals.length||q.componentIds.some(id=>!ids.has(id))||q.referenceIds.some(id=>!refs.has(id)))
  const uncovered=goals.map((_,i)=>i).filter(i=>!review.learningChecks.some(q=>q.goalIndex===i))
  add('learning-coverage',!goals.length||uncovered.length||invalidChecks?'fail':'pass',`Every learning goal needs a question, expected explanation, component IDs and sources. Uncovered goals: ${uncovered.join(', ')||'none'}.`)
  add('learner-validation',review.learningChecks.some(q=>q.learnerResult==='failed')?'fail':!review.learningChecks.length||review.learningChecks.some(q=>q.learnerResult==='not-tested')?'unmeasured':'pass','A written teaching check is not evidence that a learner understood it.')
  add('learning-depth',['beginner','intermediate','advanced'].every(level=>review.learningChecks.some(q=>q.level===level))?'pass':'fail','Supply beginner identification/function, intermediate causal explanation, and advanced evidence/uncertainty questions. Level labels still require editorial review.')
  add('model-payload',measurements.assetBytes===undefined?'unmeasured':measurements.assetBytes>25*1024*1024?'fail':'pass',measurements.assetBytes===undefined?'No model payload measured.':`${measurements.assetBytes} bytes; prototype budget is 25 MiB before transport compression. Field performance remains separate.`)
  const motion=measurements.motion
  add('physical-continuity',!motion?'unmeasured':motion.samples<100||!motion.allPartsVisible||!motion.materialsUnchanged||motion.contextIntrusions?'fail':'pass',motion?`${motion.samples} measured poses; ${motion.contextIntrusions} context intrusions.`:'No measured motion run supplied.')
  const optics=measurements.optics
  add('optical-transmission',!optics?'unmeasured':optics.samples<2||optics.minimumContrastRetention<.75?'fail':'pass',optics?`${optics.samples} samples; minimum contrast retention ${optics.minimumContrastRetention.toFixed(3)}.`:'No rendered transmission measurements supplied.')
  const unknownRatings=Object.keys(review.ratings).filter(id=>!RUBRIC.some(r=>r.id===id))
  add('rubric-validity',unknownRatings.length||review.independence==='self-review'&&Object.values(review.ratings).some(r=>r.score===4)?'fail':'pass','Unknown criteria are rejected. The top anchor requires independent review.')
  const scores=Object.fromEntries(['design','model'].map(area=>{
    const criteria=RUBRIC.filter(r=>r.area===area),rated=criteria.filter(r=>review.ratings[r.id]),complete=rated.length===criteria.length
    const mean=rated.length?rated.reduce((sum,r)=>sum+review.ratings[r.id]!.score,0)/rated.length:null
    add(`${area}-quality`,!complete?'unmeasured':rated.some(r=>review.ratings[r.id]!.score<3)?'fail':'pass',`${rated.length}/${criteria.length} anchored criteria reviewed; each must reach 3/4. Missing ratings are not zeroes or passes.`)
    return [area,{reviewed:rated.length,total:criteria.length,mean:complete?mean:null}]
  }))
  const status=gates.some(g=>g.status==='fail')?'not-ready':gates.some(g=>g.status==='unmeasured')?'review-required':'meets-reviewed-bar'
  return {version:1,object:spec.item.name,mode:review.mode,reviewer:review.reviewer,independence:review.independence,status,scores,gates,limitations:review.limitations,note:'Passing unit tests validates the evaluator, not the object. Scores are anchored reviewer judgments, not automatic proof of photorealism or learning.'}
}
