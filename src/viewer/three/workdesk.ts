import * as T from 'three'
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js'

/** Authored tabletop set in Z-up coordinates. Props are scenery, never anatomy.
 * The object and camera may move; this group's world transform stays fixed. */
export function createWorkdesk(renderer:T.WebGLRenderer,span:number,millimetersPerUnit?:number){
 const root=new T.Group();root.name='workdesk';const scale=millimetersPerUnit?1/millimetersPerUnit:span/78;root.scale.setScalar(scale)
 const floor=-span*.58/scale
 const metal=new T.MeshStandardMaterial({color:'#b6c7cd',metalness:.35,roughness:.48})
 const graphite=new T.MeshStandardMaterial({color:'#414a67',roughness:.7}),enamel=new T.MeshStandardMaterial({color:'#ed744e',roughness:.7})
 const paper=new T.MeshStandardMaterial({color:'#e7ddc3',roughness:.95}),rubber=new T.MeshStandardMaterial({color:'#1b2529',roughness:.8})
 const add=(g:T.BufferGeometry,m:T.Material,x:number,y:number,z:number,parent:T.Object3D=root)=>{const o=new T.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o}
 const box=(w:number,d:number,h:number,r:number,m:T.Material,x:number,y:number,z:number,parent:T.Object3D=root)=>add(new RoundedBoxGeometry(w,d,h,3,r),m,x,y,z,parent)
 const cylinder=(r:number,h:number,m:T.Material,x:number,y:number,z:number,parent:T.Object3D=root)=>add(new T.CylinderGeometry(r,r,h,48).rotateX(Math.PI/2),m,x,y,z,parent)
 const rod=(a:T.Vector3,b:T.Vector3,r:number,m:T.Material,parent:T.Object3D)=>{const o=add(new T.CylinderGeometry(r,r,a.distanceTo(b),24),m,0,0,0,parent);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());return o}
 const wood=new T.MeshStandardMaterial({color:'#d99b59',roughness:.88})
 const top=box(600,420,22,6,wood,0,0,floor-12);top.name='wooden_worktop'
 for(const x of [-226,226])for(const y of [-143,143])box(15,15,190,2,graphite,x,y,floor-108)
 box(485,10,14,1,graphite,0,133,floor-40)
 // A quiet wall, shelf and pegboard make the bench part of a room.
 const plaster=new T.MeshStandardMaterial({color:'#aabfba',roughness:1})
 box(1800,12,900,2,plaster,0,201,floor+250)
 box(188,48,7,1.5,wood,120,170,floor+110)
 for(const x of [48,194])box(4,25,36,1,graphite,x,181,floor+89)
 const pegCanvas=document.createElement('canvas');pegCanvas.width=512;pegCanvas.height=384;const pg=pegCanvas.getContext('2d')!;pg.fillStyle='#aa9779';pg.fillRect(0,0,512,384);pg.fillStyle='#625b4c';for(let x=16;x<512;x+=24)for(let y=16;y<384;y+=24){pg.beginPath();pg.arc(x,y,2.3,0,Math.PI*2);pg.fill()}
 const pegMap=new T.CanvasTexture(pegCanvas);pegMap.colorSpace=T.SRGBColorSpace
 const peg=add(new T.PlaneGeometry(180,120),new T.MeshStandardMaterial({map:pegMap,roughness:.95}),-90,193,floor+120);peg.rotation.x=Math.PI/2;peg.name='pegboard'
 // A physically dimensioned mat where known; no invented units on normalized models.
 const canvas=document.createElement('canvas');canvas.width=2048;canvas.height=1390;const ctx=canvas.getContext('2d')!,px=canvas.width/280
 ctx.fillStyle='#357d7c';ctx.fillRect(0,0,2048,1390)
 for(const step of [2,10]){ctx.strokeStyle=step===10?'#9dc7b3':'#4c9390';ctx.lineWidth=step===10?1.2:.6;ctx.beginPath();for(let x=10;x<=270;x+=step){ctx.moveTo(x*px,10*px);ctx.lineTo(x*px,180*px)}for(let y=10;y<=180;y+=step){ctx.moveTo(10*px,y*px);ctx.lineTo(270*px,y*px)}ctx.stroke()}
 ctx.fillStyle='#b5c4ad';ctx.font='18px monospace';for(let x=10;x<=270;x+=20)if(millimetersPerUnit)ctx.fillText(String(x-10),x*px,7*px)
 ctx.font='20px monospace';ctx.fillText(millimetersPerUnit?'EXPLODE  /  WORKSHOP    ·    10 MM GRID':'EXPLODE  /  WORKSHOP',12*px,187*px)
 const matMap=new T.CanvasTexture(canvas);matMap.colorSpace=T.SRGBColorSpace;matMap.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy())
 const mat=box(280,190,1.4,1,new T.MeshStandardMaterial({color:'#357d7c',roughness:.96}),0,-27,floor+.8);mat.name='cutting_mat'
 add(new T.PlaneGeometry(278,188),new T.MeshStandardMaterial({map:matMap,roughness:.96}),0,-27,floor+1.6).name='mat_grid'
 // Articulated task lamp, with a real warm source and an open shade.
 const lamp=new T.Group();lamp.name='task_lamp';lamp.position.set(-176,104,floor);root.add(lamp)
 cylinder(24,4,enamel,0,0,2,lamp);cylinder(17,1,graphite,0,0,4.2,lamp)
 for(const x of [-3,3]){rod(new T.Vector3(x,0,7),new T.Vector3(x-15,2,65),3,graphite,lamp);rod(new T.Vector3(x-15,2,65),new T.Vector3(x+30,-20,112),2.7,graphite,lamp)}
 for(const [x,y,z] of [[0,0,8],[-15,2,65],[30,-20,112]])cylinder(4,7,enamel,x!,y!,z!,lamp)
 const shadeProfile=[new T.Vector2(0,18),new T.Vector2(6,18),new T.Vector2(11,14),new T.Vector2(17,7),new T.Vector2(24,0)]
 add(new T.LatheGeometry(shadeProfile,64).rotateX(Math.PI/2),new T.MeshStandardMaterial({color:'#ed744e',roughness:.7,side:T.DoubleSide}),30,-20,104,lamp)
 add(new T.CircleGeometry(22,64),new T.MeshStandardMaterial({color:'#fff0ce',emissive:'#ffcf84',emissiveIntensity:1.3,side:T.DoubleSide}),30,-20,104.2,lamp)
 const lampLight=new T.SpotLight('#ffdca7',1800*scale*scale,400*scale,.66,.7,2);lampLight.position.set(-146*scale,84*scale,(floor+103)*scale);lampLight.target.position.set(-20*scale,0,floor*scale);lampLight.castShadow=false
 // root is scaled; keep this source in its parent's coordinates too.
 lampLight.position.divideScalar(scale);lampLight.target.position.divideScalar(scale);root.add(lampLight,lampLight.target)
 // The overhead bench fixture is the principal scene light. Its emitter and
 // shadow-casting source share a position, with inverse-square world-unit falloff.
 const fixture=new T.Group();fixture.name='overhead_bench_light';fixture.position.set(0,-50,floor+130);root.add(fixture)
 box(194,18,8,3,graphite,0,0,0,fixture)
 const emitterMaterial=new T.MeshStandardMaterial({color:'#fff0d1',emissive:'#fff0d1',emissiveIntensity:3,roughness:.8})
 box(182,13,1,1,emitterMaterial,0,-1,-4.4,fixture)
 for(const x of [-103,103]){
  box(5,6,128,1.5,graphite,x,164,floor+64)
  rod(new T.Vector3(x,164,floor+127),new T.Vector3(x,-50,floor+130),2.5,graphite,root)
 }
 const overhead=new T.SpotLight('#ffedcc',65000*scale*scale,450*scale,.74,.9,2)
 overhead.name='bench_key';overhead.position.set(0,-51,floor+124);overhead.target.position.set(0,-34,floor+12)
 overhead.castShadow=true;overhead.shadow.mapSize.set(2048,2048);overhead.shadow.camera.near=scale*2;overhead.shadow.camera.far=450*scale
 overhead.shadow.bias=-.00012;overhead.shadow.normalBias=.08*scale;overhead.shadow.radius=4;overhead.shadow.blurSamples=8
 root.add(overhead,overhead.target)
 // A dark reflection room with the same overhead strip, rather than an even HDR wash.
 const reflectionRoom=new T.Scene();reflectionRoom.background=new T.Color('#697779')
 const strip=new T.Mesh(new T.PlaneGeometry(182*scale,13*scale),new T.MeshBasicMaterial({color:new T.Color().setScalar(5),side:T.DoubleSide}))
 strip.position.set(0,-51*scale,(floor+124)*scale);strip.lookAt(0,0,0);reflectionRoom.add(strip)
 const pmrem=new T.PMREMGenerator(renderer),environment=pmrem.fromScene(reflectionRoom,.04)
 pmrem.dispose();strip.geometry.dispose();(strip.material as T.Material).dispose()
 // Tools have recognizable handles, shafts and polished tips. They remain on the desk.
 for(const [x,y,color] of [[-113,-43,'#805944'],[-98,-48,'#203b48'],[-83,-53,'#546052']] as const){
  const tool=new T.Group();tool.name='precision_screwdriver';tool.position.set(x,y,floor+5);tool.rotation.z=-.22;root.add(tool)
  add(new T.CylinderGeometry(3.3,3.3,23,24),new T.MeshStandardMaterial({color,roughness:.48}),0,0,0,tool)
  add(new T.CylinderGeometry(3.6,3.6,2,32),metal,0,-13,0,tool)
  add(new T.CylinderGeometry(.75,.75,32,16),metal,0,27,0,tool);box(1.5,4,.45,.1,metal,0,45,0,tool)
 }
 const tweezers=new T.Group();tweezers.name='steel_tweezers';tweezers.position.set(103,-48,floor+3);tweezers.rotation.z=-.32;root.add(tweezers)
 for(const side of [-1,1]){const sh=new T.Shape();sh.moveTo(side*1,-32);sh.lineTo(side*4,13);sh.lineTo(side*2,32);sh.lineTo(side*.4,33);sh.lineTo(side*2,13);sh.lineTo(0,-32);sh.closePath();add(new T.ExtrudeGeometry(sh,{depth:.6,bevelEnabled:true,bevelSize:.15,bevelThickness:.1,bevelSegments:2}),metal,0,0,0,tweezers)}
 // Ruler beside the mat, a notebook and a pencil supply familiar scale cues.
 const rulerCanvas=document.createElement('canvas');rulerCanvas.width=1024;rulerCanvas.height=96;const rc=rulerCanvas.getContext('2d')!;rc.fillStyle='#a7aca7';rc.fillRect(0,0,1024,96);rc.strokeStyle='#273c3e';for(let i=0;i<150;i++){rc.beginPath();rc.moveTo(i/150*1024,0);rc.lineTo(i/150*1024,i%10===0?40:i%5===0?28:18);rc.stroke()}if(millimetersPerUnit){rc.fillStyle='#273c3e';rc.font='16px monospace';for(let i=10;i<150;i+=10)rc.fillText(String(i),i/150*1024,63)}
 const rulerMap=new T.CanvasTexture(rulerCanvas);rulerMap.colorSpace=T.SRGBColorSpace
 const ruler=add(new T.PlaneGeometry(150,14),new T.MeshStandardMaterial({map:rulerMap,metalness:.8,roughness:.32}),170,-35,floor+1);ruler.rotation.z=1.48;ruler.name='steel_ruler'
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
 box(27,24,34,4,blue,-104,116,floor+18)
 for(let i=0;i<3;i++)rod(new T.Vector3(-112+i*8,116,floor+21),new T.Vector3(-115+i*11,116,floor+61+i*4),2.5,[coral,mustard,graphite][i]!,root)
 root.traverse(node=>{if(node instanceof T.Mesh)for(const m of Array.isArray(node.material)?node.material:[node.material])if(m instanceof T.MeshStandardMaterial){m.envMap=environment.texture;m.envMapIntensity=.22}})
 root.userData.staticScenery=true
 return {root,environment,overhead,floorZ:floor*scale,scale,gridSpacing:10*scale,dispose:()=>{lampLight.dispose();overhead.dispose();environment.dispose()}}
}
