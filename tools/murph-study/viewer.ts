import {deskShot,deskWide} from '../../src/viewer/three/deskCamera.ts'
import {createPresentation,presentationSetting,type PresentationSetting} from '../../src/viewer/three/presentation.ts'
import {assemblyScrollVh} from '../../src/viewer/three/assemblyTimeline.ts'
import {createAssemblyStory} from '../../src/viewer/three/assemblyStory.ts'
import assemblyScript from '../../docs/research/murph-assembly-story.json'
import { configureRenderBudget } from '../../src/viewer/three/renderBudget.ts'
import { checkOptics } from './opticsCheck.ts'
import { createGlassEnvironment } from '../../src/viewer/three/studio.ts'
import { materialState, isTransmitting, hasOptics, createOpticalBackdrop } from '../../src/viewer/three/optics.ts'
import * as T from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { buildMurph } from '../../src/authoring/murph.ts'
import { createInspectionTour, inspectionDistance, turnAboutCenter } from '../../src/viewer/three/inspection.ts'
import type { ExplodeSpec } from '../../src/spec/schema.ts'
import { murphCrystalZ } from '../../src/authoring/crystal.ts'
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js'
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js'
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { ease, separation, bridgeOffset, orbitBetween } from '../../src/authoring/studyMotion.ts'
import { explodeSpecSchema } from '../../src/spec/schema.ts'
import { componentLesson } from '../../src/viewer/three/learning.ts'

