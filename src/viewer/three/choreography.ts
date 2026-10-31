import { inspectionTurn } from './optics.ts'
import { inspectionDistance } from './inspection.ts'
import * as THREE from "three"
import type { ExplodableModel } from "./model.ts"
import { sampleScene, ease } from "./timeline.ts"

const up = new THREE.Vector3(0, 1, 0)
const hero = new THREE.Vector3(0.38, 0.23, 1).normalize()
const overview = new THREE.Vector3(1, 0.48, 0.55).normalize()
export const STORY_FOV = 32

export function corners(box: THREE.Box3) {
  return [0, 1, 2, 3, 4, 5, 6, 7].map((bits) => new THREE.Vector3(bits & 1 ? box.max.x : box.min.x, bits & 2 ? box.max.y : box.min.y, bits & 4 ? box.max.z : box.min.z))
}

/** Frame actual geometry in camera space; portrait and landscape use the same scene. */
export function frameBox(box: THREE.Box3, direction: THREE.Vector3, aspect: number, coverage: [number, number] = [0.83, 0.69]) {
  const backward = direction.clone().normalize()
  const right = new THREE.Vector3().crossVectors(up, backward).normalize()
  const cameraUp = new THREE.Vector3().crossVectors(backward, right).normalize()
  const target = box.getCenter(new THREE.Vector3())
  const tangent = Math.tan(THREE.MathUtils.degToRad(STORY_FOV / 2))
  let distance = 1
  for (const point of corners(box)) {
    point.sub(target)
    distance = Math.max(distance, point.dot(backward) + Math.max(Math.abs(point.dot(right)) / (tangent * aspect * coverage[0]), Math.abs(point.dot(cameraUp)) / (tangent * coverage[1])))
  }
  return { position: target.clone().addScaledVector(backward, distance), target, right, up: cameraUp, distance }
}

export function poseModel(model: ExplodableModel, progress: number) {
  const sample = sampleScene(progress, model.parts.length)
  // One assembled turn; parts retain their orientation when the assembly opens.
  model.root.rotation.set(-0.04, sample.turn * Math.PI * 2, -0.10)
  model.root.position.set(0, 0, 0)
  for (const part of model.parts) {
    part.group.position.lerpVectors(part.home, part.opened, sample.separation)
    part.group.quaternion.copy(part.orientation)
  }
  model.root.updateMatrixWorld(true)
  // Measure the unparked assembly so departing context never pushes the camera back.
  model.overviewBounds = new THREE.Box3().setFromObject(model.root)
  if (sample.index >= 0 && sample.focus > 0) {
    const clearance = model.overviewBounds.getSize(new THREE.Vector3()).length() * 2.5
    for (let i = 0; i < model.parts.length; i++) {
      if (i !== sample.index) model.parts[i]!.group.position.y -= clearance * sample.focus
    }
    model.root.updateMatrixWorld(true)
  }
  return sample
}

export function cameraShot(model: ExplodableModel, progress: number, aspect: number) {
  const sample = sampleScene(progress, model.parts.length)
  const narrow = aspect < 0.85
  const direction = hero.clone().lerp(overview, ease(sample.separation)).normalize()
  const bounds = model.overviewBounds ?? new THREE.Box3().setFromObject(model.root)
  const shot = frameBox(bounds, direction, aspect, narrow ? [0.85, THREE.MathUtils.lerp(.40, .55, sample.separation)] : [0.85, THREE.MathUtils.lerp(.52, .68, sample.separation)])
  const lift = shot.up.clone().multiplyScalar(-shot.distance * Math.tan(THREE.MathUtils.degToRad(STORY_FOV / 2)) * .16 * (1 - sample.separation))
  shot.target.add(lift); shot.position.add(lift)
  const selected = model.parts[sample.index]
  if (selected && sample.focus > 0) {
    const partBox = new THREE.Box3().setFromObject(selected.group)
    const from = new THREE.Vector3(...(selected.shot?.from ?? [0.55, 0.15, 1]))
    const orbit = from.normalize().applyAxisAngle(up, inspectionTurn(sample.local,.28,.72))
    const coverage: [number, number] = narrow ? [0.76, 0.39] : [0.49, 0.72]
    const focus = frameBox(partBox, orbit, aspect, coverage)
    focus.distance = Math.max(selected.distance,inspectionDistance(partBox,STORY_FOV,aspect,coverage))
    focus.position.copy(focus.target).addScaledVector(orbit, focus.distance)
    const tangent = Math.tan(THREE.MathUtils.degToRad(STORY_FOV / 2))
    const offset = narrow ? focus.up.multiplyScalar(-focus.distance * tangent * 0.35) : focus.right.multiplyScalar(focus.distance * tangent * aspect * 0.37)
    focus.target.add(offset); focus.position.add(offset)
    shot.position.lerp(focus.position, sample.focus)
    shot.target.lerp(focus.target, sample.focus)
  }
  return shot
}
