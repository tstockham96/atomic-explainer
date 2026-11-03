import * as T from 'three'
import {toCreasedNormals} from 'three/addons/utils/BufferGeometryUtils.js'

/** Starting points for observed finishes, never an automatic material classifier.
 * Values describe appearance; alloy, coating and wear still need object evidence. */
export const FINISHES = {
  cast: { color:'#afb2ae', roughness:.44, metalness:1, tileMm:12, reliefMm:.04, grain:'isotropic' },
  machined: { color:'#c2c4c2', roughness:.29, metalness:1, tileMm:4, reliefMm:.0015, grain:'linear' },
  steel: { color:'#a0a4a6', roughness:.39, metalness:1, tileMm:4, reliefMm:.002, grain:'linear' },
  iron: { color:'#70726e', roughness:.73, metalness:1, tileMm:6, reliefMm:.012, grain:'isotropic' },
  coated: { color:'#171819', roughness:.38, metalness:0, tileMm:3, reliefMm:.0015, grain:'isotropic' },
  rubber: { color:'#161717', roughness:.82, metalness:0, tileMm:2, reliefMm:.001, grain:'isotropic' },
  brass: { color:'#d3b777', roughness:.32, metalness:1, tileMm:3, reliefMm:.001, grain:'linear' },
  copper: { color:'#d79a79', roughness:.34, metalness:1, tileMm:3, reliefMm:.001, grain:'linear' },
  exhaust: { color:'#96958f', roughness:.66, metalness:1, tileMm:6, reliefMm:.004, grain:'isotropic' },
  resin: { color:'#472a22', roughness:.35, metalness:0, tileMm:2, reliefMm:.0005, grain:'isotropic' },
  ceramic: { color:'#d0cdc0', roughness:.27, metalness:0, tileMm:2, reliefMm:.0004, grain:'isotropic' },
  pcb: { color:'#181e1b', roughness:.47, metalness:0, tileMm:2, reliefMm:.0007, grain:'isotropic' },
  package: { color:'#232526', roughness:.76, metalness:0, tileMm:2, reliefMm:.0012, grain:'isotropic' },
  flex: { color:'#603c20', roughness:.39, metalness:0, tileMm:2, reliefMm:.0003, grain:'linear' },
  graphite: { color:'#303333', roughness:.86, metalness:0, tileMm:2, reliefMm:.001, grain:'isotropic' },
  foil: { color:'#bdc0bd', roughness:.43, metalness:1, tileMm:4, reliefMm:.0008, grain:'linear' },
} as const
export type Finish = keyof typeof FINISHES

// Core glTF normal + packed roughness/metalness maps, not a renderer-specific
// bump extension. Relief/texel spacing are both in mm, so normals remain correct
// when the viewer normalizes a phone and an engine to the same screen size.
export function surfaceFinish(kind:Finish, options:{color?:string; evidence?:string}={}) {
  const f=FINISHES[kind], size=kind==='cast'?256:128, height=new Float32Array(size*size)
  let seed=731;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}
  const lines=Float32Array.from({length:size},random)
  for(let y=0;y<size;y++)for(let x=0;x<size;x++)height[y*size+x]=f.grain==='linear'?lines[x]!*.85+random()*.15:random()
  // Periodic filtering avoids white-noise sparkle and visible tile boundaries.
  const at=(x:number,y:number)=>height[((y+size)%size)*size+(x+size)%size]!
  const smooth=new Float32Array(height.length)
  for(let y=0;y<size;y++)for(let x=0;x<size;x++)smooth[y*size+x]=(at(x,y)*4+at(x-1,y)+at(x+1,y)+at(x,y-1)+at(x,y+1))/8
  height.set(smooth)
  // Cast metal has spatial structure at more than one scale. Pure one-texel
  // noise disappears into mipmaps at assembly scale, leaving a plastic sheet.
  const broad=new Float32Array(size*size)
  if(kind==='cast'){
    const coarse=Float32Array.from({length:32*32},random)
    const noise=(x:number,y:number)=>{
      const ix=Math.floor(x)%32,iy=Math.floor(y)%32,fx=x-Math.floor(x),fy=y-Math.floor(y),u=fx*fx*(3-2*fx),v=fy*fy*(3-2*fy)
      return T.MathUtils.lerp(T.MathUtils.lerp(coarse[iy*32+ix]!,coarse[iy*32+(ix+1)%32]!,u),T.MathUtils.lerp(coarse[((iy+1)%32)*32+ix]!,coarse[((iy+1)%32)*32+(ix+1)%32]!,u),v)
    }
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const i=y*size+x; broad[i]=noise(x*8/size,y*8/size)
      height[i]=height[i]!*.22+noise(x*32/size,y*32/size)*.55+broad[i]!*.23
    }
  }
  const normal=new Uint8Array(size*size*4), packed=new Uint8Array(normal.length),spacing=f.tileMm/size
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const dx=-(at(x+1,y)-at(x-1,y))*f.reliefMm/(2*spacing),dy=-(at(x,y+1)-at(x,y-1))*f.reliefMm/(2*spacing),len=Math.hypot(dx,dy,1),i=(y*size+x)*4
    normal.set([(dx/len*.5+.5)*255,(dy/len*.5+.5)*255,(1/len*.5+.5)*255,255],i)
    packed.set([255,T.MathUtils.clamp(f.roughness+(at(x,y)-.5)*(kind==='cast'?.07:.16)+(kind==='cast'?(broad[y*size+x]!-.5)*.03:0),.08,.96)*255,255,255],i)
  }
  const texture=(data:Uint8Array)=>{
    let t:T.Texture
    if(typeof document!=='undefined'){
      const canvas=document.createElement('canvas');canvas.width=canvas.height=size
      canvas.getContext('2d')!.putImageData(new ImageData(new Uint8ClampedArray(data),size,size),0,0)
      t=new T.CanvasTexture(canvas);t.flipY=false
    }else t=new T.DataTexture(data,size,size)
    t.wrapS=t.wrapT=T.RepeatWrapping;t.magFilter=T.LinearFilter;t.minFilter=T.LinearMipmapLinearFilter;t.generateMipmaps=true;t.anisotropy=8;t.needsUpdate=true;return t
  }
  const roughnessMap=texture(packed)
  const material=new T.MeshStandardMaterial({color:options.color??f.color,metalness:f.metalness,roughness:1,normalMap:texture(normal),roughnessMap,metalnessMap:roughnessMap})
  material.name=`Surface · ${kind}`
  material.userData.surfaceFinish={version:1,kind,tileMm:f.tileMm,reliefMm:f.reliefMm,grain:f.grain,basis:'approximation',evidence:options.evidence??'Generic finish; verify against component references',substrate:'unverified',uvUnits:'millimetres'}
  return material
}

