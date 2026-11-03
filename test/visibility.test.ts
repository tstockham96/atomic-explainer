import {expect,it} from 'vitest'
import * as T from 'three'
import {unobscuredSubjects} from '../src/viewer/three/visibility.ts'
it('distinguishes in-frame anatomy from anatomy hidden behind scenery',()=>{
 const camera=new T.PerspectiveCamera(40,1,.1,100);camera.position.z=5;camera.lookAt(0,0,0)
 const part=new T.Mesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial())
 const wall=new T.Mesh(new T.BoxGeometry(5,5,.1),new T.MeshBasicMaterial());wall.position.z=2
 expect(unobscuredSubjects(camera,{part})).toEqual(['part'])
 expect(unobscuredSubjects(camera,{part},wall)).toEqual([])
 wall.visible=false;expect(unobscuredSubjects(camera,{part},wall)).toEqual(['part'])
 wall.visible=true;wall.position.z=-2;expect(unobscuredSubjects(camera,{part},wall)).toEqual(['part'])
 part.position.x=10;expect(unobscuredSubjects(camera,{part},wall)).toEqual([])
})
it('reports the outer part actually visible along a concealed part’s center ray',()=>{
 const camera=new T.PerspectiveCamera(40,1,.1,100);camera.position.z=5;camera.lookAt(0,0,0)
 const hidden=new T.Mesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial())
 const front=new T.Mesh(new T.BoxGeometry(2,2,.1),new T.MeshBasicMaterial());front.position.z=2
 expect(unobscuredSubjects(camera,{hidden,front})).toEqual(['front'])
})
it('sees hollow and disconnected assemblies without mistaking their empty centers for occlusion',()=>{
 const camera=new T.PerspectiveCamera(40,1,.1,100);camera.position.z=6;camera.lookAt(0,0,0)
 const rings=new T.Group()
 for(const x of [-1,1]){const ring=new T.Mesh(new T.TorusGeometry(.5,.12,8,24),new T.MeshBasicMaterial());ring.position.x=x;rings.add(ring)}
 expect(unobscuredSubjects(camera,{rings})).toEqual(['rings'])
 const wall=new T.Mesh(new T.BoxGeometry(5,5,.1),new T.MeshBasicMaterial());wall.position.z=2
 expect(unobscuredSubjects(camera,{rings},wall)).toEqual([])
})
