import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createStudioEnvironment } from '../../src/viewer/three/studio.ts'

type Part = { name:string; nodes:string[]; description:string; offset:[number,number,number]; material?:{metalness?:number;roughness?:number;normalScale?:number} }
type Config = { title:string; subtitle:string; model:string; reference:string; referenceUrl:string; referenceNote:string; finding:string; summary:string; rotation:[number,number,number]; parts:Part[] }
const el=(id:string)=>document.getElementById(id)!
const host=el('stage')
const renderer=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:new URLSearchParams(location.search).has('capture')})
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));renderer.setSize(host.clientWidth,host.clientHeight)
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1
host.prepend(renderer.domElement)
const scene=new THREE.Scene();scene.background=new THREE.Color('#e9edea')
const env=createStudioEnvironment(renderer);scene.environment=env.texture;scene.environmentIntensity=.55
scene.add(new THREE.HemisphereLight(0xffffff,0x84958a,2))
const sun=new THREE.DirectionalLight(0xfff5e5,1.8);sun.position.set(-4,6,7);scene.add(sun)
const camera=new THREE.PerspectiveCamera(32,host.clientWidth/host.clientHeight,.01,500)
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=1;controls.maxDistance=200;controls.enablePan=false
const assembly=new THREE.Group();scene.add(assembly)
const leaders=document.createElementNS('http://www.w3.org/2000/svg','svg');leaders.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none';host.append(leaders)
const groups:{part:Part;group:THREE.Group;home:THREE.Vector3;target:THREE.Vector3;label:HTMLElement;line:SVGLineElement;radius:number}[]=[]
const originals=new Map<THREE.Mesh,THREE.Material|THREE.Material[]>()
let active=-1,separated=false,raw=false,config:Config
let cameraGoal:THREE.Vector3|undefined,targetGoal:THREE.Vector3|undefined
const reduceMotion=matchMedia('(prefers-reduced-motion: reduce)').matches
controls.addEventListener('start',()=>{cameraGoal=undefined;targetGoal=undefined})
function frame(bounds:THREE.Box3,direction=new THREE.Vector3(.12,.12,1)) {
 const center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3())
 // Reserve title and explanatory copy outside the framed region.
 const fov=THREE.MathUtils.degToRad(camera.fov/2), margin=camera.aspect<1?1.85:1.55
 const distance=Math.max(size.y,size.x/camera.aspect)/2/Math.tan(fov)*margin+size.z/2
 cameraGoal=center.clone().add(direction.normalize().multiplyScalar(Math.max(distance,2)));targetGoal=center
}
function select(index:number,explode=false) {
 active=index;separated=explode
 el('assembled').setAttribute('aria-pressed',String(index===-1&&!explode));el('separated').setAttribute('aria-pressed',String(explode))
 const bounds=new THREE.Box3()
 groups.forEach((item,i)=>{
  item.group.visible=index===-1||index===i
  item.target.copy(item.home).add(explode?new THREE.Vector3(...item.part.offset):new THREE.Vector3())
  if(item.group.visible){const box=new THREE.Box3().setFromObject(item.group);box.translate(item.target.clone().sub(item.group.position));bounds.union(box)}
  item.label.hidden=!explode
  el('parts').children[i]?.setAttribute('aria-pressed',String(index===i))
 })
 frame(bounds,explode?new THREE.Vector3(.1,.1,1):new THREE.Vector3(.12,.12,1))
 el('part-title').textContent=index<0?(explode?'The recovered pieces':config.title):groups[index].part.name
 el('part-description').textContent=index<0?(explode?'Each label follows an inspected mesh group. Select a part to see it alone.':config.summary):groups[index].part.description
}
async function main(){
 const response=await fetch('review.json');if(!response.ok)throw Error('Review manifest is missing')
 config=await response.json()
 el('title').textContent=config.title;el('subtitle').textContent=config.subtitle;el('finding').textContent=config.finding
 ;(el('reference-image') as HTMLImageElement).src=config.reference
 ;(el('reference-link') as HTMLAnchorElement).href=config.referenceUrl
 el('reference-note').textContent=config.referenceNote
 const gltf=await new GLTFLoader().loadAsync(config.model)
 const root=gltf.scene;root.rotation.order='ZYX';root.rotation.set(...config.rotation);root.updateMatrixWorld(true)
 const initial=new THREE.Box3().setFromObject(root),size=initial.getSize(new THREE.Vector3())
 root.scale.multiplyScalar(6/Math.max(size.x,size.y,size.z));root.updateMatrixWorld(true)
 root.position.sub(new THREE.Box3().setFromObject(root).getCenter(new THREE.Vector3()));assembly.add(root);root.updateMatrixWorld(true)
 const meshes:THREE.Mesh[]=[];root.traverse(o=>{if(o instanceof THREE.Mesh)meshes.push(o)})
 const assigned=new Set<string>()
 for(const part of config.parts){
  const members=meshes.filter(m=>part.nodes.includes(m.name));if(!members.length)throw Error(`Missing geometry for ${part.name}`)
  for(const mesh of members){if(assigned.has(mesh.uuid))throw Error('Overlapping component assignments');assigned.add(mesh.uuid)}
  const group=new THREE.Group();assembly.add(group)
  const bounds=new THREE.Box3();members.forEach(m=>bounds.union(new THREE.Box3().setFromObject(m)))
  group.position.copy(bounds.getCenter(new THREE.Vector3()));group.updateMatrixWorld(true)
  members.forEach(mesh=>{
   group.attach(mesh);originals.set(mesh,mesh.material)
   const convert=(mat:THREE.Material)=>{const next=mat.clone() as THREE.MeshStandardMaterial
    if(part.material&&next.isMeshStandardMaterial){
     if(part.material.metalness!==undefined){next.metalness=part.material.metalness;next.metalnessMap=null}
     if(part.material.roughness!==undefined){next.roughness=part.material.roughness;next.roughnessMap=null}
     if(part.material.normalScale!==undefined)next.normalScale.setScalar(part.material.normalScale)
    }return next}
   mesh.userData.reviewMaterial=Array.isArray(mesh.material)?mesh.material.map(convert):convert(mesh.material)
   mesh.material=mesh.userData.reviewMaterial
  })
  const label=document.createElement('span');label.className='label';label.textContent=part.name;label.hidden=true;host.append(label)
  const line=document.createElementNS('http://www.w3.org/2000/svg','line');line.setAttribute('stroke','#93a296');line.setAttribute('stroke-width','1');leaders.append(line)
  groups.push({part,group,home:group.position.clone(),target:group.position.clone(),label,line,radius:bounds.getSize(new THREE.Vector3()).length()/2})
  const button=document.createElement('button');button.textContent=part.name;button.setAttribute('aria-pressed','false');const index=groups.length-1;button.onclick=()=>select(index);el('parts').append(button)
 }
 if(meshes.some(m=>!assigned.has(m.uuid)))throw Error('Some generated geometry is missing from the review manifest')
 el('status').textContent=`Real 3D · ${groups.length} inspected groups`
 el('assembled').onclick=()=>select(-1)
 el('separated').onclick=()=>select(-1,true)
 el('materials').onclick=()=>{raw=!raw;el('materials').setAttribute('aria-pressed',String(raw));el('materials').textContent=raw?'Viewing original materials':'Original materials';originals.forEach((material,mesh)=>mesh.material=raw?material:mesh.userData.reviewMaterial)}
 el('reference-toggle').onclick=()=>{const panel=el('reference');panel.hidden=!panel.hidden;el('reference-toggle').setAttribute('aria-expanded',String(!panel.hidden))}
 select(-1);camera.position.copy(cameraGoal!);controls.target.copy(targetGoal!);cameraGoal=undefined;targetGoal=undefined;controls.update()
 if(new URLSearchParams(location.search).has('capture'))await capture()
}
function tick(){
 groups.forEach(item=>item.group.position.lerp(item.target,reduceMotion?1:.09))
 if(cameraGoal&&targetGoal){camera.position.lerp(cameraGoal,reduceMotion?1:.09);controls.target.lerp(targetGoal,reduceMotion?1:.09);if(camera.position.distanceTo(cameraGoal)<.001){cameraGoal=undefined;targetGoal=undefined}}
 controls.update();renderer.render(scene,camera)
 const width=host.clientWidth,height=host.clientHeight
 const occupied:{x:number;y:number;width:number;height:number}[]=[]
 groups.forEach(item=>{
  item.line.style.display=item.label.hidden?'none':'';if(item.label.hidden)return
  const box=new THREE.Box3().setFromObject(item.group),point=box.getCenter(new THREE.Vector3());point.y=box.max.y+.15;point.project(camera)
  const anchorX=(point.x*.5+.5)*width,anchorY=(-point.y*.5+.5)*height
  const labelWidth=item.label.offsetWidth,labelHeight=item.label.offsetHeight
  const x=Math.max(labelWidth/2+12,Math.min(width-labelWidth/2-12,anchorX));let y=anchorY-24
  const overlaps=()=>occupied.some(r=>x-labelWidth/2<r.x+r.width+7&&x+labelWidth/2>r.x-7&&y-labelHeight/2<r.y+r.height+5&&y+labelHeight/2>r.y-5)
  for(let attempt=0;attempt<groups.length&&overlaps();attempt++)y-=labelHeight+8
  occupied.push({x:x-labelWidth/2,y:y-labelHeight/2,width:labelWidth,height:labelHeight})
  item.label.style.left=`${x}px`;item.label.style.top=`${y}px`
  item.line.setAttribute('x1',String(x));item.line.setAttribute('y1',String(y+labelHeight/2));item.line.setAttribute('x2',String(anchorX));item.line.setAttribute('y2',String(anchorY))
 })
}
renderer.setAnimationLoop(tick)
new ResizeObserver(()=>{renderer.setSize(host.clientWidth,host.clientHeight);camera.aspect=host.clientWidth/host.clientHeight;camera.updateProjectionMatrix();if(config)select(active,separated)}).observe(host)
async function capture(){
 const suffix=new URLSearchParams(location.search).has('mobile')?'-mobile':''
 const send=async(name:string,data:object)=>fetch('http://127.0.0.1:4320/capture',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:name+suffix,...data})}).catch(()=>undefined)
 for(const [name,index,explode] of [['assembled',-1,false],['separated',-1,true],...groups.map((_,i)=>[`part-${i}`,i,false])] as [string,number,boolean][]){select(index,explode);for(let i=0;i<180;i++)tick();await send(`murph-review-${name}`,{image:renderer.domElement.toDataURL('image/png')});if(explode)await send('murph-labels',{labels:groups.map(g=>({name:g.part.name,rect:g.label.getBoundingClientRect().toJSON()}))})}
 await send('murph-review-layout',{width:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,parts:groups.map(g=>({name:g.part.name,nodes:g.part.nodes}))});select(-1)
}
main().catch(error=>{el('status').textContent=`Could not load model: ${error.message}`;console.error(error)})
