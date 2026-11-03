import {surfaceFinish,finishUV} from './finishes.ts'
import * as T from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { alignWatchReference, hollowCase } from './fitReference.ts'
import type { ExplodeSpec } from '../spec/schema.ts'
import { createClearGlass } from '../viewer/three/optics.ts'
import { buildH10 } from './h10.ts'
import { buildMurphHands } from './hands.ts'
import { createCrystalGeometry, murphFront, murphCrystalZ, murphRear } from './crystal.ts'

/** Research-led educational assembly. Millimetres; front is +Z; crown is +X.
 * External dimensions follow H70605731. Unpublished internal geometry is illustrative.
 * No photographic watch surfaces are projected onto the case or movement.
 */
export async function buildMurph(dialUrl: string, strapUrl: string | undefined, study: ExplodeSpec) {
  if(study.item.reference!=='H70605731'||!study.understanding)throw Error('The Murph builder requires its researched component dossier.')
  const root = new T.Group(); root.name = 'Murph_researched_assembly'
  const parts: Record<string, T.Group> = {}
  const part = (id: string) => { const p = new T.Group(); p.name = id; root.add(p); parts[id] = p; return p }
  const steel=surfaceFinish('steel',{color:'#c3c7c9',evidence:'Murph reference photographs: brushed silver steel surfaces; grain is an appearance approximation'})
  const polish = new T.MeshPhysicalMaterial({ color: '#e0e3e5', metalness: 1, roughness: .14, clearcoat: .2 })
  const nickel=surfaceFinish('machined',{color:'#c6c8c3',evidence:'Silver movement supports; plating and substrate not established'})
  const brass = new T.MeshStandardMaterial({ color: '#b59b60', metalness: .88, roughness: .3 })
  const dark = new T.MeshStandardMaterial({ color: '#171b1d', metalness: .7, roughness: .4 })
  const lume = new T.MeshStandardMaterial({ color: '#d9caa6', roughness: .78 })
  const ruby = new T.MeshPhysicalMaterial({ color: '#8c1741', metalness: .35, roughness: .16, clearcoat: 1 })
  const rubber = new T.MeshStandardMaterial({ color: '#141516', roughness: .85 })
  const glass = createClearGlass(1.76)
  const rearGlass = glass.clone(); rearGlass.ior = 1.5 // optical appearance only; rear composition unverified
  glass.userData.opticalEvidence={composition:'sapphire',basis:'documented',profile:'photo-informed curved reconstruction'}
  rearGlass.userData.opticalEvidence={composition:'unverified',basis:'observed transparent window',ior:'1.5 is a presentation assumption, not a composition claim',profile:'photo-informed flat reconstruction'}
  const add = (p: T.Object3D, g: T.BufferGeometry, m: T.Material | T.Material[], x = 0, y = 0, z = 0, name = '') => {
    const geometry=!Array.isArray(m)&&m.userData.surfaceFinish?finishUV(g,m.userData.surfaceFinish.tileMm):g
    const o = new T.Mesh(geometry, m); o.position.set(x,y,z); o.name = name; p.add(o); return o
  }
  const disc = (r: number, h: number, n = 128) => new T.CylinderGeometry(r,r,h,n).rotateX(Math.PI/2)
  const ring = (p: T.Object3D, outer: number, inner: number, z: number, h: number, m: T.Material, bevel = .045) => {
    // Revolved profiles give continuous smooth normals and real open cavities.
    const b = Math.min(bevel,h/3,(outer-inner)/3)
    const profile = [[inner+b,-h/2],[outer-b,-h/2],[outer,-h/2+b],[outer,h/2-b],[outer-b,h/2],[inner+b,h/2],[inner,h/2-b],[inner,-h/2+b],[inner+b,-h/2]]
    return add(p, new T.LatheGeometry(profile.map(([r,v])=>new T.Vector2(r!,v!)),192).rotateX(Math.PI/2),m,0,0,z)
  }
  const extrude = (p:T.Object3D, shape:T.Shape, h:number, z:number, m:T.Material, b=.035) => {
    const g = new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:true,bevelSize:b,bevelThickness:b,bevelSegments:3,curveSegments:32,steps:1});g.translate(0,0,-h/2)
    return add(p,g,m,0,0,z)
  }
  // A 42 mm smooth case with an actual through cavity. Lugs taper and curve down.
  const body=part('case')
  if(!strapUrl){
  ring(body,21,17.65,-.8,5.2,steel,.24)
  ring(body,20.85,17.45,2.25,.7,polish,.16)
  ring(body,20.75,17.5,1.88,.38,polish,.07)
  ring(body,18.2,17.35,1.7,1.05,steel,.06)
  for(const side of [-1,1])for(const end of [-1,1]) {
    const s=new T.Shape();s.moveTo(side*11, end*17.6);s.lineTo(side*16.4,end*13.2)
    s.bezierCurveTo(side*16.5,end*18.9,side*15.0,end*23.9,side*14.6,end*26.3)
    s.quadraticCurveTo(side*13.3,end*26.8,side*11.15,end*26.2);s.lineTo(side*11.1,end*20.5);s.closePath()
    const lug=extrude(body,s,4.5,-.25,steel,.22)
    // Downturn follows the longitudinal position; recalculate normals after deformation.
    const pos=lug.geometry.attributes.position!;for(let i=0;i<pos.count;i++){const y=Math.abs(pos.getY(i));pos.setZ(i,pos.getZ(i)-Math.max(0,y-19)*.25)}
    lug.geometry.deleteAttribute('normal');lug.geometry=mergeVertices(lug.geometry);lug.geometry.computeVertexNormals()
  }
  for(const end of [-1,1]) {const bar=add(body,disc(.65,22.5,32),steel,0,end*23.7,-1.25);bar.rotation.y=Math.PI/2}
  }

  const crown=part('crown');crown.position.set(22.65,0,-.1)
  const crownCore=add(crown,disc(3.3,2.7,96),polish);crownCore.rotation.y=Math.PI/2
  for(let i=0;i<40;i++){const a=i*Math.PI/20;const flute=add(crown,new T.BoxGeometry(2.4,.28,.4),steel,0,Math.cos(a)*3.2,Math.sin(a)*3.2);flute.rotation.x=a}
  const cap=add(crown,disc(2.85,.2,96),polish,1.45);cap.rotation.y=Math.PI/2
  const stem=add(crown,disc(.42,7,32),steel,-4);stem.rotation.y=Math.PI/2
  // Raised H is geometry on the cap, never a photograph.
  for(const y of [-.8,.8]) add(crown,new T.BoxGeometry(.04,.22,1.8),steel,1.57,y)
  add(crown,new T.BoxGeometry(.04,1.6,.22),steel,1.57)

  const crystal=part('crystal');crystal.position.z=murphCrystalZ
  add(crystal,createCrystalGeometry(murphFront.profile),glass,0,0,0,'front_sapphire')
  const seals=part('seals');ring(seals,17.64,17.36,murphFront.seatZ-.08,.16,rubber,.03)
  ring(seals,17.8,17.54,-3.7,.2,rubber,.03)

  const dial=part('dial');dial.position.z=murphFront.dialZ
  const dialMat=new T.MeshStandardMaterial({color:'#141515',roughness:.87})
  add(dial,disc(17.38,.38,192),dialMat)
  const texture=await new T.TextureLoader().loadAsync(dialUrl);texture.colorSpace=T.SRGBColorSpace;texture.anisotropy=8
  add(dial,new T.CircleGeometry(17.32,192),new T.MeshStandardMaterial({map:texture,roughness:.87,metalness:0,polygonOffset:true,polygonOffsetFactor:-2}),0,0,.23,'clean_dial_artwork')
  // Attachment feet are visible only from the reverse; positions are illustrative.
  for(const [x,y]of [[-9,7],[9,-7]])add(dial,disc(.35,1.2,24),brass,x,y,-.76)

  const hands=part('hands');hands.position.z=murphFront.handsZ
  const handMetal=new T.MeshPhysicalMaterial({color:'#c8cbc7',metalness:1,roughness:.32,anisotropy:.3})
  const {hour,minute,seconds}=buildMurphHands(hands,handMetal,polish,lume,dark)

  const back=part('caseback');back.position.z=-4.45
  ring(back,20.15,14.8,0,1.0,polish,.12);ring(back,18.9,15.0,-.55,.22,steel,.045)
  for(let i=0;i<6;i++){const a=i*Math.PI/3;const notch=add(back,new T.BoxGeometry(.9,1.45,.1),dark,Math.sin(a)*18.6,Math.cos(a)*18.6,-.55);notch.rotation.z=-a}
  const window=part('rear-window');window.position.z=murphRear.z;add(window,createCrystalGeometry(murphRear.profile),rearGlass,0,0,0,'transparent_rear_window')

  const {rotorPivot,balanceWheel,bridgePack,wheels}=buildH10(part,{steel,polish,nickel,brass,dark,ruby})

  const strap=part('strap')
  if(strapUrl){
    const raw=(await new GLTFLoader().loadAsync(strapUrl)).scene
    root.add(raw);const {caseMesh}=alignWatchReference(raw)
    // Retain the exterior silhouette the user preferred, but open a real cavity through it.
    const shell=hollowCase(caseMesh);const caseMaterial=(caseMesh.material as T.MeshStandardMaterial).clone()
    caseMaterial.metalness=.95;caseMaterial.metalnessMap=null;caseMaterial.roughness=.29;caseMaterial.roughnessMap=null;caseMaterial.normalScale.setScalar(.035)
    body.clear();add(body,shell,caseMaterial,0,0,0,'reference_fitted_exterior')
    ring(body,17.7,17.3,-.6,5.7,steel,.09)
    for(const id of [1,2,4,5,7,10]){const o=raw.getObjectByName(`tripo_part_${id}`)!;strap.attach(o);o.traverse(n=>{if(n instanceof T.Mesh){const m=(n.material as T.MeshStandardMaterial).clone();m.metalness=0;m.metalnessMap=null;m.roughness=.7;m.roughnessMap=null;m.normalScale.setScalar(.12);n.material=m}})}
    root.remove(raw)
  }
  // Continuous support beneath the gasket closes the irregular reference-mesh seat.
  // This retaining ledge stays with the case when the optical solid is lifted.
  ring(body,17.7,17.3,murphFront.seatZ-.26,.2,polish,.035)
  root.userData={reference:study.item.reference,researchScope:study.understanding.identityScope,kind:'educational-reconstruction',unresolved:study.understanding.unresolved,notManufacturerCAD:true}
  for(const[id,p]of Object.entries(parts)){
    const evidence=study.understanding.components.find(c=>c.componentId===id)
    if(!evidence)throw Error(`No researched construction brief for ${id}`)
    p.userData={componentId:id,function:evidence.function,claims:evidence.claims,referenceIds:evidence.reconstruction.referenceIds,geometryScope:['movement','rotor','winding-train','mainspring','barrel','wheel-train','escapement','balance','seals'].includes(id)?'illustrative, informed by family/general references':'reconstructed appearance; not CAD',unknowns:evidence.unknowns}
  }
  root.updateMatrixWorld(true)
  return {root,parts,rotorPivot,balanceWheel,bridgePack,hour,minute,seconds,wheels}
}
