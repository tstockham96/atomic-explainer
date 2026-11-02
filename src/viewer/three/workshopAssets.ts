import * as T from 'three'
import {disposeObject} from './model.ts'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'

/** Locally packaged CC0 set; never fetch scenery from a third-party CDN at runtime.
 * Asset geometry is Y-up. Our stationary stage is Z-up. Scaling is art direction,
 * not a claim that the surrounding furniture is a calibrated measuring tool. */
export async function loadWorkshopAssets(root:T.Group,floor:number,environment:T.Texture,anisotropy:number){
 const loader=new GLTFLoader()
 const placements=[
  {id:'workbench',size:800,axis:'x',at:[0,0,floor],top:true,turn:0},
  {id:'desk-lamp',size:185,axis:'z',at:[-185,125,floor-18],top:false,turn:-Math.PI/2},
  {id:'bench-vise',size:57,axis:'x',at:[181,45,floor],top:false,turn:-.35},
  {id:'vernier-caliper',size:86,axis:'x',at:[94,-64,floor+2],top:false,turn:-.22},
 ] as const
 const results=await Promise.allSettled(placements.map(async p=>{
  const model=(await loader.loadAsync(new URL(`presentation/workshop/${p.id}.glb`,document.baseURI).href)).scene
  const group=new T.Group();group.name=`workshop_${p.id}`;group.add(model);model.rotation.x=Math.PI/2;group.updateMatrixWorld(true)
  let bounds=new T.Box3().setFromObject(group),size=bounds.getSize(new T.Vector3())
  model.scale.setScalar(p.size/size[p.axis]);group.updateMatrixWorld(true);bounds=new T.Box3().setFromObject(group)
  const center=bounds.getCenter(new T.Vector3());model.position.set(-center.x,-center.y,-(p.top?bounds.max.z:bounds.min.z))
  group.position.set(p.at[0],p.at[1],p.at[2]);group.rotation.z=p.turn
  model.traverse(node=>{if(node instanceof T.Mesh){node.castShadow=true;node.receiveShadow=true;for(const m of Array.isArray(node.material)?node.material:[node.material])if(m instanceof T.MeshStandardMaterial){m.envMap=environment;m.envMapIntensity=.5;if(m.map)m.map.anisotropy=anisotropy;if(m.normalMap)m.normalScale.setScalar(.45)}}})
  return group
 }))
 const loaded=results.flatMap(result=>result.status==='fulfilled'?[result.value]:[])
 const failed=results.filter(result=>result.status==='rejected')
 if(failed.length){loaded.forEach(disposeObject);throw new Error('Workshop assets could not load. Keep the presentation/workshop folder with the exported page.',{cause:failed[0]!.reason})}
 loaded.forEach(model=>root.add(model))
 return loaded.map(model=>model.name)
}
