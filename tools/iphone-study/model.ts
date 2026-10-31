import * as T from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'
import { contourPlate, roundedPlate, annulus, repeatGeometry } from '../../src/authoring/reference-parts.ts'

import {removeUnmappedOcclusion} from '../../src/authoring/import-materials.ts'
import {surfaceFinish, prepareFinishUVs} from '../../src/authoring/finishes.ts'

// All internal dimensions are reference-fitted estimates in mm, not service CAD.
// Contours follow the cited eSIM locator and teardown photographs; unseen detail
// is explicitly approximate. No teardown photograph is used as a color texture.
const root=new T.Group();root.name='iphone-internal-study'
const exterior=await new GLTFLoader().loadAsync('./apple-reference.glb');exterior.scene.scale.multiplyScalar(1000);root.add(exterior.scene);root.updateMatrixWorld(true)
const spec=await (await fetch('./exterior-study.json')).json()
for(const o of spec.scene3d.omittedNodes){const node=root.getObjectByName(o.node);node?.removeFromParent()}
for(const part of spec.scene3d.parts){const g=new T.Group();g.name=part.componentId;g.userData={componentId:part.componentId,evidence:'manufacturer-exterior'};root.add(g);for(const name of part.nodes){const node=root.getObjectByName(name);if(!node)throw Error('Missing source '+name);g.attach(node)}}
const finish=(kind:Parameters<typeof surfaceFinish>[0],color?:string)=>surfaceFinish(kind,{color,evidence:'Finish family guided by locator/teardown references; microstructure and exact coating are approximations'})
const mats={
 pcb:finish('pcb'),package:finish('package'),ceramic:finish('ceramic','#a89b81'),
 silver:finish('steel'),gold:finish('brass'),copper:finish('copper'),flex:finish('flex'),
 black:finish('coated'),graphite:finish('graphite'),foil:finish('foil'),
 glass:new T.MeshPhysicalMaterial({color:'#667b8a',roughness:.045,metalness:0,transmission:.75,ior:1.5,thickness:.15}),
}

