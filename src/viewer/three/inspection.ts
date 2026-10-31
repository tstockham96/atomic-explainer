import { MathUtils, Box3, Vector3, Quaternion, Object3D } from 'three'
import { inspectionTurn } from './optics.ts'
import { ease } from './timeline.ts'

export interface InspectionStop { id:string; at:number; duration?:number }
export function inspectionState(local:number) {
  return {focus:ease(local/.2)*(1-ease((local-.8)/.2)),turn:inspectionTurn(local,.24,.76)}
}

/** Insert reversible inspection intervals into an existing assembly choreography.
 * Each interval arrives, completes a turn at full clearance, and returns before
 * assembly motion resumes. Independent of object, material or component names. */
export function createInspectionTour(stops:InspectionStop[]) {
  let cursor=0,last=0
  const intervals=stops.map(stop=>{
    if(stop.at<last||stop.at<0||stop.at>1||(stop.duration??.12)<=0)throw Error('Invalid inspection schedule')
    cursor+=stop.at-last;const start=cursor;cursor+=stop.duration??.12;last=stop.at
    return {...stop,start,end:cursor}
  })
  const total=cursor+1-last
  return {
    intervals,
    progressFor:(id:string,local=.5)=>{const stop=intervals.find(s=>s.id===id);if(!stop)throw Error(`Unknown inspection ${id}`);return (stop.start+(stop.end-stop.start)*local)/total},
    sample:(progress:number)=>{
      const time=MathUtils.clamp(progress,0,1)*total;let removed=0
      for(const stop of intervals){
        if(time<stop.start)break
        if(time<=stop.end){const local=(time-stop.start)/(stop.end-stop.start);return {base:stop.at,stop,local,...inspectionState(local)}}
        removed+=stop.end-stop.start
      }
      return {base:MathUtils.clamp(time-removed,0,1),stop:undefined,local:0,focus:0,turn:0}
    },
  }
}

/** Rotate about the component's actual centre, preserving its assembly pivot. */
export function turnAboutCenter(object:Object3D, angle:number, center:Vector3) {
  const rotation=new Quaternion().setFromAxisAngle(new Vector3(0,1,0),angle)
  object.position.sub(center).applyQuaternion(rotation).add(center)
  object.quaternion.premultiply(rotation);object.updateMatrixWorld(true)
}

export function inspectionDistance(box:Box3,fov:number,aspect:number,coverage:[number,number]) {
  const radius=box.getSize(new Vector3()).length()/2
  const aperture=Math.tan(MathUtils.degToRad(fov/2))*Math.min(aspect*coverage[0],coverage[1])
  return radius/Math.sin(Math.atan(aperture))
}
