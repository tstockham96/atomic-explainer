import {experienceFingerprint} from './fingerprint.mjs'
import {readFile,writeFile,mkdir,access} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import path from 'node:path'
import {explodeSpecSchema} from '../../src/spec/schema.ts'
import {evaluate,reviewSchema,type Measurements} from '../../src/evals/evaluate.ts'
import {glbComponentIds} from '../../src/evals/inventory.ts'

const cases=[
 {id:'murph-v17',spec:'docs/research/murph-study.json',review:'evals/reviews/murph-v17.json',inventory:'docs/research/reviews/murph-v17/component-material-inventory.json',measurements:'docs/research/reviews/murph-v17'},
 {id:'iphone-18-pro',spec:'evals/cases/iphone-18-pro.json',review:'evals/reviews/iphone-18-pro.json'},
]
// Explicit current-model review, if present; never overwrite the baseline ratings.
try{await access('evals/reviews/murph-current.json');cases.push({id:'murph-current',spec:'docs/research/murph-study.json',review:'evals/reviews/murph-current.json'})}catch{/* no current visual assessment yet */}
await mkdir('evals/reports',{recursive:true})
for(const item of cases){
 const bytes=await readFile(item.spec),spec=explodeSpecSchema.parse(JSON.parse(bytes.toString())),review=reviewSchema.parse(JSON.parse(await readFile(item.review,'utf8')))
 const files=new Set([...review.components.flatMap(c=>c.evidenceFiles),...Object.values(review.ratings).flatMap(r=>r.evidenceFiles)])
 const missingEvidenceFiles:string[]=[]
 for(const file of files){const resolved=path.resolve(file);if(!resolved.startsWith(process.cwd()+path.sep)){missingEvidenceFiles.push(file);continue}try{await access(resolved)}catch{missingEvidenceFiles.push(file)}}
 const measurements:Measurements={specSha256:createHash('sha256').update(bytes).digest('hex'),missingEvidenceFiles}
 if(item.inventory){const inventory=JSON.parse(await readFile(item.inventory,'utf8'));measurements.renderedComponentIds=inventory.components.map((c:{id:string})=>c.id)}
 if(item.id==='murph-current'){const model=await readFile('public/models/murph/murph.glb');measurements.renderedComponentIds=glbComponentIds(model);measurements.assetSha256=createHash('sha256').update(model).digest('hex');measurements.assetBytes=model.byteLength}
 if(item.id==='murph-current'){
  const capture=JSON.parse(await readFile('evals/reports/current/capture.json','utf8'))
  const viewer=await readFile('tools/murph-study/viewer.ts'),html=await readFile('tools/murph-study/index.html')
  measurements.experienceSha256=await experienceFingerprint()
  const fresh=capture.experienceSha256===measurements.experienceSha256&&capture.assetSha256===measurements.assetSha256&&capture.viewerSha256===createHash('sha256').update(viewer).digest('hex')&&capture.htmlSha256===createHash('sha256').update(html).digest('hex')
  if(fresh){
   const motion=JSON.parse(await readFile('evals/reports/current/motion-check.json','utf8')),inspection=JSON.parse(await readFile('evals/reports/current/inspection-check.json','utf8'))
   measurements.motion={samples:motion.samples,allPartsVisible:motion.allPartsVisible,materialsUnchanged:motion.materialsUnchanged,contextIntrusions:inspection.results.reduce((n:number,r:{contextInFrame:string[]})=>n+r.contextInFrame.length,0)}
   const optics=JSON.parse(await readFile('evals/reports/current/glass-transmission-check.json','utf8'))
   measurements.optics={samples:optics.results.length,minimumContrastRetention:Math.min(...optics.results.map((r:{retainedContrast:number})=>r.retainedContrast))}
  }else missingEvidenceFiles.push('Current browser measurements are stale; rerun tools/evals/record.mjs')
 }
 if(item.measurements){
  const optics=JSON.parse(await readFile(path.join(item.measurements,'glass-transmission-check.json'),'utf8'))
  measurements.optics={samples:optics.results.length,minimumContrastRetention:Math.min(...optics.results.map((r:{retainedContrast:number})=>r.retainedContrast))}
  // The saved inspection report does not measure material stability over the whole
  // journey. Do not fabricate a continuity pass from isolated snapshots.
 }
 const report=evaluate(spec,review,measurements)
 await writeFile(`evals/reports/${item.id}.json`,JSON.stringify(report,null,2)+'\n')
 console.log(`${item.id}: ${report.status}; design=${report.scores.design?.mean??'unreviewed'}/4; model=${report.scores.model?.mean??'unreviewed'}/4`)
 for(const gate of report.gates.filter(g=>g.status!=='pass'))console.log(`  ${gate.status}: ${gate.id}`)
}
// Report generation intentionally succeeds for failing specimens. --require-ready
// is the release check; expected bad fixtures must remain bad in the unit suite.
if(process.argv.includes('--require-ready')){
 const id=process.argv[process.argv.indexOf('--case')+1],target=cases.find(c=>c.id===id)
 if(!target)throw Error('--require-ready needs an explicit --case ID')
 const report=JSON.parse(await readFile(`evals/reports/${target.id}.json`,'utf8'))
 if(report.status!=='meets-reviewed-bar')process.exitCode=1
}
