import * as T from 'three'

/** Visibility evidence for review: a frustum check alone misses scenery in front
 * of the lesson. Probe component centers, reporting the anatomy actually hit
 * first (which can be a different, outer component). This does not certify full
 * silhouettes, transparent interiors, or text readability. */
export function unobscuredSubjects(camera:T.Camera,subjects:Record<string,T.Object3D>,scenery?:T.Object3D){
 camera.updateMatrixWorld(true)
 const entries=Object.entries(subjects),roots=entries.map(([,node])=>node)
 roots.forEach(node=>node.updateWorldMatrix(true,true));scenery?.updateWorldMatrix(true,true)
 const obstacles=scenery?.visible?[...roots,scenery]:roots
 const ray=new T.Raycaster(),point=new T.Vector3(),box=new T.Box3(),seen=new Set<string>()
 const ids=new Map(entries.map(([id,node])=>[node,id]))
 for(const [,node]of entries){
  if(!node.visible)continue
  box.setFromObject(node).getCenter(point).project(camera)
  if(Math.abs(point.x)>1||Math.abs(point.y)>1||point.z< -1||point.z>1)continue
  ray.setFromCamera(new T.Vector2(point.x,point.y),camera)
  const hit=ray.intersectObjects(obstacles,true)[0]
  if(hit)for(let current:T.Object3D|null=hit.object;current;current=current.parent){
   const id=ids.get(current);if(id){seen.add(id);break}
  }
 }
 return [...seen]
}
