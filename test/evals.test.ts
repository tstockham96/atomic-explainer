import {describe,it,expect} from 'vitest'
import {readFileSync} from 'node:fs'
import {evaluate,reviewSchema,type Review,type Measurements} from '../src/evals/evaluate.ts'
import {RUBRIC} from '../src/evals/rubric.ts'
import {explodeSpecSchema} from '../src/spec/schema.ts'
import {buildReconstructionPlan} from '../src/pipeline/understanding.ts'
import {componentLesson} from '../src/viewer/three/learning.ts'

const phone=explodeSpecSchema.parse(JSON.parse(readFileSync('evals/cases/iphone-18-pro.json','utf8')))
const realReview=reviewSchema.parse(JSON.parse(readFileSync('evals/reviews/iphone-18-pro.json','utf8')))
// Deliberately synthetic complete review. It tests evaluator logic, NOT the phone.
function control(){const review:Review=structuredClone(realReview);review.mode='fixture';review.assetSha256='a'.repeat(64);review.experienceSha256='c'.repeat(64);review.components.forEach(c=>{c.geometry='reference-matched';c.material='matched';c.views=['assembled','front','oblique','reverse','exported'];c.evidenceFiles=['fixture.png']});review.learningChecks.forEach(q=>q.learnerResult='passed');for(const r of RUBRIC)review.ratings[r.id]={score:3,reason:'Synthetic control for evaluator logic only.',evidenceFiles:['fixture.png']};const measured:Measurements={specSha256:review.specSha256,assetBytes:1000,assetSha256:review.assetSha256,experienceSha256:review.experienceSha256,renderedComponentIds:phone.components.map(c=>c.id),missingEvidenceFiles:[],motion:{samples:1001,allPartsVisible:true,materialsUnchanged:true,contextIntrusions:0},optics:{samples:8,minimumContrastRetention:.94}};return {review,measured}}
const status=(id:string,review:Review,measured:Measurements)=>evaluate(phone,review,measured).gates.find(g=>g.id===id)?.status
describe('quality evaluator adversarial cases',()=>{
 it('can pass a fully measured synthetic control without representing it as live generation',()=>{const {review,measured}=control();expect(evaluate(phone,review,measured)).toMatchObject({status:'meets-reviewed-bar',mode:'fixture'})})
 it('does not mistake a researched second object for a generated model',()=>{const result=evaluate(phone,realReview,{specSha256:realReview.specSha256,missingEvidenceFiles:[]});expect(result.status).toBe('not-ready');expect(result.scores.design?.mean).toBeNull();expect(result.gates.find(g=>g.id==='rendered-coverage')?.status).toBe('unmeasured')})
 it('does not let beautiful ratings conceal a missing internal component',()=>{const {review,measured}=control();measured.renderedComponentIds=measured.renderedComponentIds!.filter(id=>id!=='battery');expect(status('rendered-coverage',review,measured)).toBe('fail')})
 it('rejects duplicated review entries that mask an unreviewed part',()=>{const {review,measured}=control();review.components[1]=structuredClone(review.components[0]!);expect(status('component-review-coverage',review,measured)).toBe('fail')})
 it('rejects an invented source for a material review',()=>{const {review,measured}=control();review.components[0]!.referenceIds=['invented'];expect(status('component-review-coverage',review,measured)).toBe('fail')})
 it('requires the reverse and exported view rather than five duplicate front views',()=>{const {review,measured}=control();review.components[0]!.views=['front','front','front','front','front'];expect(status('complete-surface-review',review,measured)).toBe('fail')})
 it('keeps generic unverified materials below the fidelity bar',()=>{const {review,measured}=control();review.components[0]!.material='approximate';expect(status('reference-fidelity',review,measured)).toBe('fail')})
 it('rejects stale or wrong-variant reviews',()=>{const {review,measured}=control();measured.specSha256='0'.repeat(64);expect(status('review-freshness',review,measured)).toBe('fail');measured.specSha256=review.specSha256;review.objectName='iPhone 18 Pro Max';expect(status('review-freshness',review,measured)).toBe('fail')})
 it('invalidates visual approval after the model changes',()=>{const {review,measured}=control();measured.assetSha256='b'.repeat(64);expect(status('asset-freshness',review,measured)).toBe('fail')})
 it('rejects a beginner-only teaching plan',()=>{const {review,measured}=control();review.learningChecks.forEach(q=>q.level='beginner');expect(status('learning-depth',review,measured)).toBe('fail')})
 it('flags oversized payloads instead of treating localhost speed as field performance',()=>{const {review,measured}=control();measured.assetBytes=38_000_000;expect(status('model-payload',review,measured)).toBe('fail')})
 it('requires actual saved evidence, not just plausible path strings',()=>{const {review,measured}=control();measured.missingEvidenceFiles=['fixture.png'];expect(status('artifact-evidence',review,measured)).toBe('fail')})
 it('does not average away a failing design dimension',()=>{const {review,measured}=control();review.ratings.accessibility!.score=0;expect(status('design-quality',review,measured)).toBe('fail')})
 it('does not turn missing design ratings into a numerical score',()=>{const {review,measured}=control();delete review.ratings.pacing;expect(evaluate(phone,review,measured).scores.design?.mean).toBeNull()})
 it('keeps the highest score reserved for independent review',()=>{const {review,measured}=control();review.ratings.materials!.score=4;expect(status('rubric-validity',review,measured)).toBe('fail')})
 it('separates teaching-question coverage from actual learner comprehension',()=>{const {review,measured}=control();review.learningChecks[0]!.learnerResult='not-tested';expect(status('learning-coverage',review,measured)).toBe('pass');expect(status('learner-validation',review,measured)).toBe('unmeasured')})
 it('rejects learning checks about nonexistent parts or goals',()=>{const {review,measured}=control();review.learningChecks[0]!.componentIds=['rotor'];review.learningChecks[0]!.goalIndex=50;expect(status('learning-coverage',review,measured)).toBe('fail')})
 it.each(['allPartsVisible','materialsUnchanged'] as const)('fails physical continuity when %s is false',key=>{const {review,measured}=control();measured.motion![key]=false;expect(status('physical-continuity',review,measured)).toBe('fail')})
 it('fails collisions and opacity disguised as glass',()=>{const {review,measured}=control();measured.motion!.contextIntrusions=1;measured.optics!.minimumContrastRetention=.12;expect(status('physical-continuity',review,measured)).toBe('fail');expect(status('optical-transmission',review,measured)).toBe('fail')})
 it('keeps cross-object construction work explicit and free of watch assumptions',()=>{const plan=buildReconstructionPlan(phone);expect(plan.issues).toEqual([]);expect(plan.status).toBe('component-work-required');expect(plan.requiredMaterialReview).toHaveLength(11);expect(plan.requiredMaterialReview.some(c=>c.componentId==='rotor')).toBe(false)})
 it('makes all explanations available independently of the 3D renderer',()=>{for(const c of phone.components){const lesson=componentLesson(phone,c.id)!;expect(lesson.overview.length).toBeGreaterThan(10);expect(lesson.references.length).toBeGreaterThan(0)}})
})
