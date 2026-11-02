import * as T from 'three'

// Seated, centered eye line. Z is the desk's vertical axis; no sideward orbit.
export const DESK_DIRECTION=new T.Vector3(0,-1,.18).normalize()
// Reserve enough object size when the phone's controls leave a short stage.
export const deskContext=(width:number,height:number)=>width<700?(height<700?0:.45):1
export function deskWide(opening:boolean,reveal:number,progress:number){
 return opening?1-reveal:T.MathUtils.smoothstep(progress,.94,1)
}
/** Transfer the original camera orbit to the object, retaining its screen-space
 * orientation. The static desk receives no story transforms. Repose root first. */
export function deskShot(root:T.Object3D,shot:{position:T.Vector3;target:T.Vector3},wide=0){
 const delta=shot.position.clone().sub(shot.target),origin=new T.Vector3(),up=new T.Vector3(0,1,0)
 const from=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(delta,origin,up))
 const to=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().lookAt(DESK_DIRECTION,origin,up))
 const rotation=to.multiply(from.invert())
 root.position.sub(shot.target).applyQuaternion(rotation);root.quaternion.premultiply(rotation);root.updateMatrixWorld(true)
 const distance=delta.length()*T.MathUtils.lerp(1.06,1.65,T.MathUtils.clamp(wide,0,1))
 return {target:origin,position:DESK_DIRECTION.clone().multiplyScalar(distance)}
}
