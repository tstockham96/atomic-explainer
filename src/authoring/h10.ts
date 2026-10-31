import * as T from 'three'
import { engravedSatin, planarSurfaceUV, frontSurfaceGroups } from './surface.ts'

type Finishes={steel:T.Material;polish:T.Material;nickel:T.Material;brass:T.Material;dark:T.Material;ruby:T.Material}

/** Visible topology follows the actual 42 mm Murph rear macros (Fratello 2019,
 * SJX 2020) and Hamilton's H-10 family photo. Hidden gearing remains illustrative.
 * Coordinates are an estimated rear view in mm, with the crown to the left.
 */
export function buildH10(part:(id:string)=>T.Group,m:Finishes){
 const headFinish=new T.MeshStandardMaterial({color:'#c1c6c5',metalness:.72,roughness:.36})
 const add=(p:T.Object3D,g:T.BufferGeometry,mat:T.Material|T.Material[],x=0,y=0,z=0)=>{const o=new T.Mesh(g,mat);o.position.set(x,y,z);p.add(o);return o}
 const disc=(r:number,h:number)=>new T.CylinderGeometry(r,r,h,96).rotateX(Math.PI/2)
 const ring=(p:T.Object3D,r:number,inner:number,h:number,x=0,y=0,z=0,mat=m.polish)=>{
  const b=Math.min(.055,h/4,(r-inner)/4),pts=[[inner+b,-h/2],[r-b,-h/2],[r,-h/2+b],[r,h/2-b],[r-b,h/2],[inner+b,h/2],[inner,h/2-b],[inner,-h/2+b],[inner+b,-h/2]]
  return add(p,new T.LatheGeometry(pts.map(v=>new T.Vector2(v[0]!,v[1]!)),128).rotateX(Math.PI/2),mat,x,y,z)
 }
 const solid=(p:T.Object3D,s:T.Shape,h:number,z:number,mat:T.Material|T.Material[]=m.nickel,b=.045)=>{const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:3,steps:1,curveSegments:48});g.translate(0,0,-h/2);return add(p,g,mat,0,0,z)}
 const hole=(s:T.Shape,x:number,y:number,r:number)=>{const h=new T.Path();h.absarc(x,y,r,0,Math.PI*2,true);s.holes.push(h)}
 const screw=(p:T.Object3D,x:number,y:number,z:number,r=.6)=>{
  ring(p,r+.18,r*.85,.15,x,y,z,m.nickel);add(p,disc(r,.13),headFinish,x,y,z+.035)
  const slot=add(p,new T.BoxGeometry(r*1.6,.115,.035),m.dark,x,y,z+.11);slot.rotation.z=x*.38+y*.53
 }
 const jewel=(p:T.Object3D,x:number,y:number,z:number,r=.25)=>{
  ring(p,r*1.6,r*.95,.11,x,y,z,m.brass);add(p,disc(r,.1),m.ruby,x,y,z+.02);add(p,disc(r*.2,.12),m.dark,x,y,z+.025)
 }
 const assembly=(id:string,z=-.85)=>{const p=part(id);p.position.z=z;p.rotation.y=Math.PI;return p}
 const movement=assembly('movement'),bridgePack=new T.Group();bridgePack.name='bridge_pack';movement.add(bridgePack)
 // Layered mainplate, recessed balance pocket and a continuous circular perimeter.
 add(movement,disc(12.8,.38),m.nickel,0,0,-1.15)
 ring(movement,13.3,12.65,2.5,0,0,-.05,m.steel)
 const perimeter=new T.Shape();perimeter.absarc(0,0,12.75,0,Math.PI*2,false);hole(perimeter,.7,7.4,4.15)
 solid(movement,perimeter,.3,-.73,m.nickel)
 // Peripheral scallops and polished fixing seats, visible in both exact-model macros.
 for(const [x,y,r]of [[-11.1,-2.6,.73],[-9.0,-8.0,.72],[6.7,-10.5,.6],[10.9,-4.3,.68],[9.7,6.4,.65],[-6.8,10.2,.55]]){
  ring(movement,r+.3,r,.13,x,y,-.47,m.polish);add(movement,disc(r,.06),m.dark,x,y,-.52);screw(movement,x,y,-.38,r*.65)
 }
 // Broad automatic bridge: most wheels are covered in an assembled H-10.
 const bridge=new T.Shape();bridge.moveTo(-6.5,4.6)
 bridge.bezierCurveTo(-9.2,3.2,-9.1,-2.9,-6.3,-6.6)
 bridge.bezierCurveTo(-3.7,-9.1,1.6,-8.8,5.7,-6.0)
 bridge.bezierCurveTo(8.9,-3.1,8.3,2.5,5.1,5.1)
 bridge.bezierCurveTo(2.5,6.6,-2.9,6.0,-6.5,4.6);bridge.closePath()
 for(const [x,y]of [[-5.95,1.1],[-4.3,-5.8],[5.9,-2.5]])hole(bridge,x,y,.64)
 solid(bridgePack,bridge,.55,.65,m.nickel,.065)
 // A curved step across the automatic bridge, rather than independent polygon tiles.
 const step=new T.Shape();step.absarc(0,0,7.6,2.5,5.65,false);step.absarc(0,0,6.75,5.65,2.5,true);step.closePath();solid(bridgePack,step,.24,1.03,m.steel,.045)
 for(const [x,y]of [[-5.95,1.1],[-4.3,-5.8],[5.9,-2.5]])screw(bridgePack,x,y,1.12,.63)
 for(const [x,y]of [[-1.8,3.3],[4.1,2.1],[5.5,.1],[2.6,-4.8]])jewel(bridgePack,x,y,1.01,.22)
 // Rotor bearing support remains on the bridge when the oscillating weight lifts.
 ring(bridgePack,2.65,1.15,.3,0,0,1.09,m.nickel);add(bridgePack,disc(.8,.4),m.polish,0,0,1.18)
 const barrelBridge=new T.Shape();barrelBridge.moveTo(6.3,5.1);barrelBridge.bezierCurveTo(8.6,4,9.8,1.2,9.1,-2.4);barrelBridge.lineTo(11.5,-3.7);barrelBridge.bezierCurveTo(13.0,1,11.1,7,7.9,9.5);barrelBridge.lineTo(5.2,8.8);barrelBridge.quadraticCurveTo(4.8,6.6,6.3,5.1);barrelBridge.closePath();hole(barrelBridge,9.5,4.5,.65)
 solid(bridgePack,barrelBridge,.45,.45,m.nickel);screw(bridgePack,9.5,4.5,.75,.57)
 // Small dark drill holes and raised dowels are separate geometry.
 for(const [x,y]of [[10.8,-2.2],[7.3,8.7],[-8.6,-7.8],[-7.5,8.6]]){add(movement,disc(.35,.05),m.dark,x,y,-.36);ring(movement,.48,.34,.07,x,y,-.33,m.polish)}

 const wheels:T.Group[]=[]
 function gear(parent:T.Object3D,x:number,y:number,r:number,teeth:number,z:number,open=true,mat=m.brass){
  const group=new T.Group();group.position.set(x,y,z);parent.add(group);wheels.push(group)
  const shape=new T.Shape();for(let i=0;i<teeth*4;i++){const a=i/teeth/4*Math.PI*2,rad=r-((i%4===0||i%4===3)?.14:0);if(i===0)shape.moveTo(Math.cos(a)*rad,Math.sin(a)*rad);else shape.lineTo(Math.cos(a)*rad,Math.sin(a)*rad)}shape.closePath()
  if(open)hole(shape,0,0,r*.73);solid(group,shape,.18,0,mat,.012)
  if(open)for(let i=0;i<5;i++){const a=i*Math.PI*2/5;const arm=add(group,new T.BoxGeometry(.13,r*.78,.13),mat,-Math.sin(a)*r*.39,Math.cos(a)*r*.39);arm.rotation.z=a}
  add(group,disc(.36,.27),headFinish,0,0,.03);return group
 }
 const winding=assembly('winding-train')
 gear(winding,-8.6,-3.8,2.15,40,.06,false,m.steel)
 gear(winding,-6.3,-7,2.45,48,.04,false,m.brass)
 screw(winding,-8.6,-3.8,.25,.42);screw(winding,-6.3,-7,.25,.46)
 const reversing=gear(winding,4.8,3.9,2.35,52,.22,false);reversing.name='reversing_wheel'
 gear(winding,4.5,-3.5,2.35,52,.23,false)
 const barrel=assembly('barrel');gear(barrel,5.3,-6.4,3.3,78,-.19,false)
 add(barrel,disc(3.1,.55),m.brass,5.3,-6.4,-.13);ring(barrel,3.1,2.92,.08,5.3,-6.4,.19,m.polish)
 const springPoints=[];for(let i=0;i<=320;i++){const a=i/320*Math.PI*14,r=.3+i/320*2.55;springPoints.push(new T.Vector3(5.3+Math.cos(a)*r,-6.4+Math.sin(a)*r,-.45))}
 add(barrel,new T.TubeGeometry(new T.CatmullRomCurve3(springPoints),640,.022,5,false),m.steel)
 const train=assembly('wheel-train')
 gear(train,.9,-2.6,2.65,68,-.24).name='center_wheel';gear(train,-2.9,.4,2.2,58,-.05).name='third_wheel';gear(train,-1.7,4.1,1.65,45,.05).name='fourth_wheel'
 const escape=assembly('escapement');gear(escape,-2.0,6.5,1.0,15,.1,false,m.steel)
 const fork=new T.Shape();fork.moveTo(-1.4,6.7);fork.lineTo(-.6,6.4);fork.lineTo(.05,7.0);fork.lineTo(.3,6.7);fork.lineTo(-.45,6.0);fork.lineTo(-1.55,6.35);fork.closePath();solid(escape,fork,.14,.35,m.polish,.015)
 jewel(escape,-.55,6.25,.47,.16)
 const balance=assembly('balance'),balanceWheel=new T.Group();balanceWheel.name='balance_wheel';balanceWheel.position.set(.7,7.4,-.1);balance.add(balanceWheel)
 ring(balanceWheel,3.7,3.47,.24,0,0,0,m.brass)
 for(let i=0;i<3;i++){const a=i*Math.PI*2/3;const arm=add(balanceWheel,new T.BoxGeometry(.18,3.5,.14),m.brass,-Math.sin(a)*1.75,Math.cos(a)*1.75);arm.rotation.z=a}
 // Two opposed regulating weights visible on the reference wheel rim.
 for(const a of [0,Math.PI]){add(balanceWheel,disc(.25,.22),m.brass,Math.cos(a)*3.45,Math.sin(a)*3.45,.12);screw(balanceWheel,Math.cos(a)*3.45,Math.sin(a)*3.45,.23,.16)}
 const hair=[];for(let i=0;i<=320;i++){const a=i/320*Math.PI*16,r=.32+i/320*2.5;hair.push(new T.Vector3(Math.cos(a)*r,Math.sin(a)*r,.3))}add(balanceWheel,new T.TubeGeometry(new T.CatmullRomCurve3(hair),640,.012,5,false),m.steel)
 // Distinctive broad balance cock and large round shock setting.
 const cock=new T.Shape();cock.moveTo(-8.8,5.2);cock.quadraticCurveTo(-9.2,6.0,-8,6.8);cock.lineTo(-1.1,8.7);cock.quadraticCurveTo(.5,9.4,2.0,8.5);cock.quadraticCurveTo(3.1,7.2,1.6,6.0);cock.quadraticCurveTo(.6,5.3,-.8,5.8);cock.lineTo(-6.9,3.7);cock.quadraticCurveTo(-8,3.5,-8.8,5.2);cock.closePath();hole(cock,-5.8,5.65,.58);hole(cock,-8,5.25,.68)
 solid(balance,cock,.45,.93,m.nickel,.055);screw(balance,-8,5.25,1.19,.56)
 ring(balance,1.55,.87,.34,.7,7.4,1.32,m.polish);ring(balance,1.04,.54,.15,.7,7.4,1.57,m.steel)
 jewel(balance,.7,7.4,1.63,.39)
 for(let i=0;i<3;i++){const a=i*Math.PI*2/3+.3;const prong=add(balance,new T.BoxGeometry(.12,.65,.07),m.brass,.7-Math.sin(a)*.43,7.4+Math.cos(a)*.43,1.72);prong.rotation.z=a}

 const rotor=assembly('rotor',-2.95),rotorPivot=new T.Group();rotorPivot.name='rotor_pivot';rotor.add(rotorPivot)
 const rotorShape=new T.Shape();rotorShape.absarc(0,0,12.65,.12,Math.PI-.12,false)
 rotorShape.lineTo(-7.8,1.5);rotorShape.bezierCurveTo(-5.8,1.45,-5.1,-.6,-4.55,-1.7)
 rotorShape.bezierCurveTo(-3.35,-4.65,3.35,-4.65,4.55,-1.7)
 rotorShape.bezierCurveTo(5.1,-.6,5.8,1.45,7.8,1.5);rotorShape.lineTo(12.56,1.5);rotorShape.closePath()
 for(const sign of [-1,1]){const h=new T.Path();h.moveTo(sign*3.75,4.1);h.quadraticCurveTo(sign*4.1,5.9,sign*5.5,7.0);h.quadraticCurveTo(sign*6.7,7.65,sign*7.8,6.5);h.quadraticCurveTo(sign*8.5,5.75,sign*7.95,4.85);h.quadraticCurveTo(sign*5.9,4.9,sign*3.75,4.1);h.closePath();rotorShape.holes.push(h)}
 // Hamilton's four-point mark is cut through the metal; there is real depth below it.
 const star=new T.Path();for(let i=0;i<8;i++){const a=i*Math.PI/4+Math.PI/2,r=i%2===0?1.25:.27;const x=Math.cos(a)*r,y=6.6+Math.sin(a)*r;if(i===0)star.moveTo(x,y);else star.lineTo(x,y)}star.closePath();rotorShape.holes.push(star)
 hole(rotorShape,0,0,1.05)
 const rotorFinish=engravedSatin(25.3,ctx=>{
  const arcText=(text:string,r:number,span:number,size:number,outline=false,start=0)=>{ctx.font=`${size}px Arial`;for(let i=0;i<text.length;i++){const angle=start-span/2+i*span/(text.length-1);ctx.save();ctx.rotate(angle);if(outline){ctx.lineWidth=.025;ctx.strokeText(text[i]!,0,-r)}else ctx.fillText(text[i]!,0,-r);ctx.restore()}}
  arcText('HAMILTON',10.45,1.7,.95,true)
  arcText('TWENTY-FIVE 25 JEWELS',3.25,4.35,.43)
  arcText('SWISS',3.25,.65,.43,false,Math.PI)
 })
 const rotorReverse=engravedSatin(25.3)
 const rotorFace=solid(rotorPivot,rotorShape,.55,0,[rotorFinish,m.nickel,rotorReverse],.045)
 rotorFace.name='rotor_engraved_solid';frontSurfaceGroups(planarSurfaceUV(rotorFace.geometry,25.3),2)
 rotorFace.userData.surfaceArtwork='UV-bound to cap triangles; cutouts remain empty'

 const weight=new T.Shape();weight.absarc(0,0,12.65,.12,Math.PI-.12,false);weight.absarc(0,0,11.15,Math.PI-.12,.12,true);weight.closePath()
 const weightFinish=engravedSatin(25.3,()=>{},'radial')
 const weightSolid=solid(rotorPivot,weight,.85,0,[weightFinish,m.steel],.035)
 weightSolid.name='rotor_weight';frontSurfaceGroups(planarSurfaceUV(weightSolid.geometry,25.3),0)
 ring(rotorPivot,2.0,1.37,.18,0,0,.39,m.steel);ring(rotorPivot,1.58,1.1,.21,0,0,.49,m.brass)
 ring(rotorPivot,1.65,1.1,.12,0,0,-.34,m.steel)
 for(let i=0;i<10;i++){const a=i*Math.PI/5;add(rotorPivot,new T.SphereGeometry(.13,12,8),m.polish,Math.cos(a)*1.72,Math.sin(a)*1.72,.47)}
 screw(rotorPivot,0,0,.61,.91)
 return {rotorPivot,balanceWheel,bridgePack,wheels}
}
