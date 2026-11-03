/** Read actual exported component nodes without trusting spec-to-mesh mappings.
 * Structural coverage only: a named box is not proof of anatomical fidelity. */
export function glbComponentIds(bytes:Uint8Array){
  const b=Buffer.from(bytes)
  if(b.length<20||b.readUInt32LE(0)!==0x46546c67||b.readUInt32LE(4)!==2||b.readUInt32LE(8)!==b.length||b.readUInt32LE(16)!==0x4e4f534a||b.readUInt32LE(12)+20>b.length)throw Error('Invalid GLB inventory input')
  const doc=JSON.parse(b.subarray(20,20+b.readUInt32LE(12)).toString('utf8'))
  type Node={children?:number[];mesh?:number;extras?:{componentId?:string}}
  const nodes:Node[]=doc.nodes??[],ids=new Set<string>(),visited=new Set<number>()
  const walk=(index:number,parents:Set<number>,owners:string[]):boolean=>{
    if(parents.has(index)||visited.has(index)||!nodes[index])throw Error('Invalid GLB node hierarchy')
    const node=nodes[index]!,next=new Set(parents).add(index);visited.add(index)
    const component=node.extras?.componentId,chain=component?[...owners,component]:owners
    const primitives=node.mesh===undefined?[]:doc.meshes?.[node.mesh]?.primitives??[]
    let geometry=primitives.some((p:{attributes?:{POSITION?:number}})=>p.attributes?.POSITION!==undefined&&(doc.accessors?.[p.attributes.POSITION]?.count??0)>=3)
    if(geometry)chain.forEach(id=>ids.add(id))
    for(const child of node.children??[])geometry=walk(child,next,chain)||geometry
    return geometry
  }
  for(const index of doc.scenes?.[doc.scene??0]?.nodes??[])walk(index,new Set(),[])
  return [...ids]
}
