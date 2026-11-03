import * as T from 'three'
import { createClearGlass, createOpticalBackdrop } from '../../src/viewer/three/optics.ts'
import { createGlassEnvironment } from '../../src/viewer/three/studio.ts'
import { createCrystalGeometry, murphFront, murphRear } from '../../src/authoring/crystal.ts'

/** Actual rendered transmission regression: a generic window over a contrast chart.
 * Tests ordinary glass and sapphire from front and oblique viewing angles. */
export async function checkOptics(renderer:T.WebGLRenderer, send:(name:string,data:object)=>Promise<void>) {
 const scene=new T.Scene();scene.background=new T.Color('#243b40');const backdrop=createOpticalBackdrop(scene.background);scene.add(backdrop)
 const camera=new T.PerspectiveCamera(33,1,1,200);camera.position.set(0,0,75);camera.lookAt(0,0,0);camera.updateMatrixWorld()
 const materials=[new T.MeshBasicMaterial({color:'#eeeeee'}),new T.MeshBasicMaterial({color:'#111111'})]
 const tile=new T.PlaneGeometry(4,4)
 for(let x=0;x<6;x++)for(let y=0;y<6;y++){const m=new T.Mesh(tile,materials[(x+y)%2]);m.position.set(-10+x*4,-10+y*4,-3);scene.add(m)}
 const geometry=createCrystalGeometry(murphRear.profile)
 const curved=createCrystalGeometry(murphFront.profile)
 const glass=createClearGlass();const environment=createGlassEnvironment(renderer);glass.envMap=environment.texture
 const window=new T.Mesh<T.BufferGeometry,T.MeshPhysicalMaterial>(geometry,glass);scene.add(window)
 const target=new T.WebGLRenderTarget(512,512,{samples:4}),pixels=new Uint8Array(512*512*4),previous=renderer.getRenderTarget(),size=renderer.getSize(new T.Vector2())
 const luminance=(point:T.Vector3)=>{
  const p=point.clone().project(camera),x=Math.round((p.x*.5+.5)*512),y=Math.round((p.y*.5+.5)*512)
  let sum=0;for(let dx=-5;dx<=5;dx++)for(let dy=-5;dy<=5;dy++){const offset=((y+dy)*512+x+dx)*4;sum+=(pixels[offset]!+pixels[offset+1]!+pixels[offset+2]!)/3}return sum/121
 }
 const contrast=()=>{renderer.setRenderTarget(target);renderer.render(scene,camera);renderer.readRenderTargetPixels(target,0,0,512,512,pixels);return Math.abs(luminance(new T.Vector3(-6,2,-3))-luminance(new T.Vector3(-2,2,-3)))}
 const results=[]
 try {
  for(const shape of ['flat','curved'])for(const ior of [1.5,1.76])for(const angle of [0,.45]){
   window.geometry=shape==='curved'?curved:geometry
   glass.ior=ior;camera.position.set(0,0,75).applyAxisAngle(new T.Vector3(0,1,0),angle);camera.lookAt(0,0,0);camera.updateMatrixWorld()
   window.visible=false;const baseline=contrast();window.visible=true;const through=contrast(),retainedContrast=through/baseline
   results.push({shape,ior,viewAngle:angle,baseline,through,retainedContrast})
   if(retainedContrast<.75)throw Error(`Glass obscures background contrast: ${JSON.stringify(results.at(-1))}`)
   if(angle===0){renderer.setRenderTarget(null);renderer.setSize(512,512,false);renderer.render(scene,camera);await send(`glass-proof-${shape}-${ior===1.5?'standard':'sapphire'}`,{image:renderer.domElement.toDataURL('image/png')})}
  }
  await send('glass-transmission-check',{results})
 } finally {
  renderer.setRenderTarget(previous);renderer.setSize(size.x,size.y);target.dispose();environment.dispose();geometry.dispose();curved.dispose();tile.dispose();glass.dispose();materials.forEach(m=>m.dispose());backdrop.geometry.dispose();backdrop.material.dispose()
 }
}
