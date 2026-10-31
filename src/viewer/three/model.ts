import * as THREE from "three"

export interface ExplodablePart {
  id: string
  group: THREE.Group
  home: THREE.Vector3
  opened: THREE.Vector3
  orientation: THREE.Quaternion
  distance: number
  doubleSided?: boolean
  shot?: { from: [number, number, number]; to: [number, number, number] }
}
export interface ExplodableModel {
  root: THREE.Group
  overviewBounds?: THREE.Box3
  parts: ExplodablePart[]
  animate: (time: number) => void
  dispose: () => void
}

export function disposeObject(root: THREE.Object3D) {
  const geometry = new Set<THREE.BufferGeometry>()
  const materials = new Set<THREE.Material>()
  const textures = new Set<THREE.Texture>()
  root.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return
    geometry.add(object.geometry)
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material)
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value)
    }
  })
  geometry.forEach((item) => item.dispose())
  materials.forEach((item) => item.dispose())
  textures.forEach((item) => item.dispose())
}
