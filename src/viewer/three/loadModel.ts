import * as THREE from "three"
import { GLTFLoader, type GLTF } from "three/addons/loaders/GLTFLoader.js"
import type { ExplodeSpec } from "../../spec/schema.ts"
import {inspectionStops} from '../../spec/scene3d.ts'
import { asset } from "../asset.ts"
import { disposeObject, type ExplodableModel, type ExplodablePart } from "./model.ts"
import { createWatch } from "./watch.ts"
import { solidifyCover } from "./solidify.ts"

export async function loadModel(spec: ExplodeSpec): Promise<ExplodableModel> {
  if (spec.scene3d?.kind === "procedural-watch") return createWatch()
  if (spec.scene3d?.kind !== "gltf") throw new Error("This object has no 3D scene.")
  return prepareModel(spec, await new GLTFLoader().loadAsync(asset(spec.scene3d.url)))
}

/** Separate loaded geometry without changing its authored assembly or materials. */
export function prepareModel(spec: ExplodeSpec, loaded: Pick<GLTF, "scene" | "animations">): ExplodableModel {
  if (spec.scene3d?.kind !== "gltf") throw new Error("Expected a multipart model spec.")
  const root = new THREE.Group()
  root.add(loaded.scene)
  const omitted = new THREE.Group()
  try {
    const definitions = spec.scene3d.parts
    const mappedNames = new Set(definitions.flatMap(p => p.nodes ?? [p.node!]).flatMap(name => [name, THREE.PropertyBinding.sanitizeNodeName(name)]))
    const omissions = spec.scene3d.omittedNodes ?? []
    if (new Set(omissions.map(o => o.node)).size !== omissions.length) throw new Error('Duplicate omitted model nodes.')
    for (const exclusion of omissions) {
      const node = loaded.scene.getObjectByName(exclusion.node) ?? loaded.scene.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(exclusion.node))
      if (!node) throw new Error(`Omitted node “${exclusion.node}” was not found.`)
      let conflict = false
      node.traverse(child => { if (mappedNames.has(child.name)) conflict = true })
      for (let parent = node.parent; parent; parent = parent.parent) if (mappedNames.has(parent.name)) conflict = true
      if (conflict) throw new Error('A mapped component cannot also be omitted.')
      // Documented non-component rendering helpers are removed before the story.
      // Actual components never disappear or change opacity during the animation.
      omitted.add(node)
    }
    const initial = new THREE.Box3().setFromObject(loaded.scene)
    if (initial.isEmpty()) throw new Error("The 3D model contains no visible geometry.")
    const size = initial.getSize(new THREE.Vector3())
    loaded.scene.scale.multiplyScalar(7 / Math.max(size.x, size.y, size.z, 0.001))
    loaded.scene.updateMatrixWorld(true)
    loaded.scene.position.sub(new THREE.Box3().setFromObject(loaded.scene).getCenter(new THREE.Vector3()))
    root.updateMatrixWorld(true)
    if (new Set(definitions.map((part) => part.componentId)).size !== definitions.length) throw new Error("Each component must have one part mapping.")
    const groups = definitions.map((part) => {
      if (!spec.components.some((component) => component.id === part.componentId)) throw new Error(`Unknown component “${part.componentId}”.`)
      return (part.nodes ?? [part.node!]).map((name) => {
        // GLTFLoader sanitizes spaces and punctuation for animation binding.
        const node = loaded.scene.getObjectByName(name) ?? loaded.scene.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name))
        if (!node) throw new Error(`3D part “${name}” was not found in the model.`)
        return node
      })
    })
    const nodes = groups.flat()
    if (new Set(nodes).size !== nodes.length) throw new Error("Each 3D part must reference different model nodes.")
    for (const node of nodes) {
      for (let parent = node.parent; parent; parent = parent.parent) {
        if (nodes.includes(parent)) throw new Error("3D parts must not contain other mapped parts.")
      }
    }
    if (spec.scene3d.requireCompleteMapping) {
      const uncovered: string[] = []
      loaded.scene.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return
        for (let ancestor: THREE.Object3D | null = object; ancestor; ancestor = ancestor.parent) if (nodes.includes(ancestor)) return
        uncovered.push(object.name)
      })
      if (uncovered.length) throw new Error(`Unmapped model surfaces: ${uncovered.join(', ')}. Map them or document non-component omissions.`)
    }
    const parts: ExplodablePart[] = definitions.map((part, index) => {
      if (part.coverThickness) {
        for (const node of groups[index]!) node.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return
          const worldScale = object.getWorldScale(new THREE.Vector3())
          const old = object.geometry
          object.geometry = solidifyCover(old, part.coverThickness! / worldScale.z)
          // The source remains untouched on disk; only this view's geometry changes.
          old.dispose()
          const materials = Array.isArray(object.material) ? object.material : [object.material]
          for (const material of materials) if (material instanceof THREE.MeshPhysicalMaterial) {
            material.thickness = 0 // Thin-walled transmission avoids refracting through nearby dial surfaces.
            material.roughness = 0.015
          }
        })
      }
      if (part.reverseSurface) {
        const reverseDefinition = part.reverseSurface
        const surfaces: THREE.Mesh[] = []
        for (const node of groups[index]!) node.traverse(object => { if (object instanceof THREE.Mesh) surfaces.push(object) })
        let backing: THREE.MeshStandardMaterial | undefined
        const makeBacking = () => new THREE.MeshStandardMaterial({ color: reverseDefinition.color, roughness: reverseDefinition.roughness, metalness: 0, side: THREE.BackSide })
        for (const surface of surfaces) {
          const materials = Array.isArray(surface.material) ? surface.material : [surface.material]
          // Preserve optical surfaces. Only opaque, single-sided source faces
          // receive an explicitly declared, untextured reverse visualization.
          if (materials.some(material => material.side !== THREE.FrontSide || material.opacity < .99 || (material instanceof THREE.MeshPhysicalMaterial && material.transmission > 0))) continue
          backing ??= makeBacking()
          const reverse = new THREE.Mesh(surface.geometry, backing)
          reverse.name = `${surface.name}_unverified_reverse`
          reverse.userData = { role: 'visualization-backing', evidence: 'unverified', note: part.reverseSurface.note }
          surface.add(reverse)
        }
      }
      const bounds = new THREE.Box3()
      for (const node of groups[index]!) bounds.union(new THREE.Box3().setFromObject(node))
      if (bounds.isEmpty()) throw new Error(`3D part “${part.componentId}” has no geometry.`)
      const group = new THREE.Group()
      group.name = `explode_${part.componentId}`
      group.position.copy(bounds.getCenter(new THREE.Vector3()))
      root.add(group)
      for (const node of groups[index]!) group.attach(node)
      const home = group.position.clone()
      return { id: part.componentId, group, home, opened: home.clone().add(new THREE.Vector3(...part.offset)), orientation: group.quaternion.clone(), distance: part.distance ?? 0, shot: part.shot, doubleSided: part.doubleSided }
    })
    const mixer = new THREE.AnimationMixer(root)
    for (const clip of loaded.animations) mixer.clipAction(clip).play()
    return {
      root, parts, inspections: inspectionStops(spec),
      animate: (time) => mixer.setTime(time),
      dispose: () => { mixer.stopAllAction(); mixer.uncacheRoot(root); disposeObject(root); disposeObject(omitted) },
    }
  } catch (error) { disposeObject(root); disposeObject(omitted); throw error }
}
