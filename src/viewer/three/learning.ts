import type { ExplodeSpec } from '../../spec/schema.ts'

/** Text remains available independently of WebGL and motion preferences. */
export function componentLesson(spec:ExplodeSpec,id:string){
  const component=spec.components.find(p=>p.id===id)
  const study=spec.understanding?.components.find(p=>p.componentId===id)
  if(!component)return undefined
  const name=(id:string)=>spec.components.find(p=>p.id===id)?.name??id
  const connections=spec.understanding?.relationships.filter(r=>r.from===id||r.to===id).map(r=>`${name(r.from)} → ${name(r.to)}: ${r.relationship}`)??[]
  return {name:component.name,overview:study?.function??component.howItsMade,material:component.material,connections,uncertainties:study?.unknowns??[],references:spec.understanding?.references.filter(r=>study?.reconstruction.referenceIds.includes(r.id))??[]}
}