/** Object-space box projection in authoring millimetres. Each triangle gets a
 * non-degenerate chart, including backs/edges. Only opt-in procedural surfaces;
 * never remap manufacturer textures, labels or calibrated artwork. The charts
 * can seam on complex curvature: such surfaces need a purpose-authored unwrap. */
export function finishUV(source:T.BufferGeometry,tileMm:number) {
  if(!Number.isFinite(tileMm)||tileMm<=0)throw Error('A finish needs a positive physical tile size')
  const geo=source.index?source.toNonIndexed():source.clone(),p=geo.getAttribute('position'),uv=new Float32Array(p.count*2)
  const a=new T.Vector3(),b=new T.Vector3(),c=new T.Vector3(),n=new T.Vector3()
  for(let i=0;i<p.count;i+=3){
    a.fromBufferAttribute(p,i);b.fromBufferAttribute(p,i+1);c.fromBufferAttribute(p,i+2);n.crossVectors(b.sub(a),c.sub(a))
    const axis=Math.abs(n.x)>Math.abs(n.y)&&Math.abs(n.x)>Math.abs(n.z)?0:Math.abs(n.y)>Math.abs(n.z)?1:2
    for(let j=i;j<i+3;j++){
      const x=p.getX(j),y=p.getY(j),z=p.getZ(j)
      const u=axis===0?-z*Math.sign(n.x):axis===1?x:x*Math.sign(n.z),v=axis===1?-z*Math.sign(n.y):y
      uv[j*2]=u/tileMm;uv[j*2+1]=v/tileMm
    }
  }
  geo.setAttribute('uv',new T.BufferAttribute(uv,2));return geo
}

export function prepareFinishUVs(root:T.Object3D) {
  root.traverse(node=>{
    if(!(node instanceof T.Mesh)||Array.isArray(node.material))return
    const finish=node.material.userData.surfaceFinish
    if(!finish)return
    // Explicit authoring contract: local geometry dimensions are millimetres;
    // source/imported meshes aren't tagged and are left untouched.
    // toCreasedNormals mutates non-indexed inputs: protect the source normals.
    const smooth=toCreasedNormals(node.geometry.clone(),Math.PI/6)
    // Keep planar caps planar: averaging bevel normals into their long triangles
    // creates star-shaped highlights on otherwise flat castings and board faces.
    const flat=node.geometry.index?node.geometry.toNonIndexed():node.geometry
    const originalNormals=flat.getAttribute('normal'),normals=smooth.getAttribute('normal')
    for(let i=0;i<normals.count;i++)if(Math.max(Math.abs(originalNormals.getX(i)),Math.abs(originalNormals.getY(i)),Math.abs(originalNormals.getZ(i)))>.99999)normals.setXYZ(i,originalNormals.getX(i),originalNormals.getY(i),originalNormals.getZ(i))
    if(flat!==node.geometry)flat.dispose()
    node.geometry=finishUV(smooth,finish.tileMm)
    smooth.dispose()
  })
}