function group(id:string){const g=new T.Group();g.name=id;g.userData={componentId:id,evidence:'reference-fitted',dimensionStatus:'estimated',referenceIds:['apple-locator','ifixit-internals']};root.add(g);return g}
function place(g:T.Object3D,m:T.Object3D,x:number,y:number,z:number){m.position.set(x,y,z);g.add(m);return m}
function plate(g:T.Object3D,w:number,h:number,d:number,x:number,y:number,z:number,mat:T.Material=mats.silver,r=.35){return place(g,roundedPlate(w,h,d,r,mat),x,y,z)}
function ring(g:T.Object3D,x:number,y:number,z:number,r:number,inner:number,d=.2,mat:T.Material=mats.silver){return place(g,annulus(r,inner,d,mat),x,y,z)}
function textSurface(g:T.Object3D,text:string,w:number,h:number,x:number,y:number,z:number,color='#b7bab7',size=90){const c=document.createElement('canvas');c.width=1024;c.height=Math.round(1024*h/w);const ctx=c.getContext('2d')!;ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle=color;ctx.font=`${size}px sans-serif`;ctx.textAlign='center';ctx.textBaseline='middle';text.split('\n').forEach((line,i,a)=>ctx.fillText(line,c.width/2,c.height/2+(i-(a.length-1)/2)*size*1.45));const map=new T.CanvasTexture(c);map.colorSpace=T.SRGBColorSpace;const m=new T.MeshStandardMaterial({map,transparent:true,roughness:.6,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});return place(g,new T.Mesh(new T.PlaneGeometry(w,h),m),x,y,z)}
function connector(g:T.Object3D,x:number,y:number,z:number,w:number,h:number){plate(g,w,h,.32,x,y,z,mats.silver,.2);plate(g,w-.4,h-.4,.4,x,y,z+.14,mats.black,.15);const pins:[number,number,number][]=[];for(let i=0;i<Math.floor(w/.38);i++)for(const sign of [-1,1])pins.push([x-w/2+.3+i*.38,y+sign*(h/2-.23),z+.58]);repeatGeometry(g,new T.BoxGeometry(.14,.24,.14),mats.gold,pins)}
function chip(g:T.Object3D,x:number,y:number,z:number,w:number,h:number,mark?:string){plate(g,w,h,.52,x,y,z,mats.package,.18);if(mark)textSurface(g,mark,w*.85,h*.7,x,y,z+.54,'#858d88',105)}
function screw(g:T.Object3D,x:number,y:number,z:number){ring(g,x,y,z,.74,.29,.25);const m=new T.Mesh(new T.CylinderGeometry(.38,.38,.18,16),mats.silver);m.rotation.x=Math.PI/2;place(g,m,x,y,z+.18);plate(g,.52,.1,.02,x,y,z+.29,mats.black,.02)}
function flex(g:T.Object3D,points:[number,number][],z:number){place(g,contourPlate(points,.13,mats.flex,[],.025),0,0,z)}
// Reference outline of the single eSIM board in Apple's assembled locator.
const boardContour:[number,number][]=[[-31,12],[-31,38],[-10,38],[-10,48],[-13,49],[-13,60],[-5,60],[-5,66],[4,66],[4,64],[8,64],[8,61],[4,60],[4,56],[0,55],[-2,49],[0,42],[3,40],[3,37],[7,36],[7,29],[27,29],[31,27],[31,23],[27,20],[5,20],[4,15],[1,12]]
const holes=[{x:28,y:25,r:.9},{x:-28,y:15,r:.65},{x:5,y:63,r:.6}]
const board=group('logic-board');place(board,contourPlate(boardContour,.55,mats.pcb,holes),0,0,2)
const lower=group('logic-board-lower');place(lower,contourPlate(boardContour,.5,mats.pcb,holes),0,0,.65)
// Inter-board solder perimeter follows the actual stepped outline, not a rectangle.
const balls:[number,number,number][]=[];for(let i=0;i<boardContour.length;i++){const a=boardContour[i]!,b=boardContour[(i+1)%boardContour.length]!,n=Math.floor(Math.hypot(b[0]-a[0],b[1]-a[1])/.55);for(let j=1;j<n;j++)balls.push([T.MathUtils.lerp(a[0],b[0],j/n),T.MathUtils.lerp(a[1],b[1],j/n),1.5])}repeatGeometry(lower,new T.SphereGeometry(.18,6,4),mats.silver,balls)
// Front connectors and passive regions observed around the processor shield.
for(const [x,y,w,h]of [[-27,34,2,4],[-21,34,6,2],[-13,34,7,2],[-27,27,2,4],[-18,29,5,2],[-26,20,2,6],[-21,22,2,5],[-16,20,2,8],[13,26,5,2],[13,22,5,2],[23,22,7,2],[-21,15,2,4],[28,28,3,2]])connector(board,x!,y!,2.6,w!,h!)
const passivePositions:[number,number,number][]=[]
for(const [x,y,nx,ny]of [[-7,35,9,2],[5,33,3,5],[10,23,2,3],[-8,58,6,3],[-7,46,3,4]])for(let ix=0;ix<nx!;ix++)for(let iy=0;iy<ny!;iy++)passivePositions.push([x!+ix*.7,y!+iy*.7,2.8]);repeatGeometry(board,new T.BoxGeometry(.45,.28,.25),mats.ceramic,passivePositions)
const terminations=passivePositions.flatMap(([x,y,z]):[number,number,number][]=>[[x-.22,y,z],[x+.22,y,z]]);repeatGeometry(board,new T.BoxGeometry(.09,.3,.28),mats.silver,terminations)
for(const [x,y,w,h]of [[-4,59,4,3],[-6,53,5,4],[6,24,3,3],[23,26,4,4]])chip(board,x!,y!,2.7,w!,h!)
const pads:[number,number,number][]=[];for(let i=0;i<13;i++)pads.push([-9+i*.7,37,2.69]);for(let x=0;x<5;x++)for(let y=0;y<3;y++)pads.push([10+x*.8,23+y*.8,2.69]);repeatGeometry(board,new T.CylinderGeometry(.22,.22,.035,12).rotateX(Math.PI/2),mats.gold,pads)
for(const h of holes)ring(board,h.x,h.y,2.6,h.r+.5,h.r,.22)
// Exposed land pattern remains when the independent processor lifts away.
const lands:[number,number,number][]=[];for(let x=0;x<18;x++)for(let y=0;y<21;y++)lands.push([-12.3+x*.86,14.6+y*.84,2.69]);repeatGeometry(board,new T.CylinderGeometry(.19,.19,.035,8).rotateX(Math.PI/2),mats.gold,lands)
for(const [cx,cy,n]of [[-24,30,9],[-12,32,8],[1,31,8],[7,23,7],[-7,61,8],[-8,43,5]])for(let i=0;i<n!;i++){const x=cx!+(i%3)*.75,y=cy!+Math.floor(i/3)*.62;plate(board,.5,.3,.25,x,y,2.6,i%3?mats.ceramic:mats.package,.025)}
textSurface(board,'820 · LOGIC',8,1.6,19,28.5,2.7,'#a48c56',90)
const soc=group('processor');plate(soc,16.3,19,.4,-5,23,2.6,mats.package);plate(soc,15.4,18,.24,-5,23,3,mats.copper);textSurface(soc,'A20 PRO',13,5,-5,23,3.36,'#4e5047',110)
// BGA contact field is an educational representation, not a pinout.
const bga:[number,number,number][]=[];for(let x=0;x<18;x++)for(let y=0;y<21;y++)bga.push([-12.3+x*.86,14.6+y*.84,2.56]);repeatGeometry(soc,new T.SphereGeometry(.15,6,4),mats.silver,bga)
const memory=group('memory');chip(memory,5.8,32,2.6,6,6,'MEMORY')
const storage=group('storage');chip(storage,-20,27,1.16,9,10,'NAND');chip(storage,-7,24,1.16,9,11,'NAND')
const radio=group('radio');chip(radio,-20,17,1.16,9,7,'C2');chip(radio,-5,59,1.16,7,5)
for(const [x,y]of [[-27,35],[-15,36],[-3,34],[10,25],[20,26],[-8,53]])for(let j=0;j<4;j++)plate(lower,1.1,.65,.24,x!+j*1.5,y!,1.16,j%2?mats.silver:mats.ceramic,.06)
// Separate cell and embossed carrier. Battery shape retains the lower notch.
const cell=group('battery');const outline:[number,number][]=[[-29,-53],[-29,7],[-27,9],[4,9],[6,11],[28,11],[30,9],[30,-55],[28,-57],[-12,-57],[-14,-54],[-25,-54]]
place(cell,contourPlate(outline,2.6,mats.foil,[],.28),0,0,1.1)
plate(cell,56,1,.25,0,7.8,3.7,mats.black,.2)
textSurface(cell,'Li-ion\n16.76 Wh · 4288 mAh\nRechargeable battery',37,17,0,-30,3.98,'#646b68',60)
flex(cell,[[26,9],[30,9],[30,16],[27,16],[27,12],[26,12]],2.8);connector(cell,28,16,2.9,3,2)
const tray=group('battery-tray');const trayPoints:[number,number][]=[[-31,-59],[-31,9],[-29,12],[-22,12],[-22,33],[-18,36],[0,36],[0,40],[9,40],[9,35],[31,35],[32,32],[32,-59],[29,-62],[-28,-62]]
place(tray,contourPlate(trayPoints,.32,mats.silver,[{x:5,y:25,r:1},{x:-28,y:-55,r:.65},{x:29,y:-54,r:.65}],.09),0,0,.12)
// Embossed dimples are closed relief, not perforations through the carrier.
const dimples:[number,number,number][]=[];for(let x=-26;x<29;x+=2.2)for(let y=-54;y<10;y+=2.2)dimples.push([x,y,.49]);repeatGeometry(tray,new T.SphereGeometry(.34,8,4).scale(1,1,.35),mats.foil,dimples)
for(const [x,y]of [[-30,-56],[-30,-35],[-30,-15],[-30,8],[31,-55],[31,-35],[31,-15],[31,8],[30,31],[-19,34],[3,38]])ring(tray,x!,y!,.45,.8,.4,.2)
const cooling=group('cooling');const heatShape:[number,number][]=[[-29,-58],[-29,8],[-19,8],[-19,34],[-15,37],[10,37],[12,32],[29,32],[29,-58],[25,-60],[-25,-60]]
place(cooling,contourPlate(heatShape,.38,mats.silver,[],.12),0,0,-.5)
plate(cooling,15.5,18,.22,-5,23,.04,mats.graphite,.4)
// Fine thermal contact relief in place of a painted photograph.
const weave:[number,number,number][]=[];for(let x=-12;x<2;x+=.42)for(let y=15;y<31;y+=.42)weave.push([x,y,.3]);repeatGeometry(cooling,new T.SphereGeometry(.13,5,4).scale(1,1,.4),mats.graphite,weave)
const coil=group('wireless-charging');place(coil,new T.Mesh(new T.CylinderGeometry(22,22,.18,96).rotateX(Math.PI/2),mats.graphite),0,-19,-1.02)
for(let i=0;i<17;i++)ring(coil,0,-19,-.95,12+i*.47,11.72+i*.47,.14,mats.copper)
for(let i=0;i<20;i++){const a=i*Math.PI*2/20,m=plate(coil,4.2,2.6,.45,24*Math.cos(a),-19+24*Math.sin(a),-1,mats.silver,.2);m.rotation.z=a+Math.PI/2}
flex(coil,[[20,-25],[26,-25],[26,21],[23,21],[23,-22],[20,-22]],-1.1)
const cameras=group('camera-modules');const sensors=group('camera-sensors')
for(const [,x,y]of [[0,3.4,51],[1,21.5,61],[2,21.5,41]]){
 plate(cameras,15.5,15.5,3.6,x!,y!,-2.7,mats.silver,1.8)
 ring(cameras,x!,y!,-3.2,6.6,5.45,.6,mats.black)
 // Sensor package under each optical axis; photodiode layout not reconstructed.
 plate(sensors,12,11,.8,x!,y!,1.2,mats.package,.5)
 plate(sensors,8.6,7.2,.15,x!,y!,2.03,new T.MeshPhysicalMaterial({color:'#244755',metalness:.35,roughness:.18,iridescence:.8}),.1)
 flex(sensors,[[x!-4,y!-5],[x!-4,y!-9],[x!+2,y!-9],[x!+2,y!-7],[x!-1,y!-7],[x!-1,y!-5]],1.5)
 for(const dx of [-6,6])for(const dy of [-6,6])ring(cameras,x!+dx,y!+dy,1.1,.6,.3,.15)
}
const front=group('front-sensors');plate(front,18,4.5,2.4,-1,66,2.6,mats.black,1);for(const x of [-7,0,5]){ring(front,x,66,5.05,1.5,1.1,.3,mats.silver);place(front,new T.Mesh(new T.CircleGeometry(1.05,32),mats.glass),x,66,5.38)}
plate(front,5.5,5.5,1.8,-23,63,2.3,mats.black,.8);ring(front,-23,63,4.1,1.8,1.2,.2)
const haptic=group('haptics');plate(haptic,20,8,3,15,-64,.8,mats.silver,.7);plate(haptic,18,6,.12,15,-64,3.84,mats.graphite,.5);textSurface(haptic,'TAPTIC ENGINE',16,3,15,-64,4,'#9ea3a0',80);for(const x of [4,26]){ring(haptic,x,-64,1.2,1.1,.5,.8);screw(haptic,x,-64,2)}
const speaker=group('speakers');place(speaker,contourPlate([[-29,-68],[-29,-54],[-26,-52],[-20,-55],[-20,-59],[3,-59],[3,-68]],3,mats.black),0,0,.8)
plate(speaker,12,5,.3,-23,-58,3.9,mats.silver,.8);plate(speaker,23,3.2,2,-18,69,2,mats.black,.7)
const grille:[number,number,number][]=[];for(let x=-27;x<-17;x+=.5)for(let y=-59.5;y<-56.5;y+=.5)grille.push([x,y,4.23]);repeatGeometry(speaker,new T.CylinderGeometry(.13,.13,.03,6).rotateX(Math.PI/2),mats.black,grille)
const flexes=group('interconnects');flex(flexes,[[-32,-69],[-25,-69],[-25,-66],[-29,-66],[-29,58],[-26,58],[-26,64],[-31,64]],1.5);flex(flexes,[[-15,-68],[3,-68],[3,-64],[-12,-64],[-12,14],[-17,14],[-17,10],[-15,10]],.8);connector(flexes,-15,14,1,5,2);connector(flexes,-28,62,1.7,4,2)
const microphones=group('microphones');plate(microphones,5,3,1.2,-22,-69,2.7,mats.silver,.4);ring(microphones,-22,-69,3.95,.6,.25,.12,mats.black);flex(microphones,[[-25,-70],[-18,-70],[-18,-66],[-21,-66],[-21,-68],[-25,-68]],2.3);plate(microphones,3.4,2.8,1.2,29,57,1.2,mats.silver,.4);ring(microphones,29,57,2.45,.5,.2,.1,mats.black)
const antennas=group('antennas');flex(antennas,[[-32,50],[-29,50],[-29,65],[-20,65],[-20,69],[-32,69]],.1);flex(antennas,[[30,-50],[32,-50],[32,25],[30,25]],-.3);for(const y of [-42,-20,4,22])plate(antennas,1.3,2,.16,31,y,.1,mats.gold,.1)
const depthSensor=group('depth-sensor');plate(depthSensor,6.5,7,2.2,30,51,-2.4,mats.package,.8);ring(depthSensor,30,51,-2.8,2.2,1.7,.4,mats.black);const depthGlass=new T.Mesh(new T.CircleGeometry(1.65,32),mats.glass);depthGlass.rotation.y=Math.PI;place(depthSensor,depthGlass,30,51,-2.83)
const fasteners=group('fasteners');for(const [x,y]of [[-32,-69],[-32,-50],[-32,-20],[-32,15],[-32,45],[32,-69],[32,-50],[32,-20],[32,15],[32,45],[-25,69],[25,69],[-28,15],[28,25]])screw(fasteners,x!,y!,4)
const seal=group('display-seal');const out=new T.Shape();out.moveTo(-27,-73);out.lineTo(27,-73);out.quadraticCurveTo(34,-73,34,-66);out.lineTo(34,66);out.quadraticCurveTo(34,73,27,73);out.lineTo(-27,73);out.quadraticCurveTo(-34,73,-34,66);out.lineTo(-34,-66);out.quadraticCurveTo(-34,-73,-27,-73);const inner=new T.Path();inner.moveTo(-26,-71.9);inner.lineTo(26,-71.9);inner.quadraticCurveTo(32.9,-71.9,32.9,-65);inner.lineTo(32.9,65);inner.quadraticCurveTo(32.9,71.9,26,71.9);inner.lineTo(-26,71.9);inner.quadraticCurveTo(-32.9,71.9,-32.9,65);inner.lineTo(-32.9,-65);inner.quadraticCurveTo(-32.9,-71.9,-26,-71.9);out.holes.push(inner);place(seal,new T.Mesh(new T.ExtrudeGeometry(out,{depth:.16,bevelEnabled:false,curveSegments:24}),mats.black),0,0,5.7)
// Source display is one-sided; attach a shaped backplate with no duplicated wallpaper.
const display=root.getObjectByName('display')!;plate(display,64,139,.2,0,0,5.8,mats.graphite,7);plate(display,19,31,.12,-19,50,5.56,mats.silver,1)
removeUnmappedOcclusion(root)
prepareFinishUVs(root)
// Snapshot source groups and new geometry. Detailed internals remain estimated.
root.updateMatrixWorld(true)
const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(1200,1000);renderer.toneMapping=T.ACESFilmicToneMapping;document.body.append(renderer.domElement)
const scene=new T.Scene();scene.background=new T.Color('#e9eeeb');scene.environment=new T.PMREMGenerator(renderer).fromScene(new RoomEnvironment(),.04).texture;scene.add(root)
const camera=new T.PerspectiveCamera(32,1.2,.1,2000)
function show(id?:string){root.children.forEach(g=>g.visible=!id||g.name===id);const b=new T.Box3();root.children.filter(g=>g.visible).forEach(g=>b.union(new T.Box3().setFromObject(g)));const center=b.getCenter(new T.Vector3()),s=b.getSize(new T.Vector3());camera.position.copy(center).add(new T.Vector3(.13,.12,1).multiplyScalar(Math.max(s.x,s.y,s.z)*2));camera.lookAt(center);renderer.render(scene,camera)}
Object.assign(window,{ready:true,root,show,exportModel:async()=>{root.children.forEach(g=>g.visible=true);const bytes=await new GLTFExporter().parseAsync(root,{binary:true,maxTextureSize:2048}) as ArrayBuffer;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([bytes],{type:'model/gltf-binary'}));a.download='internal-study.glb';a.click();return bytes.byteLength}});show('logic-board')
