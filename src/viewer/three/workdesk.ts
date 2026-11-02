import * as T from 'three'
import {disposeObject} from './model.ts'
import {loadWorkshopAssets} from './workshopAssets.ts'
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js'

/** Authored tabletop set in Z-up coordinates. Props are scenery, never anatomy.
 * The object and camera may move; this group's world transform stays fixed. */
export async function createWorkdesk(renderer:T.WebGLRenderer,span:number,millimetersPerUnit?:number){
 const root=new T.Group();root.name='workdesk';const scale=millimetersPerUnit?1/millimetersPerUnit:span/78;root.scale.setScalar(scale)
 const floor=-span*.58/scale
 const metal=new T.MeshStandardMaterial({color:'#b6c7cd',metalness:.35,roughness:.48})
 const graphite=new T.MeshStandardMaterial({color:'#414a67',roughness:.7}),enamel=new T.MeshStandardMaterial({color:'#ed744e',roughness:.7})
 const paper=new T.MeshStandardMaterial({color:'#e7ddc3',roughness:.95}),rubber=new T.MeshStandardMaterial({color:'#1b2529',roughness:.8})
 const add=(g:T.BufferGeometry,m:T.Material|T.Material[],x:number,y:number,z:number,parent:T.Object3D=root)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
 const box=(w:number,d:number,h:number,r:number,m:T.Material|T.Material[],x:number,y:number,z:number,parent:T.Object3D=root)=>add(new RoundedBoxGeometry(w,d,h,3,r),m,x,y,z,parent)
 const cylinder=(r:number,h:number,m:T.Material|T.Material[],x:number,y:number,z:number,parent:T.Object3D=root)=>add(new T.CylinderGeometry(r,r,h,48).rotateX(Math.PI/2),m,x,y,z,parent)
 const rod=(a:T.Vector3,b:T.Vector3,r:number,m:T.Material,parent:T.Object3D)=>{const o=add(new T.CylinderGeometry(r,r,a.distanceTo(b),24),m,0,0,0,parent);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());return o}
 const wood=new T.MeshStandardMaterial({color:'#d99b59',roughness:.88})
 // A quiet wall, shelf and pegboard make the bench part of a room.
 const plaster=new T.MeshStandardMaterial({color:'#b2b9aa',roughness:1})
 box(1800,12,900,2,plaster,0,226,floor+250)
 // Timber skirting and recessed wall panels add depth without busy surface noise.
 box(1200,8,6,1,wood,0,215,floor+5)
 for(const x of [-330,280])box(6,7,420,1.5,wood,x,216,floor+210)
 box(188,48,7,1.5,wood,120,170,floor+110)
 for(const x of [48,194])box(4,25,36,1,graphite,x,181,floor+89)
 const pegCanvas=document.createElement('canvas');pegCanvas.width=512;pegCanvas.height=384;const pg=pegCanvas.getContext('2d')!;pg.fillStyle='#a9ac95';pg.fillRect(0,0,512,384);pg.fillStyle='#737e6e';for(let x=16;x<512;x+=24)for(let y=16;y<384;y+=24){pg.beginPath();pg.arc(x,y,2.3,0,Math.PI*2);pg.fill()}
 const pegMap=new T.CanvasTexture(pegCanvas);pegMap.colorSpace=T.SRGBColorSpace
 const peg=add(new T.PlaneGeometry(180,120),new T.MeshStandardMaterial({map:pegMap,roughness:.95}),-90,193,floor+120);peg.rotation.x=Math.PI/2;peg.name='pegboard'
 // A physically dimensioned mat where known; no invented units on normalized models.
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1390;const ctx=canvas.getContext('2d')!,px=canvas.width/280
 ctx.fillStyle='#326e67';ctx.fillRect(0,0,2048,1390)
 for(const step of [5,10]){ctx.strokeStyle=step===10?'#86b5a5':'#4e9288';ctx.lineWidth=step===10?2:1;ctx.beginPath();for(let x=10;x<=270;x+=step){ctx.moveTo(x*px,10*px);ctx.lineTo(x*px,180*px)}for(let y=10;y<=180;y+=step){ctx.moveTo(10*px,y*px);ctx.lineTo(270*px,y*px)}ctx.stroke()}
 ctx.fillStyle='#b5c4ad';ctx.font='18px monospace';for(let x=10;x<=270;x+=20)if(millimetersPerUnit)ctx.fillText(String(x-10),x*px,7*px)
 ctx.font='20px monospace';ctx.fillText(millimetersPerUnit?'EXPLODE  /  WORKSHOP    ·    10 MM GRID':'EXPLODE  /  WORKSHOP',12*px,187*px)
 const matMap=new T.CanvasTexture(canvas);matMap.colorSpace=T.SRGBColorSpace;matMap.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy())
 // One receiving surface: the thin edge has no coplanar top to self-shadow.
 const matEdge=new T.MeshStandardMaterial({color:'#244f49',roughness:.95})
 const mat=add(new T.BoxGeometry(280,190,1.4),[matEdge,matEdge,matEdge,matEdge,new T.MeshStandardMaterial({map:matMap,roughness:.96}),matEdge],0,-27,floor+.72)
 mat.name='cutting_mat';mat.castShadow=false
 // The overhead bench fixture is the principal scene light. Its emitter and
 // shadow-casting source share a position, with inverse-square world-unit falloff.
 const fixture=new T.Group();fixture.name='overhead_bench_light';fixture.position.set(-65,-25,floor+330);root.add(fixture)
 box(194,18,8,3,graphite,0,0,0,fixture)
 const emitterMaterial=new T.MeshStandardMaterial({color:'#fff0d1',emissive:'#fff0d1',emissiveIntensity:3,roughness:.8})
 box(182,13,1,1,emitterMaterial,0,-1,-4.4,fixture)
 // Ceiling suspension rather than short posts crowding the tabletop.
 for(const x of [-140,10])rod(new T.Vector3(x,-25,floor+335),new T.Vector3(x,-25,floor+640),.6,graphite,root)
 const overhead=new T.SpotLight('#fff1d6',430000*scale*scale,900*scale,1.04,.85,2)
 overhead.name='bench_key';overhead.position.set(-65,-25,floor+324);overhead.target.position.set(0,15,floor)
 overhead.castShadow=true;overhead.shadow.mapSize.set(2048,2048);overhead.shadow.camera.near=scale*40;overhead.shadow.camera.far=700*scale
 overhead.shadow.bias=-.00008;overhead.shadow.normalBias=.25*scale;overhead.shadow.radius=3;overhead.shadow.intensity=.85
 root.add(overhead,overhead.target)
 // Broad wall bounce keeps the room readable; the overhead remains the key.
 const bounce=new T.PointLight('#b9d2dc',17000*scale*scale,650*scale,2);bounce.position.set(200,100,floor+180);root.add(bounce)
 // A dark reflection room with the same overhead strip, rather than an even HDR wash.
 const reflectionRoom=new T.Scene();reflectionRoom.background=new T.Color('#697779')
 const strip=new T.Mesh(new T.PlaneGeometry(240*scale,90*scale),new T.MeshBasicMaterial({color:new T.Color().setScalar(5),side:T.DoubleSide}))
 strip.position.set(-65*scale,-25*scale,(floor+324)*scale);strip.lookAt(0,0,0);reflectionRoom.add(strip)
 // Reflected room bounce: broad bright walls beside the seated viewer, with
 // dark gaps between them. Metals need contrast across reflections, not gray fill.
 const cards:T.Mesh[]=[]
 const bounceCanvas=document.createElement('canvas');bounceCanvas.width=128;bounceCanvas.height=16
 const bc=bounceCanvas.getContext('2d')!,gradient=bc.createLinearGradient(0,0,128,0)
 gradient.addColorStop(0,'#faf7ed');gradient.addColorStop(.35,'#eeeae0');gradient.addColorStop(1,'#333e43');bc.fillStyle=gradient;bc.fillRect(0,0,128,16)
 const bounceMap=new T.CanvasTexture(bounceCanvas);bounceMap.colorSpace=T.SRGBColorSpace
 const card=new T.Mesh(new T.PlaneGeometry(400*scale,260*scale),new T.MeshBasicMaterial({map:bounceMap,color:new T.Color().setScalar(3),side:T.DoubleSide}))
 card.position.set(-20*scale,-220*scale,(floor+65)*scale);card.lookAt(0,0,0);reflectionRoom.add(card);cards.push(card)
 // PMREM defaults to far=100: that clips this room in millimeter scenes.
 const pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromScene(reflectionRoom,.04,.1*scale,1600*scale)
 cards.forEach(card=>{card.geometry.dispose();(card.material as T.Material).dispose()});bounceMap.dispose()
 pmrem.dispose();strip.geometry.dispose();(strip.material as T.Material).dispose()
 // Tools have recognizable handles, shafts and polished tips. They remain on the desk.
 for(const [x,y,color] of [[-113,-43,'#805944'],[-98,-48,'#203b48'],[-83,-53,'#546052']] as const){
  const tool=new T.Group();tool.name='precision_screwdriver';tool.position.set(x,y,floor+5);tool.rotation.z=-.22;root.add(tool)
  add(new T.CylinderGeometry(3.3,3.3,23,24),new T.MeshStandardMaterial({color,roughness:.48}),0,0,0,tool)
  add(new T.CylinderGeometry(3.6,3.6,2,32),metal,0,-13,0,tool)
  add(new T.CylinderGeometry(.75,.75,32,16),metal,0,27,0,tool);box(1.5,4,.45,.1,metal,0,45,0,tool)
 }
 const note=new T.Group();note.name='field_notebook';note.position.set(135,85,floor+3);note.rotation.z=-.12;root.add(note)
 box(75,100,5,1.5,new T.MeshStandardMaterial({color:'#573e2c',roughness:.75}),0,0,0,note);box(71,96,3,.6,paper,0,0,2,note)
 const nc=document.createElement('canvas');nc.width=512;nc.height=700;const n=nc.getContext('2d')!;n.fillStyle='#e5dcc4';n.fillRect(0,0,512,700);n.strokeStyle='#c5c5af';n.lineWidth=1;for(let y=140;y<670;y+=32){n.beginPath();n.moveTo(38,y);n.lineTo(475,y);n.stroke()}n.fillStyle='#40574b';n.font='24px monospace';n.fillText('FIELD NOTES',40,66);n.font='16px monospace';n.fillText('01  OBSERVE',40,170);n.fillText('02  TAKE APART',40,235);n.fillText('03  UNDERSTAND',40,300)
 const noteMap=new T.CanvasTexture(nc);noteMap.colorSpace=T.SRGBColorSpace;add(new T.PlaneGeometry(70,95),new T.MeshStandardMaterial({map:noteMap,roughness:.95}),0,0,3.6,note)
 const pencil=add(new T.CylinderGeometry(2,2,92,6),enamel,187,81,floor+3);pencil.rotation.z=-.25
 // A ceramic cup and loupe sit outside the clear inspection area.
 const ceramic=new T.MeshStandardMaterial({color:'#f1bd59',roughness:.8})
 const cupProfile=[[0,0],[13,0],[15,2],[16,31],[15,32],[13,31],[12,4],[0,4]].map(([r,z])=>new T.Vector2(r!,z!))
 add(new T.LatheGeometry(cupProfile,64).rotateX(Math.PI/2),ceramic,-182,-79,floor)
 add(new T.TorusGeometry(9,2.5,12,40),ceramic,-201,-79,floor+18).rotation.y=Math.PI/2
 cylinder(12.5,.2,new T.MeshStandardMaterial({color:'#251b13',roughness:.23}),-182,-79,floor+24)
 const loupe=cylinder(12,18,rubber,177,-126,floor+10);loupe.name='watchmakers_loupe';cylinder(9,1,metal,177,-126,floor+19.2);cylinder(7.5,.5,new T.MeshStandardMaterial({color:'#102c30',metalness:.2,roughness:.07}),177,-126,floor+20)
 // Playful proportions and a restrained palette, deliberately stylized scenery.
 const coral=new T.MeshStandardMaterial({color:'#ed744e',roughness:.85})
 const blue=new T.MeshStandardMaterial({color:'#6579b6',roughness:.85})
 const mustard=new T.MeshStandardMaterial({color:'#efc15d',roughness:.85})
 for(let i=0;i<5;i++){
  const book=box(12,29,35+i%3*5,1.6,[coral,blue,mustard,paper,blue][i]!,70+i*14,165,floor+132+i%3*2.5);book.rotation.y=(i===4?-.1:0)
 }
 // Wall clock faces the seated viewer, with chunky hands and no fake labels.
 const clock=new T.Group();clock.name='workshop_clock';clock.position.set(0,190,floor+139);root.add(clock)
 const face=cylinder(23,5,mustard,0,0,0,clock);face.rotation.x=Math.PI/2
 const dial=add(new T.CircleGeometry(20,48),paper,0,-3,0,clock);dial.rotation.x=Math.PI/2
 for(let i=0;i<12;i++){const a=i*Math.PI/6;box(1.4,1,3,.4,graphite,Math.sin(a)*16,-3.6,Math.cos(a)*16,clock).rotation.y=a}
 box(2,1,12,.5,graphite,0,-4,5,clock);const hand=box(10,1,2,.5,graphite,4,-4,0,clock);hand.rotation.y=-.4
 // A tiny cactus and oversized pen pot bring a little game-world character.
 const plant=new T.Group();plant.name='cactus';plant.position.set(188,160,floor+114);root.add(plant)
 cylinder(12,19,coral,0,0,10,plant)
 const green=new T.MeshStandardMaterial({color:'#559c72',roughness:.85})
 box(11,11,36,5,green,0,0,34,plant);box(8,8,19,3.8,green,-11,0,34,plant);box(17,7,7,3,green,-6,0,27,plant)
 box(27,24,34,4,blue,-135,128,floor+18)
 for(let i=0;i<3;i++)rod(new T.Vector3(-143+i*8,128,floor+21),new T.Vector3(-146+i*11,128,floor+61+i*4),2.5,[coral,mustard,graphite][i]!,root)
 root.traverse(node=>{if(node instanceof T.Mesh)for(const m of Array.isArray(node.material)?node.material:[node.material])if(m instanceof T.MeshStandardMaterial){m.envMap=environment.texture;m.envMapIntensity=.5}})
 try{root.userData.workshopAssets=await loadWorkshopAssets(root,floor,environment.texture,Math.min(8,renderer.capabilities.getMaxAnisotropy()))}
 catch(error){bounce.dispose();overhead.dispose();disposeObject(root);environment.dispose();throw error}
 root.userData.staticScenery=true
 return {root,environment,overhead,floorZ:floor*scale,scale,gridSpacing:10*scale,dispose:()=>{bounce.dispose();overhead.dispose();environment.dispose()}}
}
