import * as THREE from "three"

/** A photographic softbox rig: broad highlights describe metal and glass edges. */
export function createStudioEnvironment(renderer: THREE.WebGLRenderer) {
  const room = new THREE.Scene()
  room.background = new THREE.Color(0x232b34)
  const cards: THREE.Mesh[] = []
  const panel = (position: [number, number, number], size: [number, number], color: number, intensity: number) => {
    const material = new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide })
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...size), material)
    mesh.position.set(...position); mesh.lookAt(0, 0, 0)
    room.add(mesh); cards.push(mesh)
  }
  panel([-5, 4, 5], [3, 8], 0xfff5df, 6)
  panel([5, 1, 2], [1.3, 7], 0xc8e2ff, 4)
  panel([0, 7, -2], [6, 3], 0xffffff, 5)
  panel([-1, -4, 4], [5, 2], 0xffffff, 1.2)
  const pmrem = new THREE.PMREMGenerator(renderer)
  const environment = pmrem.fromScene(room, 0.025)
  for (const card of cards) { card.geometry.dispose(); (card.material as THREE.Material).dispose() }
  pmrem.dispose()
  return environment
}

/** Narrow, moderate white strips on a dark surround. Glass needs a restrained
 * reflection rig; the high-output broad softboxes for metal obscure its interior. */
export function createGlassEnvironment(renderer: THREE.WebGLRenderer) {
  const room = new THREE.Scene()
  room.background = new THREE.Color('#080c10')
  const panels: THREE.Mesh[] = []
  // Rear-facing flat windows need a readable strip too. Position it inside
  // their reflected field of view; increasing opacity is not the remedy.
  for (const [x,y,z,w,h,power] of [[-28,14,50,3,65,1.5],[38,-5,30,2,45,1.1],[-12,-6,-50,2,55,1.5]]) {
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:new THREE.Color().setScalar(power),side:THREE.DoubleSide}))
    panel.position.set(x,y,z);panel.lookAt(0,0,0);room.add(panel);panels.push(panel)
  }
  const generator = new THREE.PMREMGenerator(renderer)
  const environment = generator.fromScene(room,.015)
  generator.dispose()
  for (const panel of panels) { panel.geometry.dispose(); (panel.material as THREE.Material).dispose() }
  return environment
}
