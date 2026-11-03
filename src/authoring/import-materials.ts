import * as T from 'three'

/** An AO texture without its UV channel cannot be sampled meaningfully. Omit
 * only that invalid binding and record it; never invent UVs for baked shading,
 * or silently replace the source color/normal/roughness maps with a preset. */
export function removeUnmappedOcclusion(root:T.Object3D) {
 const repairs:{mesh:string;channel:number}[]=[]
 root.traverse(node=>{
  if(!(node instanceof T.Mesh))return
  const fix=(m:T.Material)=>{
   if(!(m instanceof T.MeshStandardMaterial)||!m.aoMap)return m
   const channel=m.aoMap.channel,attribute=channel===0?'uv':`uv${channel}`
   if(node.geometry.hasAttribute(attribute))return m
   const copy=m.clone();copy.aoMap=null
   copy.userData={...copy.userData,materialRepair:{reason:'Source occlusion texture had no matching UV channel; removed invalid AO only',missingChannel:channel,visualStatus:'pending'}}
   repairs.push({mesh:node.name,channel});return copy
  }
  node.material=Array.isArray(node.material)?node.material.map(fix):fix(node.material)
 })
 return repairs
}
