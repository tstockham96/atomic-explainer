import {createHash} from 'node:crypto'

type TextureInfo={index:number;texCoord?:number;extensions?:{KHR_texture_transform?:{texCoord?:number}}}
type Material={name?:string;normalTexture?:TextureInfo;occlusionTexture?:TextureInfo;emissiveTexture?:TextureInfo;pbrMetallicRoughness?:{baseColorTexture?:TextureInfo;metallicRoughnessTexture?:TextureInfo;metallicFactor?:number;roughnessFactor?:number};extras?:{materialRepair?:{reason:string;missingChannel:number};surfaceFinish?:{kind:string;tileMm:number;reliefMm:number;basis:string;evidence:string}};extensions?:Record<string,unknown>}
type Doc={materials?:Material[];textures?:{source?:number}[];images?:{bufferView?:number;uri?:string}[];bufferViews?:{byteLength:number}[];meshes?:{primitives:{material?:number;attributes:Record<string,number>}[]}[];nodes?:{name?:string;mesh?:number;children?:number[];extras?:{componentId?:string}}[];scenes?:{nodes:number[]}[];scene?:number}

/** Export integrity, not a visual-fidelity score. Run for any local object.
 * Smooth intentional surfaces need no normal map. Only declared procedural
 * finishes promise both maps; imported PBR materials are inventoried untouched. */
export function auditMaterials(bytes:Uint8Array) {
 const b=Buffer.from(bytes)
 if(b.length<20||b.readUInt32LE(0)!==0x46546c67||b.readUInt32LE(4)!==2||b.readUInt32LE(8)!==b.length||b.readUInt32LE(16)!==0x4e4f534a||20+b.readUInt32LE(12)>b.length)throw Error('Invalid GLB material input')
 const doc:Doc=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8')),issues:string[]=[],materials=doc.materials??[]
 const rows=materials.map((m,index)=>{
  const pbr=m.pbrMetallicRoughness,finish=m.extras?.surfaceFinish
  const maps=[m.normalTexture,m.occlusionTexture,m.emissiveTexture,pbr?.baseColorTexture,pbr?.metallicRoughnessTexture].filter((t):t is TextureInfo=>!!t)
  for(const t of maps){const texture=doc.textures?.[t.index],img=texture?.source===undefined?undefined:doc.images?.[texture.source];if(!img||(img.bufferView===undefined?!img.uri:!(doc.bufferViews?.[img.bufferView]?.byteLength)))issues.push(`Material ${index}: missing texture image`)}
  if(finish){
   if(!m.normalTexture||!pbr?.metallicRoughnessTexture)issues.push(`Material ${index}: declared finish lost normal or roughness map`)
   if(!(finish.tileMm>0)||!(finish.reliefMm>=0)||!finish.evidence)issues.push(`Material ${index}: missing scale or evidence`)
  }
  if(m.extensions?.EXT_materials_bump)issues.push(`Material ${index}: bump extension needs viewer/scale verification; prefer core normal maps`)
  return {index,name:m.name??`Material ${index}`,finish:finish??null,repair:m.extras?.materialRepair??null,normalMap:!!m.normalTexture,roughnessMap:!!pbr?.metallicRoughnessTexture,metalness:pbr?.metallicFactor??1,roughness:pbr?.roughnessFactor??1,maps,visualStatus:'pending' as const}
 })
 const components=new Map<string,Set<number>>(),visited=new Set<number>()
 function walk(index:number,owner='unmapped'){
  if(visited.has(index))throw Error('Invalid GLB hierarchy in material audit');visited.add(index)
  const n=doc.nodes?.[index];if(!n)throw Error('Missing GLB node in material audit')
  const id=n.extras?.componentId??owner
  for(const primitive of n.mesh===undefined?[]:doc.meshes?.[n.mesh]?.primitives??[]){
   if(!components.has(id))components.set(id,new Set())
   const mi=primitive.material
   if(mi===undefined){issues.push(`${id}: implicit default material needs review`);continue}
   components.get(id)!.add(mi)
   if(!rows[mi]){issues.push(`${id}: invalid material ${mi}`);continue}
   for(const t of rows[mi]!.maps){const coord=t.extensions?.KHR_texture_transform?.texCoord??t.texCoord??0;if(primitive.attributes[`TEXCOORD_${coord}`]===undefined)issues.push(`${id}: material ${mi} has no UV channel ${coord}`)}
  }
  for(const child of n.children??[])walk(child,id)
 }
 for(const n of doc.scenes?.[doc.scene??0]?.nodes??[])walk(n)
 return {version:1,modelSha256:createHash('sha256').update(b).digest('hex'),status:issues.length?'issues-found':'export-checks-passed',ready:false,issues:[...new Set(issues)],materials:rows.map(({maps:_,...row})=>row),components:[...components].map(([componentId,ids])=>({componentId,materialIndices:[...ids],visualStatus:'pending',requiredViews:['assembled','front','grazing','reverse'],requiredLighting:['neutral-daylight','midnight']})),note:'Structural checks do not establish the correct alloy, finish, UV density or visual fidelity. Compare exported renders with references for every component. Untagged source materials require evidence too.'}
}
