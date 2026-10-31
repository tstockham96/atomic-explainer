/** Original, reference-guided Type 901/01 educational reconstruction.
 * Millimetres; inferred casting contours are not service CAD. See research.json. */
import * as T from 'three'
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { contourPlate, roundedPlate, annulus } from '../../src/authoring/reference-parts.ts'

type V = [number,number,number]
const Z = new T.Vector3(0,0,1)
export function buildEngine() {
 const root=new T.Group();root.name='Porsche_901_01'
 const metal=(color:string,roughness:number,metalness=1)=>new T.MeshStandardMaterial({color,roughness,metalness})
 const m={cast:metal('#929993',.54,.85),machined:metal('#b5bfba',.4),steel:metal('#687177',.42),dark:metal('#161c1c',.5,.12),rubber:metal('#111616',.87,0),brass:metal('#ad945c',.33),iron:metal('#525851',.62,.8),exhaust:metal('#88847a',.47,.85),bakelite:metal('#462921',.4,0),ceramic:metal('#d9d5c7',.24,0)}
 // Fine isotropic casting relief: no painted highlights, rust, or borrowed photograph.
 const size=128,data=new Uint8Array(size*size*4);let seed=901
 for(let i=0;i<size*size;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const v=seed>>>24;data[i*4]=v;data[i*4+1]=v;data[i*4+2]=v;data[i*4+3]=255}
 const grain=new T.DataTexture(data,size,size);grain.needsUpdate=true;grain.wrapS=grain.wrapT=T.RepeatWrapping;grain.repeat.set(5,5)
 m.cast.bumpMap=grain;m.cast.bumpScale=.0012;m.iron.bumpMap=grain;m.iron.bumpScale=.0008
 function group(id:string){const g=new T.Group();g.name=id;g.userData.componentId=id;root.add(g);return g}
 function add(g:T.Object3D,mesh:T.Mesh,p:V=[0,0,0],axis:V=[0,0,1]){mesh.position.set(...p);mesh.quaternion.setFromUnitVectors(Z,new T.Vector3(...axis).normalize());g.add(mesh);return mesh}
 function cyl(g:T.Object3D,r:number,len:number,p:V,mat:T.Material=m.machined,axis:V=[0,0,1],r2=r,n=32){return add(g,new T.Mesh(new T.CylinderGeometry(r2,r,len,n).rotateX(Math.PI/2),mat),p,axis)}
 function ring(g:T.Object3D,r:number,inner:number,len:number,p:V,mat:T.Material=m.cast,axis:V=[0,0,1]){const a=annulus(r,inner,len,mat);const shape=(a.geometry as T.ExtrudeGeometry).parameters.shapes;a.geometry.dispose();a.geometry=new T.ExtrudeGeometry(shape,{depth:len,bevelEnabled:false,curveSegments:24});a.geometry.translate(0,0,-len/2);return add(g,a,p,axis)}
 function plate(g:T.Object3D,w:number,h:number,d:number,p:V,mat:T.Material=m.cast,r=5,axis:V=[0,0,1]){const original=roundedPlate(w,h,d,r,mat);const shape=(original.geometry as T.ExtrudeGeometry).parameters.shapes;original.geometry.dispose();const a=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:d,steps:1,bevelEnabled:true,bevelSize:Math.min(.5,d/4),bevelThickness:Math.min(.5,d/4),bevelSegments:1,curveSegments:Math.max(w,h)>100?12:4}),mat);a.geometry.translate(0,0,-d/2);return add(g,a,p,axis)}
 function line(g:T.Object3D,a:V,b:V,r:number,mat:T.Material=m.steel){const av=new T.Vector3(...a),bv=new T.Vector3(...b),delta=bv.clone().sub(av);return cyl(g,r,delta.length(),av.add(bv).multiplyScalar(.5).toArray() as V,mat,delta.toArray() as V)}
 function tube(g:T.Object3D,points:V[],r:number,mat:T.Material=m.rubber,segments=40){const curve=new T.CatmullRomCurve3(points.map(p=>new T.Vector3(...p)));const mesh=new T.Mesh(new T.TubeGeometry(curve,segments,r,10,false),mat);g.add(mesh);return mesh}
 function bolt(g:T.Object3D,p:V,axis:V=[0,0,1],r=4){cyl(g,r,3,p,m.machined,axis,r,6);ring(g,r*1.35,r*.5,1,[p[0]-axis[0]*2,p[1]-axis[1]*2,p[2]-axis[2]*2],m.steel,axis)}
 function gear(g:T.Object3D,r:number,inner:number,d:number,p:V,teeth:number,mat=m.steel){ring(g,r,inner,d,p,mat);for(let i=0;i<teeth;i++){const a=i*Math.PI*2/teeth;const tooth=plate(g,Math.PI*r/teeth*.9,4,d,[p[0]+r*Math.cos(a),p[1]+r*Math.sin(a),p[2]],mat,1);tooth.rotation.z=a-Math.PI/2}}
 function lathe(g:T.Object3D,profile:[number,number][],p:V,mat:T.Material=m.machined,axis:V=[0,1,0]){const geo=new T.LatheGeometry(profile.map(v=>new T.Vector2(...v)),64);geo.rotateX(Math.PI/2);return add(g,new T.Mesh(geo,mat),p,axis)}
 function helix(g:T.Object3D,r:number,len:number,wire:number,p:V,axis:V,turns=7){const points:V[]=[];for(let i=0;i<=turns*20;i++){const a=i/20*Math.PI*2;points.push([r*Math.cos(a),r*Math.sin(a),len*i/(turns*20)])}const temp=new T.Group();tube(temp,points,wire,m.steel,turns*20);temp.position.set(...p);temp.quaternion.setFromUnitVectors(Z,new T.Vector3(...axis).normalize());g.add(temp)}
 const crank=group('crankshaft'),rods=group('connecting-rods'),pistons=group('pistons')
 // Seven main journals and six distinct crankpins, paired throws 180 degrees apart.
 for(let i=0;i<7;i++)cyl(crank,25,24,[0,0,-180+i*60],m.machined)
 for(let i=0;i<6;i++){
  const a=(Math.floor(i/2)*120+(i%2)*180)*Math.PI/180,z=-150+i*60,px=33*Math.cos(a),py=33*Math.sin(a)
  cyl(crank,22,32,[px,py,z],m.machined)
  for(const dz of [-22,22]){const shape=new T.Shape();shape.moveTo(-28,-30);shape.bezierCurveTo(-34,-65,38,-65,36,-26);shape.lineTo(26,22);shape.bezierCurveTo(20,48,-18,48,-24,22);shape.closePath();const w=new T.Mesh(new T.ExtrudeGeometry(shape,{depth:12,bevelEnabled:true,bevelSize:2,bevelThickness:2,bevelSegments:3,curveSegments:12}),m.steel);w.geometry.translate(0,0,-6);const mesh=add(crank,w,[0,0,z+dz]);mesh.rotation.z=a+Math.PI/2}
  const side=i%2===0?-1:1,pistonX=side*(Math.sqrt(120**2-py**2))+px
  ring(rods,29,22.6,22,[px,py,z],m.steel)
  const pin:V=[pistonX,0,z];ring(rods,15,9,23,pin,m.steel)
  const rodOutline:[number,number][]=[[-12,22],[-8,88],[-13,105],[13,105],[8,88],[12,22]]
  const rod=contourPlate(rodOutline,9,m.steel,[],1);rod.geometry.translate(0,0,-4.5);const v=new T.Vector3(pistonX-px,-py,0);add(rods,rod,[px,py,z]).rotation.z=Math.atan2(v.y,v.x)-Math.PI/2
  for(const sign of [-1,1])bolt(rods,[px+sign*24,py-10,z+13],[0,0,1],3.5)
  // Open skirt, pin bore, crown, three independently visible ring grooves.
  ring(pistons,39.7,34,42,[pistonX+side*7,0,z],m.machined,[side,0,0]);cyl(pistons,39.7,5,[pistonX+side*30,0,z],m.machined,[side,0,0])
  for(const d of [19,23,27])ring(pistons,40,38.5,1.2,[pistonX+side*d,0,z],m.steel,[side,0,0])
  cyl(pistons,9,69,[pistonX,0,z],m.steel)
 }
 cyl(crank,21,42,[0,0,220],m.machined);gear(crank,30,18,12,[0,0,197],24)
 const cases=[group('crankcase-left'),group('crankcase-right')]
 for(const [index,s]of [[0,-1],[1,1]]){
  const g=cases[index]!
  // Split casting, curved roof, lower sump and real cylinder apertures.
  const outline:[number,number][]=[[-210,-66],[-210,53],[-198,75],[-160,87],[160,87],[198,68],[210,42],[210,-65],[185,-82],[-185,-82]]
  const shell=contourPlate(outline,7,m.cast,[{x:-s*(-120+s*30),y:0,r:41},{x:-30,y:0,r:41},{x:-s*(120+s*30),y:0,r:41}],2)
  // local plate x maps to longitudinal z, normal maps bank x.
  add(g,shell,[s*68,0,0],[s,0,0])
  for(const yy of [-75,78])plate(g,420,55,6,[s*36,yy,0],m.cast,12,[0,1,0]).rotateZ(Math.PI/2)
  for(const zz of [-208,208])plate(g,66,130,7,[s*36,0,zz],m.cast,16)
  for(let zz=-165;zz<180;zz+=55){plate(g,8,125,14,[s*65,0,zz],m.cast,2,[s,0,0]);bolt(g,[s*73,62,zz],[s,0,0]);bolt(g,[s*73,-58,zz],[s,0,0])}
  for(let zz=-180;zz<=180;zz+=60){
   const start=s===1?-Math.PI/2:Math.PI/2,end=start+Math.PI,seat=new T.Shape()
   seat.absarc(0,0,40,start,end,false);seat.lineTo(25.5*Math.cos(end),25.5*Math.sin(end));seat.absarc(0,0,25.5,end,start,true);seat.closePath()
   add(g,new T.Mesh(new T.ExtrudeGeometry(seat,{depth:12,bevelEnabled:false,curveSegments:24}),m.cast),[0,0,zz-6])
  }
 }
 const cylinders=[group('cylinders-left'),group('cylinders-right')],heads=[group('heads-left'),group('heads-right')]
 const cams=group('camshafts'),valves=group('valvetrain'),carriers=group('cam-carriers'),covers=group('valve-covers'),manifold=group('intake-manifolds'),carbs=group('carburetors')
 for(let bank=0;bank<2;bank++){
  const s=bank===0?-1:1,zs=[-120,0,120].map(z=>z+(s===1?30:-30))
  for(const z of zs){
   ring(cylinders[bank]!,46,40,115,[s*132,0,z],m.iron,[s,0,0]);for(let f=0;f<13;f++)ring(cylinders[bank]!,56+(f<2?2:0),44,2.4,[s*(79+f*8.6),0,z],m.iron,[s,0,0])
   // Studs surround each bore; they are not embossed black lines.
   for(const y of [-38,38])for(const dz of [-38,38]){line(cylinders[bank]!,[s*70,y,z+dz],[s*199,y,z+dz],2.5);bolt(heads[bank]!,[s*236,y,z+dz],[s,0,0],4)}
   const h=heads[bank]!
   ring(h,51,38,30,[s*205,0,z],m.cast,[s,0,0]);
   for(let f=0;f<8;f++){
    const hp=contourPlate([[-49,-52],[-49,45],[-32,54],[35,54],[50,34],[50,-40],[35,-53]],2.5,m.cast,[{x:0,y:0,r:35}],.5)
    add(h,hp,[s*(191+f*5),0,z],[s,0,0])
   }
   // The chamber must close the bore. Two valve openings pierce this inner face;
   // an empty fin stack would falsely teach that combustion escapes through it.
   const chamberOutline:[number,number][]=[]
   for(let i=0;i<64;i++){const a=i*Math.PI/32;chamberOutline.push([39*Math.cos(a),39*Math.sin(a)])}
   add(h,contourPlate(chamberOutline,6,m.cast,[{x:0,y:17,r:17.5},{x:0,y:-17,r:15.5}],.3),[s*222,0,z],[s,0,0])
   for(const sign of [-1,1])ring(h,sign===1?19:17,sign===1?17.2:15.2,3,[s*221,sign*17,z],m.machined,[s*.88,sign*.48,0])
   // Separate intake/exhaust valves enter each cylinder head at opposing inclinations.
   for(const sign of [-1,1]){
    const axis:V=[s*.88,sign*.48,0],p:V=[s*219,sign*17,z]
    cyl(valves,sign===1?17:15,3,p,m.steel,axis)
    line(valves,p,[s*267,sign*44,z],3.2,m.machined)
    helix(valves,8,25,1.5,[s*242,sign*30,z],axis,7)
    cyl(valves,10,3,[s*267,sign*44,z],m.machined,axis)
    line(valves,[s*270,sign*44,z],[s*285,sign*11,z],7,m.cast)
    cyl(valves,9,18,[s*281,sign*19,z],m.steel)
   }
   // Curved manifold runners, flange, studs and carburetor venturis.
   tube(manifold,[[s*219,38,z],[s*219,72,z],[s*205,105,z],[s*205,132,z]],18,m.cast)
   ring(manifold,25,17,6,[s*205,132,z],m.machined,[0,1,0]);
   for(const dz of [-23,23])bolt(manifold,[s*205,138,z+dz],[0,1,0],3)
   ring(carbs,25,18,64,[s*205,172,z],m.cast,[0,1,0]);
   lathe(carbs,[[18,0],[18,27],[19,33],[25,39],[27,39],[26,36],[21,30],[20,0]],[s*205,202,z],m.machined)
   cyl(carbs,16.7,1.5,[s*205,168,z],m.brass,[0,1,0]);line(carbs,[s*174,168,z],[s*234,168,z],2,m.steel)
   cyl(carbs,7,8,[s*232,178,z],m.brass,[s,0,0],7,6)
   for(const dz of [-22,22])bolt(carbs,[s*205,206,z+dz],[0,1,0],2.8)
  }
  // Continuous cam carrier and upper/lower ribbed covers, with plugs visible between.
  for(const y of [-51,51]){
   plate(carriers,338,40,19,[s*274,y,s*30],m.cast,9,[s,0,0])
   plate(covers,346,42,9,[s*299,y,s*30],m.cast,9,[s,0,0])
   for(let yy=y-14;yy<=y+14;yy+=7)line(covers,[s*305,yy,-150+s*30],[s*305,yy,150+s*30],2,m.cast)
   for(let zz=-150;zz<=150;zz+=75)bolt(covers,[s*307,y,zz+s*30],[s,0,0],4)
  }
  for(const z of [-160,160])ring(carriers,32,19,13,[s*278,0,z+s*30],m.cast)
  cyl(cams,13,365,[s*278,0,s*30],m.steel)
  for(let i=0;i<6;i++){
   const lobe:T.Vector2[]=[];for(let j=0;j<64;j++){const a=j*Math.PI*2/64,r=18+9*Math.max(0,Math.cos(a))**3;lobe.push(new T.Vector2(Math.cos(a)*r,Math.sin(a)*r))}
   const shape=new T.Shape(lobe);const lobemesh=add(cams,new T.Mesh(new T.ExtrudeGeometry(shape,{depth:13,bevelEnabled:true,bevelSize:.6,bevelThickness:.6,bevelSegments:2}),m.steel),[s*278,0,-142+i*53+s*30]);lobemesh.rotation.z=i*Math.PI/3
  }
  line(carbs,[s*229,164,-160+s*30],[s*229,164,160+s*30],3,m.machined)
  for(const z of [-100,100])plate(carbs,27,53,52,[s*242,175,z+s*30],m.cast,5)
 }
 const chains=group('timing-chains'),chaincase=group('timing-covers')
 // Intermediate shaft and two duplex chains, retained as a separate timing system.
 cyl(chains,14,355,[0,-48,0],m.steel);gear(chains,32,14,15,[0,-48,195],30)
 for(const s of [-1,1]){
  const z=215+s*18,center:V=[s*278,0,z];gear(chains,49,17,12,center,42)
  for(const dz of [-5,5]){
   const path=new T.CatmullRomCurve3([[s*13,-80,z+dz],[s*260,-49,z+dz],[s*324,-15,z+dz],[s*316,31,z+dz],[s*270,50,z+dz],[s*10,-16,z+dz],[-s*23,-48,z+dz]].map(p=>new T.Vector3(...p)),true,'centripetal')
   for(let i=0;i<110;i++){const p=path.getPointAt(i/110),tan=path.getTangentAt(i/110);cyl(chains,2.7,8,p.toArray() as V,m.steel,[0,0,1],2.7,10);const link=plate(chains,9,4,2,[p.x,p.y,p.z+4.5],m.machined,1.8);link.rotation.z=Math.atan2(tan.y,tan.x)}
  }
  // Guide rail, idler and tensioner: chain control is part of the mechanism.
  plate(chains,116,8,12,[s*173,-51,z],m.dark,3).rotation.z=s*.10
  gear(chains,16,5,9,[s*105,14,z],18)
  cyl(chains,11,30,[s*105,-29,z],m.cast,[0,1,0]);cyl(chains,5,31,[s*105,-1,z],m.machined,[0,1,0])
  const contour:[number,number][]=[[s*5,-95],[s*5,-10],[s*255,66],[s*325,49],[s*345,10],[s*336,-60],[s*270,-77]]
  const mesh=contourPlate(contour,9,m.cast,[],4);add(chaincase,mesh,[0,0,z+15]);
  for(const [x,y]of contour)bolt(chaincase,[x,y,z+26],[0,0,1],4)
 }
 const fanHousing=group('fan-housing'),fan=group('fan'),alternator=group('alternator'),drive=group('fan-drive'),shroud=group('cooling-shroud')
 ring(fanHousing,125,118,58,[0,155,216],m.cast);ring(fanHousing,128,118,5,[0,155,247],m.machined)
 for(const a of [0,120,240]){const rad=a*Math.PI/180;line(fanHousing,[Math.cos(rad)*45,155+Math.sin(rad)*45,188],[Math.cos(rad)*116,155+Math.sin(rad)*116,188],6,m.cast)}
 cyl(alternator,44,110,[0,155,151],m.cast);for(let i=0;i<14;i++){const a=i*Math.PI/7;line(alternator,[45*Math.cos(a),155+45*Math.sin(a),107],[45*Math.cos(a),155+45*Math.sin(a),198],2,m.cast)}
 cyl(fan,48,42,[0,155,225],m.cast,undefined,36)
 // Eleven curved, pitched blades with actual thickness and changing normals.
 for(let i=0;i<11;i++){
  const positions:number[]=[],indices:number[]=[]
  for(let side=0;side<2;side++)for(let u=0;u<=12;u++)for(let v=0;v<=6;v++){
   const r=43+u/12*72,a=i*Math.PI*2/11+.19*u/12+(v/6-.5)*.24,z=220+(v/6-.5)*32+Math.sin(u/12*Math.PI)*5+side*2
   positions.push(r*Math.cos(a),155+r*Math.sin(a),z)
  }
  const n=13*7
  for(let side=0;side<2;side++)for(let u=0;u<12;u++)for(let v=0;v<6;v++){const a=side*n+u*7+v,b=a+7;indices.push(...(side?[a,b,a+1,b,b+1,a+1]:[a,a+1,b,b,a+1,b+1]))}
  for(let u=0;u<12;u++)for(const v of [0,6]){const a=u*7+v,b=a+7;indices.push(a,b,a+n,b,b+n,a+n)}
  for(let v=0;v<6;v++)for(const u of [0,12]){const a=u*7+v,b=a+1;indices.push(a,a+n,b,b,a+n,b+n)}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setIndex(indices);geo.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(positions.length/3*2),2));geo.computeVertexNormals();fan.add(new T.Mesh(geo,m.cast))
 }
 for(const [y,r,z]of [[155,48,260],[0,62,269]]){lathe(drive,[[10,-7],[r,-7],[r,-3],[r-6,0],[r,3],[r,7],[10,7],[10,-7]],[0,y,z],m.machined,[0,0,1]);bolt(drive,[0,y,z+10],[0,0,1],10)}
 tube(drive,[[-49,155,270],[-41,188,270],[0,205,270],[41,188,270],[49,155,270],[62,0,270],[44,-44,270],[0,-62,270],[-44,-44,270],[-62,0,270],[-49,155,270]],3.7,m.rubber,120)
 // Rounded air duct covering the cylinder banks, with a circular fan mouth.
 const hood=new T.Shape();hood.moveTo(-180,65);hood.lineTo(-160,180);hood.quadraticCurveTo(-135,255,0,268);hood.quadraticCurveTo(135,255,160,180);hood.lineTo(180,65);hood.lineTo(-180,65)
 // Open-ended canopy retains a real ventilation cavity.
 const raw=new T.ExtrudeGeometry(hood,{depth:280,bevelEnabled:true,bevelSize:5,bevelThickness:5,bevelSegments:3,curveSegments:32})
 const sideGroup=raw.groups.find(g=>g.materialIndex===1)!;const sideGeo=new T.BufferGeometry();for(const name of ['position','normal','uv']){const a=raw.getAttribute(name);sideGeo.setAttribute(name,new T.BufferAttribute((a.array as Float32Array).slice(sideGroup.start*a.itemSize,(sideGroup.start+sideGroup.count)*a.itemSize),a.itemSize))}
 const shroudMat=m.dark.clone();shroudMat.side=T.DoubleSide;add(shroud,new T.Mesh(sideGeo,shroudMat),[0,0,-105]);
 const back=contourPlate([[-180,65],[-150,190],[-85,250],[85,250],[150,190],[180,65]],3,m.dark,[],5);add(shroud,back,[0,0,-108])
 for(const s of [-1,1])tube(shroud,[[s*103,105,202],[s*164,100,210],[s*245,75,210],[s*280,30,200]],23,m.dark)
 const ignition=group('ignition');cyl(ignition,26,65,[-91,69,190],m.cast,[0,1,0]);cyl(ignition,29,27,[-91,110,190],m.bakelite,[0,1,0])
 for(let i=0;i<6;i++){const s=i<3?-1:1,z=-120+(i%3)*120+s*30,a=i*Math.PI/3,start:V=[-91+23*Math.cos(a),127,190+23*Math.sin(a)];cyl(ignition,5,13,start,m.rubber,[0,1,0]);tube(ignition,[start,[s*90,190,165],[s*165,164,z],[s*285,17,z]],3.2,m.rubber);cyl(ignition,6.5,24,[s*270,17,z],m.ceramic,[s,0,0]);cyl(ignition,8,11,[s*252,17,z],m.machined,[s,0,0],8,6)}
 const oilPump=group('oil-pump')
 // Permanent open inspection window, explicitly documented as a sectioned housing.
 const pumpOutline:[number,number][]=[[-42,-22],[-35,-28],[35,-28],[42,-22],[42,22],[35,28],[-35,28],[-42,22]]
 for(const z of [-122,-86,-55])add(oilPump,contourPlate(pumpOutline,4,m.cast,[{x:-18,y:0,r:8},{x:18,y:0,r:8}],1),[0,-51,z])
 for(const x of [-40,40])plate(oilPump,4,43,67,[x,-51,-89],m.cast,2)
 plate(oilPump,80,4,67,[0,-76,-89],m.cast,2)
 for(const z of [-110,-71])for(const x of [-18,18])gear(oilPump,17,4,z===-110?18:12,[x,-51,z],12,m.machined)
 for(const x of [-18,18])cyl(oilPump,4,73,[x,-51,-89],m.steel)
 for(const x of [-33,33])for(const y of [-68,-34])bolt(oilPump,[x,y,-50])
 const cooler=group('oil-cooler');plate(cooler,65,180,40,[105,120,-175],m.cast,8);for(let y=40;y<205;y+=5)plate(cooler,78,1.5,47,[105,y,-175],m.machined,1);for(const y of [30,215])plate(cooler,78,13,50,[105,y,-175],m.cast,5)
 const lines=group('oil-lines');for(const s of [-1,1])for(const z of [-110,110]){line(lines,[s*70,-50,z],[s*257,-50,z],9,m.machined);for(const x of [78,245])ring(lines,11,8,9,[s*x,-50,z],m.rubber,[s,0,0])}
 tube(lines,[[70,-58,-140],[90,-100,-160],[175,-105,-190],[240,-65,-200]],9,m.rubber);for(const x of [72,240])cyl(lines,14,18,[x,-65,-200],m.brass,[1,0,0],14,6)
 const exhaust=group('exhaust');for(const s of [-1,1])for(const z of [-120,0,120]){tube(exhaust,[[s*219,-38,z+s*30],[s*230,-110,z+s*30],[s*200,-153,z+s*30],[s*180,-167,220]],18,m.exhaust,45);ring(exhaust,25,17,5,[s*219,-42,z+s*30],m.machined,[0,1,0])}
 lathe(exhaust,[[0,-275],[40,-273],[50,-250],[52,-210],[52,210],[50,250],[40,273],[0,275]], [0,-150,320],m.exhaust,[1,0,0])
 for(const x of [-190,190])ring(exhaust,54,52,13,[x,-150,320],m.machined,[1,0,0]);tube(exhaust,[[-240,-150,320],[-300,-150,330],[-325,-140,365]],20,m.exhaust)
 const flywheel=group('flywheel');cyl(flywheel,118,17,[0,0,-218],m.steel);gear(flywheel,121,98,8,[0,0,-228],105,m.steel);ring(flywheel,96,40,5,[0,0,-230],m.machined);for(let i=0;i<6;i++){const a=i*Math.PI/3;bolt(flywheel,[30*Math.cos(a),30*Math.sin(a),-235],[0,0,-1],5)}
 const air=group('air-cleaner');for(const s of [-1,1]){plate(air,110,356,65,[s*205,278,s*30],m.dark,52,[0,1,0]);for(const z of [-135,135])bolt(air,[s*205,315,z+s*30],[0,1,0],4);line(air,[s*153,272,-135+s*30],[s*153,272,135+s*30],2,m.machined)}tube(air,[[-205,292,-100],[-100,300,-170],[100,300,-170],[205,292,-100]],30,m.dark)
 // Flatten each component by material: retain independent parts, reduce draw calls.
 root.updateMatrixWorld(true)
 for(const component of [...root.children]){
  const buckets=new Map<T.Material,T.BufferGeometry[]>();component.traverse(n=>{if(n instanceof T.Mesh){const mats=Array.isArray(n.material)?n.material:[n.material];if(mats.length!==1)throw Error('Unexpected multi-material');const geo=n.geometry.clone().applyMatrix4(n.matrixWorld);if(geo.index) {const flat=geo.toNonIndexed();geo.dispose();buckets.set(mats[0]!,[...(buckets.get(mats[0]!)??[]),flat])} else buckets.set(mats[0]!,[...(buckets.get(mats[0]!)??[]),geo])}})
  component.clear();let i=0;for(const [material,geometries]of buckets){const merged=mergeGeometries(geometries,false);if(!merged)throw Error('Cannot merge component '+component.name);const indexed=mergeVertices(merged,1e-4);merged.dispose();const mesh=new T.Mesh(indexed,material);mesh.name=component.name+'_surface_'+i++;component.add(mesh);geometries.forEach(g=>g.dispose())}
 }
 return root
}
