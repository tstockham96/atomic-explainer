import * as T from 'three'
import {createOpticalBackdrop,isTransmitting} from './optics.ts'
import {disposeObject} from './model.ts'

export type PresentationSetting='workbench'|'studio'|'sunset'|'plain'
export function presentationSetting(value:string|null):PresentationSetting{
 return value==='workbench'||value==='studio'||value==='sunset'?value:'plain'
}

/** An optional world-space set, independent of object identity and story poses.
 * Only label millimeters when the caller supplies an established unit conversion.
 * It never changes component transforms, materials, opacity or inspection order. */
export function createPresentation(scene:T.Scene,renderer:T.WebGLRenderer,object:T.Object3D,options:{millimetersPerUnit?:number}={}){
 object.updateMatrixWorld(true)
 const box=new T.Box3().setFromObject(object),size=box.getSize(new T.Vector3()),center=box.getCenter(new T.Vector3())
 const span=Math.max(size.x,size.y,size.z),unit=options.millimetersPerUnit
 if(!Number.isFinite(span)||span<=0)throw Error("Presentation requires nonempty finite object bounds")
 if(unit!==undefined&&(!Number.isFinite(unit)||unit<=0))throw Error("Presentation scale must be positive millimeters per unit")
 const width=unit?300/unit:span*3.8,depth=width*.7,y=box.min.y-span*.035
 const group=new T.Group();group.name='presentation_set';scene.add(group)
 const backgrounds=new Map<PresentationSetting,T.CanvasTexture>()
 function background(colors:string[]){
  const c=document.createElement('canvas');c.width=256;c.height=512;const ctx=c.getContext('2d')!
  const g=ctx.createLinearGradient(0,0,110,512);colors.forEach((color,i)=>g.addColorStop(i/(colors.length-1),color));ctx.fillStyle=g;ctx.fillRect(0,0,256,512)
  const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t
 }
 backgrounds.set('workbench',background(['#ddd8cb','#b9b4a6','#939787']))
 backgrounds.set('studio',background(['#c7c4be','#ede5d8','#a9a497']))
 backgrounds.set('sunset',background(['#a49abb','#dfabb0','#f2bb94','#f6d3aa']))
 const backdrop=createOpticalBackdrop(backgrounds.get('studio')!);group.add(backdrop)
 // A curved cyclorama avoids a hard floor/sky seam at every inspection angle.
 const profile=[new T.Vector2(0,0),new T.Vector2(span*4,0)]
 for(let i=1;i<=32;i++){const a=i/32*Math.PI/2;profile.push(new T.Vector2(span*4+span*3*Math.sin(a),span*3*(1-Math.cos(a))))}
 profile.push(new T.Vector2(span*7,span*16))
 const desk=new T.Mesh(new T.LatheGeometry(profile,128),new T.MeshStandardMaterial({color:'#bdb3a1',roughness:.87,metalness:0,side:T.DoubleSide}))
 desk.name='studio_floor';desk.position.set(center.x,y-width*.002,center.z);desk.receiveShadow=true;group.add(desk)
 // A rounded physical mat; ruler and grid are authored at world scale, not a screen overlay.
 const r=width*.018,w=width/2,h=depth/2,s=new T.Shape()
 s.moveTo(-w+r,-h);s.lineTo(w-r,-h);s.quadraticCurveTo(w,-h,w,-h+r);s.lineTo(w,h-r);s.quadraticCurveTo(w,h,w-r,h);s.lineTo(-w+r,h);s.quadraticCurveTo(-w,h,-w,h-r);s.lineTo(-w,-h+r);s.quadraticCurveTo(-w,-h,-w+r,-h)
 const geometry=new T.ExtrudeGeometry(s,{depth:width*.002,bevelEnabled:true,bevelSize:width*.001,bevelThickness:width*.0007,bevelSegments:3,curveSegments:12})
 const c=document.createElement('canvas');c.width=2048;c.height=Math.round(2048*depth/width);const ctx=c.getContext('2d')!,px=c.width/width
 ctx.fillStyle='#24483f';ctx.fillRect(0,0,c.width,c.height)
 const spacing=unit?10/unit:width/30,margin=spacing*1.2
 // Mipmapped strokes avoid one-pixel grid shimmer when the camera moves.
 for(let major=0;major<2;major++){
  const step=major?spacing:spacing/5;ctx.strokeStyle=major?'#587b6c':'#315346';ctx.lineWidth=major?1.5:.7;ctx.beginPath()
  for(let x=margin;x<width-margin;x+=step){ctx.moveTo(x*px,margin*px);ctx.lineTo(x*px,(depth-margin)*px)}
  for(let z=margin;z<depth-margin;z+=step){ctx.moveTo(margin*px,z*px);ctx.lineTo((width-margin)*px,z*px)}ctx.stroke()
 }
 ctx.fillStyle='#b0beb0';ctx.font=`${spacing*.21*px}px monospace`;ctx.textAlign='center'
 if(unit)for(let x=margin;x<width-margin;x+=spacing)ctx.fillText(String(Math.round((x-margin)*(unit??1))),x*px,margin*.65*px)
 ctx.textAlign='left';ctx.font=`${spacing*.26*px}px monospace`;ctx.fillText(unit?'EXPLODE / 10 MM GRID':'EXPLODE / OBJECT LAB',margin*px,(depth-margin*.45)*px)
 const texture=new T.CanvasTexture(c);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy())
 const pos=geometry.attributes.position!,uv=geometry.attributes.uv!;for(let i=0;i<pos.count;i++)uv.setXY(i,(pos.getX(i)+w)/width,(pos.getY(i)+h)/depth)
 const mat=new T.Mesh(geometry,new T.MeshStandardMaterial({map:texture,roughness:.94,metalness:0}));mat.name='cutting_mat';mat.rotation.x=-Math.PI/2;mat.position.set(center.x,y,center.z);mat.receiveShadow=true;group.add(mat)
 const light=new T.DirectionalLight('#fff5e5',2.1);light.position.copy(center).add(new T.Vector3(-span*.65,span*1.9,span*.7));light.target.position.copy(center);light.castShadow=true
 light.shadow.mapSize.set(2048,2048);light.shadow.camera.left=-span*1.6;light.shadow.camera.right=span*1.6;light.shadow.camera.top=span*1.6;light.shadow.camera.bottom=-span*1.6;light.shadow.camera.near=span*.05;light.shadow.camera.far=span*7;light.shadow.normalBias=span*.0005;light.shadow.bias=-.00015;light.shadow.radius=6
 group.add(light,light.target)
 const casts=new Map<T.Mesh,boolean>();object.traverse(o=>{if(o instanceof T.Mesh){casts.set(o,o.castShadow)}})
 const oldShadowEnabled=renderer.shadowMap.enabled,oldShadowType=renderer.shadowMap.type
 let setting:PresentationSetting='plain',opticalFocus=0
 function focusOptics(value:number){
  opticalFocus=T.MathUtils.clamp(value,0,1)
  // Change only the photographic surround, never glass opacity or component visibility.
  backdrop.material.color.setScalar(T.MathUtils.lerp(1,.12,opticalFocus))
  desk.material.color.set(setting==='sunset'?'#d0a59a':setting==='studio'?'#bdb3a1':'#a99b83').lerp(new T.Color('#182f33'),opticalFocus)
  mat.material.color.setScalar(T.MathUtils.lerp(1,.55,opticalFocus))
 }
 function set(next:PresentationSetting){
  setting=next;group.visible=next!=='plain';mat.visible=next==='workbench';desk.visible=next!=='sunset'
  renderer.shadowMap.enabled=next!=='plain'||oldShadowEnabled;renderer.shadowMap.type=next==='plain'?oldShadowType:T.PCFShadowMap
  casts.forEach((original,m)=>{m.castShadow=next==='plain'?original:!(Array.isArray(m.material)?m.material:[m.material]).some(isTransmitting)})
  if(next!=='plain'){backdrop.material.map=backgrounds.get(next)!;backdrop.material.needsUpdate=true}
  focusOptics(opticalFocus)
  light.color.set(next==='sunset'?'#ffe3d2':'#fff5e5')
 }
 set('plain')
 return {set,focusOptics,get setting(){return setting},group,gridSpacing:spacing,millimetersPerUnit:unit,floorY:y,
  dispose(){group.removeFromParent();disposeObject(group);backgrounds.forEach(t=>t.dispose());light.dispose();casts.forEach((v,m)=>{m.castShadow=v});renderer.shadowMap.enabled=oldShadowEnabled;renderer.shadowMap.type=oldShadowType}}
}