const el=(id:string)=>document.getElementById(id)!
const params=new URLSearchParams(location.search),capture=params.has('capture')
const assemblyMode=params.get('story')!=='explode'&&!capture
let assembly:ReturnType<typeof createAssemblyStory>|undefined
const renderer=new T.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:capture})
const renderBudget=configureRenderBudget(renderer)
let presentation:ReturnType<typeof createPresentation>|undefined
let setting=presentationSetting(params.get('setting'))
renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=.95
el('stage').append(renderer.domElement)
renderer.domElement.setAttribute('role','img');renderer.domElement.setAttribute('aria-label','Interactive three-dimensional watch. Choose a component below, or skip to the written explanations.')
const scene=new T.Scene(),camera=new T.PerspectiveCamera(33,1,2,2000)
scene.background=new T.Color('#e9eeeb')
const backdrop=createOpticalBackdrop(scene.background);scene.add(backdrop)
scene.environmentIntensity=.55
scene.environmentRotation.y=2.4
scene.add(new T.HemisphereLight(0xf3f7ff,0x7d897c,1.45))
const key=new T.DirectionalLight(0xfff7e5,2.3);key.position.set(-40,70,100);scene.add(key)
const rim=new T.DirectionalLight(0xd8eaff,1.5);rim.position.set(40,30,-70);scene.add(rim)
// Contact shading reveals plate thickness and component clearance. Optical windows
// must not occlude the normal/depth pass used for ambient occlusion.
// Three r187 renamed these hooks; the installed r186 declarations lag the runtime.
const visibilityHooks=GTAOPass.prototype as GTAOPass & {_overrideVisibility():void;_restoreVisibility():void}
class OpticalAO extends GTAOPass {
 optical:T.Object3D[]=[]
 _overrideVisibility(){visibilityHooks._overrideVisibility.call(this);this.optical=[];scene.traverse(o=>{if(o instanceof T.Mesh&&o.visible){const materials=Array.isArray(o.material)?o.material:[o.material];if(o.userData.opticalBackdrop||materials.some(m=>(m as T.MeshPhysicalMaterial).transmission>0||m.transparent)){this.optical.push(o);o.visible=false}}})}
 _restoreVisibility(){visibilityHooks._restoreVisibility.call(this);for(const o of this.optical)o.visible=true}
}
const antialiasTarget=new T.WebGLRenderTarget(1,1,{type:T.HalfFloatType,samples:renderBudget.software?0:Math.min(4,renderer.capabilities.maxSamples)});
const composer=new EffectComposer(renderer,antialiasTarget);composer.addPass(new RenderPass(scene,camera))
const ao=new OpticalAO(scene,camera,innerWidth,innerHeight);ao.updateGtaoMaterial({radius:2.2,thickness:1,distanceExponent:2,scale:1.1,samples:16});ao.blendIntensity=.8;composer.addPass(ao);composer.addPass(new OutputPass());const fxaa=new ShaderPass(FXAAShader);fxaa.enabled=antialiasTarget.samples===0;composer.addPass(fxaa)
let dirty=true,drawCount=0
const draw=()=>{if(renderBudget.postprocessing)composer.render();else renderer.render(scene,camera);dirty=false;drawCount++}
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enabled=false;controls.enablePan=false;controls.minDistance=30;controls.maxDistance=300
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches
let free=false,paused=false,progress=0,manualProgress=0,last=performance.now(),time=0,model:Awaited<ReturnType<typeof buildMurph>>
let dossier:ExplodeSpec
const tour=createInspectionTour([
 {id:'crystal',at:.28},{id:'hands',at:.43},{id:'dial',at:.53},
 {id:'case',at:.55},{id:'crown',at:.56},{id:'seals',at:.57},
 {id:'caseback',at:.65},{id:'rear-window',at:.65},{id:'rotor',at:.76},
 {id:'movement',at:.87},{id:'winding-train',at:.87},{id:'barrel',at:.87},{id:'mainspring',at:.87},
 {id:'wheel-train',at:.87},{id:'escapement',at:.87},{id:'balance',at:.87},{id:'strap',at:.98,duration:.24},
])
const mechanisms=['movement','mainspring','barrel','wheel-train','winding-train','escapement','balance']
type Frame={p:number;camera:number[];target:number[];focus:string[];title:string;description:string;detail:string;chapter:number}
const crystalInspectionZ=murphCrystalZ+27+35
const frames:Frame[]=[
 {p:0,camera:[38,23,145],target:[0,0,0],focus:[],chapter:1,title:'Khaki Field<br>Murph.',description:'A mechanical watch, powered by movement. Scroll to follow energy from your wrist to the hands.',detail:'42 mm · Automatic · Up to 80 hours of power reserve'},
 {p:.135,camera:[38,23,145],target:[0,0,0],focus:[],chapter:1,title:'Every side has a story.',description:'Turn it over. The front tells you the time; the transparent back lets you look at the mechanism that keeps it.',detail:'A complete turn · One continuous object'},
 {p:.23,camera:[101,47,116],target:[0,0,-3],focus:[],chapter:2,title:'Protection. Display.<br>Mechanism.',description:'The layers separate along their assembly axis. Glass protects the hands and dial. The case surrounds the movement. A second window closes the back.',detail:'Separation reveals the assembly'},
 {p:.28,camera:[28,16,crystalInspectionZ+45],target:[0,0,crystalInspectionZ],focus:['crystal'],chapter:3,title:'A clear surface.<br>A visible boundary.',description:'A sapphire crystal sits above the hands. Lift it clear and turn it through the light: a thin edge and moving reflections reveal the transparent surface. It protects the display without concealing the hands or printed scales.',detail:'Front crystal · Sapphire'},
 {p:.38,camera:[28,16,crystalInspectionZ+45],target:[0,0,crystalInspectionZ],focus:['crystal'],chapter:3,title:'A clear surface.<br>A visible boundary.',description:'A sapphire crystal sits above the hands. Lift it clear and turn it through the light: a thin edge and moving reflections reveal the transparent surface. It protects the display without concealing the hands or printed scales.',detail:'Front crystal · Sapphire'},
 {p:.43,camera:[7,10,62],target:[0,3,20],focus:['hands'],chapter:4,title:'Three hands.<br>Three timescales.',description:'Hour, minute and seconds hands share a center but occupy different heights. The short hour hand reads the numerals; the longer hands reach toward the finer divisions. Metal outlines hold the luminous fill.',detail:'Cathedral hands · Metal and luminous material'},
 {p:.53,camera:[7,4,77],target:[0,0,9],focus:['dial'],chapter:5,title:'A quiet, fixed<br>frame of reference.',description:'The dial stays still. Large hour numerals and smaller minute graduations give the three moving hands a shared scale. Pale markings stand out against the matte black surface.',detail:'Stationary dial · Pale Arabic numerals'},
 {p:.65,camera:[-55,25,-118],target:[0,0,-29],focus:['caseback','rear-window','rotor',...mechanisms],chapter:6,title:'The back has<br>its own layers.',description:'The back is an assembly too: a steel retaining ring, a transparent window, and the rotor below it. They remain separated so you can follow the order from the window to the mechanism.',detail:'Exhibition back · Rear window material unverified'},
 {p:.76,camera:[-30,20,-94],target:[0,0,-19],focus:['rotor',...mechanisms],chapter:7,title:'Motion becomes<br>stored energy.',description:'The weighted rotor turns on its central bearing while the bridges stay still. Beneath it, winding gears deliver that motion to the mainspring barrel.',detail:'H-10 family-informed geometry · Approximate internals'},
 {p:.87,camera:[-26,22,-78],target:[5,0,-14],focus:mechanisms,chapter:8,title:'Energy needs<br>a rhythm.',description:'The bridges lift to reveal the energy path. The mainspring supplies the wheel train; the escapement and balance regulate its release. The concealed layout shown here is an educational approximation.',detail:'Store → Transmit → Regulate → Display'},
 {p:1,camera:[38,23,145],target:[0,0,0],focus:[],chapter:9,title:'One watch.<br>Many things working.',description:'Every layer returns to its place. Keep scrolling for the materials, making processes and sources behind the model.',detail:'Continue to the making stories ↓'},
]
const offsets:Record<string,number[]>={crystal:[0,0,27],hands:[0,0,17],dial:[0,0,7],case:[0,0,0],crown:[10,0,0],seals:[0,0,0],movement:[0,0,-10],rotor:[0,0,-29],'rear-window':[0,0,-40],caseback:[0,0,-49],strap:[0,0,0],mainspring:[0,0,-10],barrel:[0,0,-10],'wheel-train':[0,0,-10],'winding-train':[0,0,-10],escapement:[0,0,-10],balance:[0,0,-10]}
const inspectionBounds=new Map<string,T.Box3>()
const strapHomes:{node:T.Object3D;home:T.Vector3;sign:number}[]=[], fittedDistances:number[]=[]
const home:Record<string,T.Vector3>={},orientation:Record<string,T.Quaternion>={},finishes:Record<string,ReturnType<typeof materialState>[]>={}
const overlay=document.createElementNS('http://www.w3.org/2000/svg','svg');overlay.setAttribute('aria-hidden','true');overlay.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';el('frame').append(overlay)
const callouts=[{part:'barrel',point:[5.3,-6.4,.3],text:'Mainspring · stores energy',slot:0},{part:'wheel-train',point:[.9,-2.6,.3],text:'Wheel train · transfers',slot:1},{part:'balance',point:[.7,7.4,0],text:'Balance · regulates',slot:2}].map(c=>{
 const label=document.createElement('span');label.textContent=c.text;label.style.cssText='position:absolute;pointer-events:none;font:10px Arial,sans-serif;color:#30493a;letter-spacing:.2px;background:#edf2edee;border:1px solid #c2cec4;border-radius:20px;padding:7px 10px;white-space:nowrap;transform:translate(-50%,-50%);display:none';el('frame').append(label)
 const line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('stroke','#7c9382');line.setAttribute('stroke-width','1');overlay.append(line)
 return {...c,label,line}
})
const clamp=T.MathUtils.clamp,lerp=T.MathUtils.lerp,smooth=ease
function resize(){dirty=true;renderer.setSize(innerWidth,innerHeight);composer.setSize(innerWidth,innerHeight);fxaa.uniforms.resolution!.value.set(1/(innerWidth*renderer.getPixelRatio()),1/(innerHeight*renderer.getPixelRatio()));camera.aspect=innerWidth/innerHeight;camera.setViewOffset(innerWidth,innerHeight,innerWidth<700?0:-innerWidth*.16,innerWidth<700?innerHeight*.14:0,innerWidth,innerHeight);camera.updateProjectionMatrix();if(model){fitKeyframes();if(assembly){paintStory(progress);draw()}}}
addEventListener('resize',resize);resize()
function placeParts(p:number){
 model.root.position.set(0,0,0);model.root.quaternion.identity()
 for(const[id,group]of Object.entries(model.parts)){group.position.copy(home[id]!).addScaledVector(new T.Vector3(...offsets[id] as [number,number,number]),separation(id,p));group.quaternion.copy(orientation[id]!)}
 for(const strap of strapHomes)strap.node.position.copy(strap.home).add(new T.Vector3(0,strap.sign*18*separation('strap',p),0))
 const clearance=35*smooth((p-.23)/.05)*(1-smooth((p-.38)/.05))
 model.parts.crystal!.position.z+=clearance
 model.bridgePack.position.copy(bridgeOffset(p))
 model.root.updateMatrixWorld(true)
}
function fitKeyframes(){
 // Fit once at authored stops; departing context never changes camera distance.
 fittedDistances.length=0
 for(const f of frames){
  placeParts(f.p)
  const target=new T.Vector3().fromArray(f.target),direction=new T.Vector3().fromArray(f.camera).sub(target).normalize()
  const right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),direction).normalize(),up=new T.Vector3().crossVectors(direction,right)
  const tan=Math.tan(T.MathUtils.degToRad(camera.fov/2)),width=innerWidth<700?.82:.58,height=innerWidth<700?.58:.78
  let distance=new T.Vector3().fromArray(f.camera).distanceTo(target)
  for(const[id,g]of Object.entries(model.parts))if(!f.focus.length||f.focus.includes(id)){
   const box=new T.Box3().setFromObject(g)
   for(const xx of [box.min.x,box.max.x])for(const yy of [box.min.y,box.max.y])for(const zz of [box.min.z,box.max.z]){
    const v=new T.Vector3(xx,yy,zz).sub(target)
    distance=Math.max(distance,Math.abs(v.dot(right))/(tan*camera.aspect*width)+v.dot(direction),Math.abs(v.dot(up))/(tan*height)+v.dot(direction))
   }
  }
  fittedDistances.push((f.p<=.135||f.p===1)&&innerWidth>=700?175:distance)
 }
 // A fixed radius throughout the initial turn avoids breathing as the strap turns.
 fittedDistances[0]=fittedDistances[1]=Math.max(fittedDistances[0]!,fittedDistances[1]!)
 inspectionBounds.clear()
 for(const stop of tour.intervals){
  placeParts(stop.at);model.rotorPivot.rotation.z=0;if(stop.id==='movement')model.bridgePack.position.set(0,0,0)
  model.root.updateMatrixWorld(true)
  inspectionBounds.set(stop.id,new T.Box3().setFromObject(model.parts[stop.id]!,true))
 }
}
type TourSample=ReturnType<typeof tour.sample>
function pose(p:number,t:number,inspection?:TourSample,overall=p){
 const right=frames.findIndex(f=>f.p>=p),b=frames[Math.max(1,right<0?frames.length-1:right)]!,a=frames[Math.max(0,frames.indexOf(b)-1)]!
 const x=smooth((p-a.p)/(b.p-a.p)),selected=x<.5?a:b
 placeParts(p)
 const focus=inspection?.focus??0,partId=inspection?.stop?.id
 if(partId==='movement')model.bridgePack.position.multiplyScalar(1-focus)
 model.rotorPivot.rotation.z=(.4+Math.sin(t*.65)*1.25)*(partId==='rotor'?1-focus:1)
 model.root.updateMatrixWorld(true)
 const inspected=partId?model.parts[partId]:undefined
 const inspectionBox=partId?inspectionBounds.get(partId)?.clone():undefined
 const inspectionCenter=inspectionBox?.getCenter(new T.Vector3())
 const clearance=inspectionBox?Math.max(180,inspectionBox.getSize(new T.Vector3()).length()*3):180
 for(const[id,group]of Object.entries(model.parts)){
  const v=(f:Frame)=>f.focus.length===0||f.focus.includes(id)?1:0
  const start=v(a),end=v(b)
  // Bring the next layer into view before the previous one leaves; there must
  // never be an empty midpoint between two inspections.
  let presence=start===end?start:end===1?smooth(x/.45):1-smooth((x-.55)/.45)
  // Move the rotor out of the camera view before the bridge crosses its silhouette.
  if(id==='rotor'&&p>.76&&p<.95)presence=1-smooth((p-.765)/.025)
  if(id==='rotor'&&p>=.95)presence=smooth((p-.95)/.025)
  // Keep every solid intact. Unselected layers slide away in their separated lanes.
  group.visible=true
  group.position.x+=(1-presence)*180*(1-focus)+(id===partId?0:clearance)*focus
 }
 // A continuous 360 orbit before the assembly opens, never a sequence of still images.
 let orbit=0;if(p<=.135)orbit=smooth(p/.135)*Math.PI*2
 const target=new T.Vector3().fromArray(a.target).lerp(new T.Vector3().fromArray(b.target),x)
 const from=new T.Vector3().fromArray(a.camera).sub(new T.Vector3().fromArray(a.target)).setLength(fittedDistances[frames.indexOf(a)]!)
 const to=new T.Vector3().fromArray(b.camera).sub(new T.Vector3().fromArray(b.target)).setLength(fittedDistances[frames.indexOf(b)]!)
 const offset=orbitBetween(from,to,x)
 if(p<=.135)offset.applyAxisAngle(new T.Vector3(0,1,0),orbit)
 let c=target.clone().add(offset)
 if(inspected&&inspectionBox&&inspectionCenter&&inspection){
  // Full turn only while isolated. Every transform restores before travel resumes.
  if(focus>.999)turnAboutCenter(inspected,inspection.turn,inspectionCenter)
  const rear=['caseback','rear-window','rotor',...mechanisms].includes(partId!)
  const direction=partId==='strap'?offset.clone().normalize():new T.Vector3(.25,.12,rear?-1:1).normalize()
 const distance=inspectionDistance(inspectionBox,camera.fov,camera.aspect,innerWidth<700?[.76,Math.max(.2,(el('chapter').getBoundingClientRect().top-115)/innerHeight)]:[.52,.7])
  const inspectionOffset=direction.multiplyScalar(Math.max(distance,18))
  const blended=orbitBetween(offset,inspectionOffset,focus)
  target.lerp(inspectionCenter,focus);c=target.clone().add(blended)
 }
 const contrast=Math.max(smooth((p-.165)/.065)*(1-smooth((p-.455)/.06)),inspected&&hasOptics(inspected)?focus:0)
 presentation?.focusOptics(contrast)
 if(setting==='plain'){
 // A dark photographic backdrop gives transparent glass and pale hands contrast.
 // Any transmitting component receives the same inspection backdrop. This is
 // material-driven, never a special treatment reserved for the front crystal.
 ;(scene.background as T.Color).setRGB(2.15,2.05,1.9).lerp(new T.Color('#243b40'),contrast)
 backdrop.material.color.copy(scene.background as T.Color)
 el('frame').style.setProperty('--study-ink',new T.Color('#263832').lerp(new T.Color('#f3f0df'),contrast).getStyle())
 el('frame').style.setProperty('--study-muted',new T.Color('#566960').lerp(new T.Color('#c1d0cf'),contrast).getStyle())
 }
 if(innerWidth<700){const top=90,bottom=Math.max(180,el('chapter').getBoundingClientRect().top-20);camera.setViewOffset(innerWidth,innerHeight,0,innerHeight/2-(top+bottom)/2,innerWidth,innerHeight);camera.updateProjectionMatrix()}
 if(setting==='workbench'){const shot=deskShot(model.root,{position:c,target},1-focus);c=shot.position;target.copy(shot.target)}
 if(!free){camera.position.copy(c);controls.target.copy(target);camera.lookAt(target)}
 // Smooth independent rotor swing. Winding direction and gear ratios are not simulated.
 model.balanceWheel.rotation.z=Math.sin(t*12)*.42
 model.seconds.rotation.z=2.43
 el('title').innerHTML=selected.title;el('description').textContent=selected.description;el('detail').textContent=selected.detail
 el('chapter-number').textContent=`0${selected.chapter} / 09`;el('count').textContent=`0${selected.chapter} — 09`
 if(partId&&focus>.45){
  const component=dossier.components.find(c=>c.id===partId)!,evidence=dossier.understanding!.components.find(c=>c.componentId===partId)!
  el('title').textContent=component.name
  el('description').textContent=evidence.function+' '+(partId==='hands'?'Separate luminous cells sit inside the metal frames. The hour, minute and seconds hands share a pivot, at different heights.':partId==='rotor'?'Its heavier outer edge turns around the central bearing. Fine straight brushing crosses the face; the rim has a radial finish. The photos reveal that finish, but not the alloy underneath.':'Turn it over to inspect its shape, thickness and connections.')
  el('detail').textContent=component.material
  const index=tour.intervals.findIndex(s=>s.id===partId)+1
  el('chapter-number').textContent=`COMPONENT ${String(index).padStart(2,'0')} / ${tour.intervals.length}`
  el('count').textContent='360° inspection'
 }
 el('progress').style.transform=`scaleX(${overall})`
 ;(el('component-menu') as HTMLSelectElement).value=partId??''
 el('hint').textContent=free?'Drag to orbit · Scroll to continue':'Scroll to explore ↓'
 model.root.updateMatrixWorld(true)
 for(const c of callouts){const shown=p>.81&&p<.93&&focus<.05;c.label.style.display=shown?'block':'none';c.line.style.display=shown?'':'none';if(!shown)continue
  const point=model.parts[c.part]!.localToWorld(new T.Vector3(...c.point as [number,number,number])).project(camera)
  const x=(point.x*.5+.5)*innerWidth,y=(-point.y*.5+.5)*innerHeight
  const labelX=innerWidth<700?innerWidth*(.23+c.slot*.27):innerWidth*(.43+c.slot*.22),labelY=innerWidth<700?innerHeight*(c.slot===1?.15:.23):innerHeight*(c.slot===1?.18:.29)
  c.label.style.left=`${labelX}px`;c.label.style.top=`${labelY}px`;c.line.setAttribute('x1',String(labelX));c.line.setAttribute('y1',String(labelY+12));c.line.setAttribute('x2',String(x));c.line.setAttribute('y2',String(y))
 }
}
function poseAssembly(p:number,t:number){
 if(!assembly)return
 model.root.position.set(0,0,0);model.root.quaternion.identity()
 model.bridgePack.position.set(0,0,0);model.rotorPivot.rotation.z=0;model.balanceWheel.rotation.z=Math.sin(t*12)*.42;model.seconds.rotation.z=2.43
 for(const strap of strapHomes)strap.node.position.copy(strap.home)
 const state=assembly.pose(p),chapter=state.chapter
 el('title').textContent=state.opening?assembly.story.opening.title:state.complete?assembly.story.closing.title:chapter.title
 el('description').textContent=state.opening?assembly.story.opening.description:state.complete?assembly.story.closing.description:state.local>=.76?chapter.joined:chapter.description
 el('detail').textContent=state.opening||state.complete?assembly.story.note:chapter.detail??chapter.componentIds.map(id=>dossier.components.find(c=>c.id===id)?.material??'').join(' · ')
 el('chapter-number').textContent=state.opening?'The whole object':state.complete?'The complete watch':`${String(state.index+1).padStart(2,'0')} / ${assembly.story.chapters.length} · ${chapter.kind==='milestone'?'Milestone':state.local>=.76?'Joining the watch':'How it’s made'}`
 el('count').textContent=state.opening?'Scroll inside, then build outward':state.complete?'One complete watch':`${state.builtIds.length} / ${Object.keys(model.parts).length} parts assembled`
 el('progress').style.transform=`scaleX(${p})`
 ;(el('component-menu') as HTMLSelectElement).value=state.opening?'opening':state.complete?'':chapter.id
 el('hint').textContent=free?'Drag to orbit · Scroll to continue':'Scroll to build ↓'
 for(const c of callouts){c.label.style.display='none';c.line.style.display='none'}
 const glass=chapter.componentIds.some(id=>hasOptics(model.parts[id]!)),contrast=glass&&!state.complete?state.focus:0
 presentation?.focusOptics(contrast)
 if(setting==='plain'){
 ;(scene.background as T.Color).setRGB(2.15,2.05,1.9).lerp(new T.Color('#243b40'),contrast);backdrop.material.color.copy(scene.background as T.Color)
 el('frame').style.setProperty('--study-ink',new T.Color('#263832').lerp(new T.Color('#f3f0df'),contrast).getStyle());el('frame').style.setProperty('--study-muted',new T.Color('#566960').lerp(new T.Color('#c1d0cf'),contrast).getStyle())
 }
 const available=Math.max(.16,(el('chapter').getBoundingClientRect().top-115)/innerHeight)
 let shot=assembly.camera(state,camera.fov,camera.aspect,innerWidth<700?[.76,available]:[.52,.7])
 if(setting==='workbench')shot=deskShot(model.root,shot,deskWide(state.opening,state.reveal,p))
 if(innerWidth<700){const top=90,bottom=Math.max(180,el('chapter').getBoundingClientRect().top-20);camera.setViewOffset(innerWidth,innerHeight,0,innerHeight/2-(top+bottom)/2,innerWidth,innerHeight)}else camera.setViewOffset(innerWidth,innerHeight,-innerWidth*.16,0,innerWidth,innerHeight)
 camera.updateProjectionMatrix()
 if(!free){camera.position.copy(shot.position);controls.target.copy(shot.target);camera.lookAt(shot.target)}
 model.root.updateMatrixWorld(true)
}
function chooseSetting(value:PresentationSetting){
 setting=value;presentation?.set(value);backdrop.visible=value==='plain'
 el('frame').dataset.setting=value
 ;(el('setting-menu') as HTMLSelectElement).value=value
 if(value!=='plain'){el('frame').style.setProperty('--study-ink','#24342f');el('frame').style.setProperty('--study-muted','#445b51')}
 const url=new URL(location.href);if(value==='plain')url.searchParams.delete('setting');else url.searchParams.set('setting',value);history.replaceState(null,'',url)
 dirty=true;if(model){paintStory(progress);draw()}
}
el('setting-menu').onchange=e=>chooseSetting((e.target as HTMLSelectElement).value as PresentationSetting)
function paintStory(p:number){if(assemblyMode)poseAssembly(p,time);else {const sample=tour.sample(p);pose(sample.base,time,sample,p)}}
const rotate=el('rotate');rotate.onclick=()=>{dirty=true;free=!free;controls.enabled=free;rotate.textContent=free?'Return to story':'Explore freely';rotate.setAttribute('aria-pressed',String(free))}
el('motion').onclick=()=>{dirty=true;paused=!paused;el('motion').textContent=paused?'Resume motion':'Pause motion';el('motion').setAttribute('aria-pressed',String(paused))}
function navigate(id:string){free=false;controls.enabled=false;rotate.textContent='Explore freely';rotate.setAttribute('aria-pressed','false');manualProgress=assemblyMode?(id==='opening'?0:id?assembly!.progressFor(id,.2):1):(id?tour.progressFor(id,.2):0);progress=manualProgress;if(!reduce)scrollTo({top:progress*(el('journey').offsetHeight-innerHeight),behavior:'instant'});paintStory(progress);paintStory(progress);draw()}
el('component-menu').onchange=event=>navigate((event.target as HTMLSelectElement).value)
el('next-part').onclick=()=>{if(assemblyMode){const state=assembly!.pose(progress);navigate(state.opening||state.complete?assembly!.story.chapters[0]!.id:assembly!.story.chapters[state.index+1]?.id??'')}else {const selected=tour.sample(progress).stop?.id,index=tour.intervals.findIndex(s=>s.id===selected);navigate(tour.intervals[(index+1)%tour.intervals.length]!.id)}}
addEventListener('scroll',()=>{if(free){free=false;controls.enabled=false;rotate.textContent='Explore freely';rotate.setAttribute('aria-pressed','false')}},{passive:true})
function render(ms:number){
 const dt=Math.min((ms-last)/1000,.05);last=ms
 if(document.hidden)return
 const max=el('journey').offsetHeight-innerHeight,goal=reduce?manualProgress:clamp(scrollY/Math.max(max,1),0,1)
 const moving=Math.abs(goal-progress)>.00001,ambient=!paused&&!reduce
 const orbitChanged=free&&controls.update()
 if(!dirty&&!moving&&!ambient&&!orbitChanged)return
 if(ambient)time+=dt
 progress=reduce||!moving?goal:lerp(progress,goal,1-Math.exp(-dt*8))
 paintStory(progress);draw()
}
const send=async(name:string,data:object)=>{const r=await fetch('http://127.0.0.1:4320/capture',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,...data})});if(!r.ok)throw Error('Capture write failed')}
async function main(){
 const hdr=await new RGBELoader().loadAsync('studio-small-09.hdr');hdr.mapping=T.EquirectangularReflectionMapping;const pmrem=new T.PMREMGenerator(renderer);const environment=pmrem.fromEquirectangular(hdr);scene.environment=environment.texture;hdr.dispose();pmrem.dispose()
 const studyResponse=await fetch('study.json');if(!studyResponse.ok)throw Error('Research dossier is missing')
 dossier=explodeSpecSchema.parse(await studyResponse.json())
 for(const component of dossier.components){
  const lesson=componentLesson(dossier,component.id)!
  if(tour.intervals.some(stop=>stop.id===component.id)){const option=document.createElement('option');option.value=component.id;option.textContent=component.name;el('component-menu').append(option)}
  const article=document.createElement('article'),heading=document.createElement('h3'),body=document.createElement('div');heading.textContent=lesson.name
  for(const text of [lesson.overview,...lesson.connections,lesson.material]){const p=document.createElement('p');p.textContent=text;body.append(p)}
  if(lesson.uncertainties.length){const p=document.createElement('p');p.className='evidence-note';p.textContent='Still uncertain: '+lesson.uncertainties.join(' ');body.append(p)}
  article.append(heading,body);el('component-explanations').append(article)
 }
 const source=await fetch('model-source.json').then(r=>r.ok?r.json():{kind:'authoring'})
 if(source.kind==='gltf'){
  const loaded=(await new GLTFLoader().loadAsync(source.url)).scene
  const get=(name:string)=>{const node=loaded.getObjectByName(name);if(!node)throw Error(`Packaged model is missing ${name}`);return node}
  model={root:loaded,parts:Object.fromEntries(tour.intervals.map(s=>[s.id,get(s.id) as T.Group])),rotorPivot:get('rotor_pivot') as T.Group,balanceWheel:get('balance_wheel') as T.Group,bridgePack:get('bridge_pack') as T.Group,hour:get('hour_hand') as T.Group,minute:get('minute_hand') as T.Group,seconds:get('seconds_hand') as T.Group,wheels:[]}
 }else model=await buildMurph('dial-clean.png','strap-source.glb',dossier)
 scene.add(model.root)
 for(const[id,group]of Object.entries(model.parts)){home[id]=group.position.clone();orientation[id]=group.quaternion.clone();finishes[id]=[];const copied=new Map<T.Material,T.Material>();group.traverse(o=>{if(o instanceof T.Mesh){const copy=(m:T.Material)=>{if(!copied.has(m)){const c=m.clone();copied.set(m,c);finishes[id]!.push(materialState(c))}return copied.get(m)!};o.material=Array.isArray(o.material)?o.material.map(copy):copy(o.material)}})}
 // The same restrained optical lighting applies to every transmitting material,
 // including the rear window and future imported glass components.
 const opticalMap=createGlassEnvironment(renderer)
 for(const entries of Object.values(finishes))for(const entry of entries)if(isTransmitting(entry.material)){entry.material.envMap=opticalMap.texture;entry.material.envMapIntensity=.7;entry.material.needsUpdate=true}
 for(const node of model.parts.strap!.children){const center=new T.Box3().setFromObject(node).getCenter(new T.Vector3());strapHomes.push({node,home:node.position.clone(),sign:Math.sign(center.y)||1})}
 fitKeyframes()
 placeParts(0);model.rotorPivot.rotation.z=0;model.bridgePack.position.set(0,0,0)
 assembly=createAssemblyStory(model.root,model.parts,assemblyScript)
 if(assemblyMode){
  if(!reduce)el('journey').style.height=`${assemblyScrollVh(assembly.story.chapters.length)}vh`
  document.querySelector('header .eyebrow')!.textContent=assembly.story.title
  document.querySelector('header h1')!.textContent='Hamilton Khaki Field Murph'
  const menu=el('component-menu') as HTMLSelectElement;menu.replaceChildren()
  const opening=document.createElement('option');opening.value='opening';opening.textContent='Whole object · start here';menu.append(opening)
  for(const chapter of assembly.story.chapters){const option=document.createElement('option');option.value=chapter.id;option.textContent=chapter.kind==='milestone'?`Milestone · ${chapter.title}`:dossier.components.find(c=>c.id===chapter.id)?.name??chapter.title;menu.append(option)}
  const complete=document.createElement('option');complete.value='';complete.textContent='The complete watch';menu.append(complete)
 }
 el('status').textContent='Research-led 3D study'
 el('status').dataset.ready='true'
 // Render anatomy images directly from these same meshes.
 for(const[id,p]of [['crystal',.28],['hands',.43],['rotor',.76]] as const){pose(p,0);camera.clearViewOffset();draw();(el(`story-${id}`) as HTMLImageElement).src=renderer.domElement.toDataURL('image/png');resize()}
 if(!capture){placeParts(0);presentation=createPresentation(scene,renderer,model.root,{millimetersPerUnit:1});chooseSetting(setting)}
 if(capture){
  if(params.has('optics')){await checkOptics(renderer,send);resize()}
  for(const[name,p]of [['assembled',0],['separated',.23],['crystal',.28],['hands',.43],['clean-dial',.53],['rear-window',.65],['rotor',.76],['mechanism',.87],['reassembled',1]] as const){pose(p,2);draw();await send(name+(innerWidth<700?'-mobile':''),{image:renderer.domElement.toDataURL('image/png')})}
  if(params.has('profile'))for(const [name,position]of [['side',[100,0,0]],['oblique',[65,40,65]],['front',[0,0,100]]] as const){
   pose(0,0);camera.clearViewOffset();camera.position.fromArray(position);controls.target.set(0,0,0);camera.lookAt(controls.target);draw();await send('profile-'+name,{image:renderer.domElement.toDataURL('image/png')});resize()
  }
  if(params.has('motion')){
   const trajectory:object[]=[];let maxStep=0,maxAt=0,maxNonOrbitStep=0,minRadius=Infinity,previous:T.Vector3|undefined,allPartsVisible=true,materialsUnchanged=true
   for(let i=0;i<=1000;i++){const sample=tour.sample(i/1000);pose(sample.base,2,sample,i/1000);allPartsVisible&&=Object.values(model.parts).every(p=>p.visible);materialsUnchanged&&=Object.values(finishes).flat().every(f=>f.material.opacity===f.opacity&&f.material.transparent===f.transparent&&f.material.alphaHash===f.alphaHash);if(previous){const step=camera.position.distanceTo(previous);if(step>maxStep){maxStep=step;maxAt=i/1000};if(sample.base>.135)maxNonOrbitStep=Math.max(maxNonOrbitStep,step)};if(i>=965&&i<=978)trajectory.push({p:i/1000,base:sample.base,focus:sample.focus,id:sample.stop?.id,camera:camera.position.toArray(),target:controls.target.toArray()});previous=camera.position.clone();minRadius=Math.min(minRadius,camera.position.distanceTo(controls.target))}
   await send('motion-check',{samples:1001,maxStep,maxAt,trajectory,maxNonOrbitStep,minRadius,allPartsVisible,materialsUnchanged})
   for(const [name,p]of [['opening',.175],['glass-quarter',.315],['glass-half',.33],['glass-three-quarter',.345],['glass-end',.38],['to-hands',.405],['turning-rear',.59],['bridge-lift',.82],['bridge-slide',.85],['closing',.96]] as const){pose(p,2);draw();await send(name,{image:renderer.domElement.toDataURL('image/png')})}
  }
  if(params.has('turns')){
   const results=[]
   const sheets=new Map([.2,.37,.5].map(local=>{const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=Math.ceil(tour.intervals.length/4)*300;return [local,canvas] as const}))
   for(const stop of tour.intervals){
    for(const local of [.2,.37,.5,.63,.8]){
     const sample=tour.sample(tour.progressFor(stop.id,local));pose(sample.base,2,sample);draw()
     const part=model.parts[stop.id]!,box=new T.Box3().setFromObject(part),corners=[]
     for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])corners.push(new T.Vector3(x,y,z).project(camera))
     const frustum=new T.Frustum().setFromProjectionMatrix(new T.Matrix4().multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse))
     const contextInFrame=Object.entries(model.parts).filter(([id,g])=>id!==stop.id&&frustum.intersectsBox(new T.Box3().setFromObject(g))).map(([id])=>id)
     results.push({id:stop.id,local,contextInFrame,visible:part.visible,insideFrame:corners.every(v=>Math.abs(v.x)<1&&Math.abs(v.y)<1&&v.z<1)})
     if(['hands','rotor','movement','crystal','rear-window'].includes(stop.id))await send(`turn-${stop.id}-${Math.round(local*100)}`,{image:renderer.domElement.toDataURL('image/png')})
     const sheet=sheets.get(local)
     if(sheet){
      const ctx=sheet.getContext('2d')!,index=tour.intervals.indexOf(stop),tx=index%4*400,ty=Math.floor(index/4)*300
      ctx.fillStyle='#dce2de';ctx.fillRect(tx,ty,400,300)
      const source=renderer.domElement,w=source.width,h=source.height
      const sx=Math.max(0,(Math.min(...corners.map(v=>v.x))*.5+.5)*w-16),sy=Math.max(0,(.5-Math.max(...corners.map(v=>v.y))*.5)*h-16)
      const sw=Math.min(w-sx,(Math.max(...corners.map(v=>v.x))*.5+.5)*w+16-sx),sh=Math.min(h-sy,(.5-Math.min(...corners.map(v=>v.y))*.5)*h+16-sy)
      const scale=Math.min(380/sw,255/sh);ctx.drawImage(source,sx,sy,sw,sh,tx+(400-sw*scale)/2,ty+25+(265-sh*scale)/2,sw*scale,sh*scale)
      ctx.fillStyle='#263832';ctx.font='18px Arial';ctx.fillText(`${index+1}. ${stop.id}`,tx+14,ty+23)
     }
    }
   }
   await send('inspection-check',{results,bounds:[...inspectionBounds].map(([id,b])=>({id,size:b.getSize(new T.Vector3()).toArray(),center:b.getCenter(new T.Vector3()).toArray()}))})
   for(const[local,sheet]of sheets)await send(`component-review-${Math.round(local*100)}`,{image:sheet.toDataURL('image/png')})
   await send('component-material-inventory',{components:Object.entries(model.parts).map(([id,part])=>{
    const materials=new Set<T.Material>();part.traverse(o=>{if(o instanceof T.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])materials.add(m)})
    return {id,materials:[...materials].map(material=>{const m=material as T.MeshPhysicalMaterial;return {name:m.name,type:m.type,color:m.color?.getHexString(),metalness:m.metalness,roughness:m.roughness,transmission:m.transmission??0,ior:m.ior,hasColorMap:!!m.map,hasNormalMap:!!m.normalMap,hasBumpMap:!!m.bumpMap,hasRoughnessMap:!!m.roughnessMap,evidence:m.userData}})}
   })})
  }
  if(params.has('lighting'))for(const angle of [0,1.57,3.14,4.71]){scene.environmentRotation.y=angle;pose(.87,2);draw();await send('lighting-'+Math.round(angle*100),{image:renderer.domElement.toDataURL('image/png')})}scene.environmentRotation.y=2.4
  const report={parts:Object.keys(model.parts),width:innerWidth,height:innerHeight,overflow:document.documentElement.scrollWidth>innerWidth,meshes:0,triangles:0,finite:true}
  model.root.traverse(o=>{if(o instanceof T.Mesh){report.meshes++;report.triangles+=(o.geometry.index?.count??o.geometry.attributes.position!.count)/3;report.finite&&=Array.from(o.matrixWorld.elements).every(Number.isFinite)}})
  await send('assembly-check',{...report})
  pose(.87,2);await send('layout'+(innerWidth<700?'-mobile':''),{caption:el('description').getBoundingClientRect().toJSON(),title:el('title').getBoundingClientRect().toJSON(),labels:callouts.map(c=>({text:c.text,rect:c.label.getBoundingClientRect().toJSON()})),thumbnails:['crystal','hands','rotor'].map(id=>({id,loaded:(el(`story-${id}`) as HTMLImageElement).src.startsWith('data:image/png')}))})
  // Export the neutral assembled model, including independent animation pivots.
  pose(0,0);for(const[id,g]of Object.entries(model.parts)){g.visible=true;g.position.copy(home[id]!);}
  model.rotorPivot.rotation.z=0;model.seconds.rotation.z=2.43;model.balanceWheel.rotation.z=0;model.bridgePack.position.set(0,0,0)
  if(!params.has('mobile')&&!params.has('no-export')){
   const times=[0,1,2,3,4],values=times.flatMap(t=>{const q=new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),Math.sin(t*Math.PI/2)*1.3);return q.toArray()})
   const clip=new T.AnimationClip('Rotor_swing',4,[new T.QuaternionKeyframeTrack('rotor_pivot.quaternion',times,values)])
   const glb=await new GLTFExporter().parseAsync(model.root,{binary:true,animations:[clip],onlyVisible:false}) as ArrayBuffer
   const loaded=await new GLTFLoader().parseAsync(glb,'')
   const required=[...Object.keys(model.parts),'rotor_pivot','bridge_pack','hour_hand','minute_hand','seconds_hand','balance_wheel']
   const missing=required.filter(name=>!loaded.scene.getObjectByName(name))
   let annotatedParts=0;loaded.scene.traverse(o=>{if(o.userData.componentId)annotatedParts++})
   // glTF splits a multi-material cylinder into separate cap/side primitives.
   // Validate each named optical assembly and every surface, not primitive count.
   const opticalSolids=['front_sapphire','transparent_rear_window'].filter(name=>{
    const solid=loaded.scene.getObjectByName(name);let surfaces=0,transmitting=true
    solid?.traverse(o=>{if(o instanceof T.Mesh){surfaces++;const materials=Array.isArray(o.material)?o.material:[o.material];transmitting&&=materials.every(m=>(m as T.MeshPhysicalMaterial).transmission>.9)}})
    return surfaces>0&&transmitting
   }).length
   const finishMaterials=new Set<T.MeshPhysicalMaterial>()
   loaded.scene.getObjectByName('rotor')?.traverse(o=>{if(o instanceof T.Mesh)for(const m of (Array.isArray(o.material)?o.material:[o.material]))if(m.userData.finishEvidence)finishMaterials.add(m as T.MeshPhysicalMaterial)})
   const portableFinishes=finishMaterials.size>=3&&[...finishMaterials].every(m=>m.normalMap&&m.roughnessMap&&m.anisotropyMap&&m.metalness===1)
   const movementFinishes=new Set<T.MeshStandardMaterial>()
   for(const id of mechanisms)loaded.scene.getObjectByName(id)?.traverse(o=>{if(o instanceof T.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m.userData.surfaceFinish)movementFinishes.add(m as T.MeshStandardMaterial)})
   const portableMovement=movementFinishes.size>=4&&[...movementFinishes].every(m=>m.normalMap&&m.roughnessMap&&m.metalness===1)
   if(!portableMovement)throw Error('Movement lost its portable metal finishes')
   if(missing.length||opticalSolids!==2||annotatedParts!==17||loaded.animations.length!==1||!portableFinishes)throw Error('Export validation failed: '+JSON.stringify({missing,opticalSolids,annotatedParts,portableFinishes}))
   await send('export-validation',{missing,opticalSolids,annotatedParts,portableFinishes,portableMovement,animations:loaded.animations.map(c=>c.name),bytes:glb.byteLength})
   if(params.has('materials')){
    // Re-render the exported surfaces under the unchanged rig and inspection
    // camera. Do not judge portability from texture presence alone.
    for(const id of ['rotor','crystal','rear-window']){
     const exported=loaded.scene.getObjectByName(id)!
     exported.traverse(o=>{if(o instanceof T.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(isTransmitting(m)){m.envMap=opticalMap.texture;m.envMapIntensity=.7}})
     exported.removeFromParent();scene.add(exported)
     for(const local of [.2,.37,.5]){
      const sample=tour.sample(tour.progressFor(id,local));pose(sample.base,2,sample)
      model.root.updateMatrixWorld(true);exported.matrix.copy(model.parts[id]!.matrixWorld);exported.matrix.decompose(exported.position,exported.quaternion,exported.scale)
      scene.remove(model.root);draw();await send(`export-${id}-${Math.round(local*100)}`,{image:renderer.domElement.toDataURL('image/png')});scene.add(model.root)
     }
     scene.remove(exported)
    }
   }
   const bytes=new Uint8Array(glb);let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768))
   await send('murph-researched',{glb:btoa(binary)})
  }
 }
 paintStory(0);renderer.setAnimationLoop(render)
 if(params.has('eval'))Object.assign(window,{__explodeReview:{
  ready:true,ids:Object.keys(model.parts),
  inspect:(id:string,local=.2)=>{renderer.setAnimationLoop(null);progress=assemblyMode?assembly!.progressFor(id,local):tour.progressFor(id,local);paintStory(progress);paintStory(progress);draw()},
  seek:(p:number)=>{renderer.setAnimationLoop(null);progress=p;paintStory(p);paintStory(p);draw()},
  snapshot:()=>{model.root.updateMatrixWorld(true);const sample=tour.sample(progress),assemblyState=assemblyMode?assembly!.pose(progress):undefined,selected=assemblyState?(assemblyState.complete||assemblyState.opening?null:assemblyState.chapter.id):sample.stop?.id,part=selected?model.parts[selected]:undefined,box=assemblyState&&!assemblyState.complete&&!assemblyState.opening?assemblyState.chapter.componentIds.reduce((b,id)=>b.union(new T.Box3().setFromObject(model.parts[id]!,true)),new T.Box3()):part?new T.Box3().setFromObject(part,true):undefined,points:T.Vector3[]=[];if(box)for(const x of [box.min.x,box.max.x])for(const y of [box.min.y,box.max.y])for(const z of [box.min.z,box.max.z])points.push(new T.Vector3(x,y,z).project(camera));return {setting,cameraDirection:camera.position.clone().sub(controls.target).normalize().toArray(),deskMatrix:presentation?.desk.matrixWorld.toArray(),optics:Object.values(finishes).flat().filter(f=>isTransmitting(f.material)).map(f=>({opacity:f.material.opacity,transmission:(f.material as T.MeshPhysicalMaterial).transmission})),pixelRatio:renderer.getPixelRatio(),antialiasSamples:antialiasTarget.samples,gridSpacing:presentation?.gridSpacing,progress,time,drawCount,softwareGraphics:renderBudget.software,selected:selected??null,mode:assemblyMode?'assembly':'explode',chapterKind:assemblyState?.chapter.kind??'component',selectedParts:assemblyState?.chapter.componentIds??[],builtIds:assemblyState?.builtIds??[],partPositions:Object.fromEntries(Object.entries(model.parts).map(([id,g])=>[id,g.position.toArray()])),homePositions:Object.fromEntries(Object.entries(home).map(([id,p])=>[id,p.toArray()])),allVisible:Object.values(model.parts).every(p=>p.visible),bounds:points.length?{left:(Math.min(...points.map(p=>p.x))*.5+.5)*innerWidth,right:(Math.max(...points.map(p=>p.x))*.5+.5)*innerWidth,top:(.5-Math.max(...points.map(p=>p.y))*.5)*innerHeight,bottom:(.5-Math.min(...points.map(p=>p.y))*.5)*innerHeight}:null}},
 }})
}
main().catch(error=>{el('status').textContent='Study could not load';el('error').style.display='block';el('error').textContent='The 3D model could not load. You can still read the component explanations below. '+error.message;console.error(error);if(capture)void send('error',{error:error.message,stack:error.stack})})
